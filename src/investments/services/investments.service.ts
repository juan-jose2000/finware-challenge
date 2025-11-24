import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Investment, InvestmentStatus } from '../entities/investment.entity';
import { User } from '../../auth/entities/user.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { InvestmentResponseDto } from '../dto/investment-response.dto';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    private dataSource: DataSource,
  ) {}

  // Create investment with concurrency control - This method prevents race conditions using database transactions and pessimistic locking
  async create(createInvestmentDto: CreateInvestmentDto, userId: number): Promise<InvestmentResponseDto> {
    const { opportunityId, amount } = createInvestmentDto;

    // Validate opportunity exists and amount constraints
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${opportunityId} not found`);
    }

    if (amount > opportunity.totalAmount) {
      throw new BadRequestException(
        `Investment amount ($${amount.toLocaleString()}) exceeds opportunity total ($${opportunity.totalAmount.toLocaleString()})`
      );
    }

    // Use database transaction with pessimistic locking to prevent race conditions
    return await this.dataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      
      // Lock the user record with pessimistic write lock - This prevents other transactions from reading/modifying the user's balance
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }, // this line Prevents concurrent access - important
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check sufficient balance - after acquiring lock
      if (user.balance < amount) {
        this.logger.warn(`User ${userId} insufficient balance.`);
        throw new BadRequestException(
          `Insufficient balance. Available: $${user.balance.toLocaleString()}, Required: $${amount.toLocaleString()}`
        );
      }

      const balanceBefore = user.balance;
      const balanceAfter = user.balance - amount;

      // Create investment record
      const investment = transactionalEntityManager.create(Investment, {
        userId,
        opportunityId,
        investmentAmount: amount,
        status: InvestmentStatus.COMPLETED,
        balanceBefore,
        balanceAfter,
        notes: `Investment in ${opportunity.name}`,
      });

      const savedInvestment = await transactionalEntityManager.save(Investment, investment);

      // Update user balance - atomically within transaction
      await transactionalEntityManager.update(User, userId, {
        balance: balanceAfter,
        updatedAt: new Date(),
      });

      this.logger.log(`Investment ${savedInvestment.id} completed`);

      // Return response with opportunity details
      return this.mapToResponseDto(savedInvestment, opportunity);
    });
  }

  async findAllByUser(userId: number): Promise<InvestmentResponseDto[]> {
    const investments = await this.investmentRepository.find({
      where: { userId },
      relations: ['opportunity'],
      order: { createdAt: 'DESC' },
    });

    return investments.map(investment => this.mapToResponseDto(investment, investment.opportunity));
  }

  async findOne(id: number, userId: number): Promise<InvestmentResponseDto> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId },
      relations: ['opportunity'],
    });

    if (!investment) {
      throw new NotFoundException(`Investment with ID ${id} not found`);
    }

    return this.mapToResponseDto(investment, investment.opportunity);
  }

  async getUserBalance(userId: number): Promise<{ balance: number; totalInvested: number }> {
    // Get current balance
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Calculate total invested
    const result = await this.investmentRepository
      .createQueryBuilder('investment')
      .select('SUM(investment.investmentAmount)', 'total')
      .where('investment.userId = :userId AND investment.status = :status', {
        userId,
        status: InvestmentStatus.COMPLETED,
      })
      .getRawOne();

    const totalInvested = parseFloat(result?.total || '0');

    return {
      balance: user.balance,
      totalInvested,
    };
  }

  private mapToResponseDto(investment: Investment, opportunity?: Opportunity): InvestmentResponseDto {
    return {
      id: investment.id,
      userId: investment.userId,
      opportunityId: investment.opportunityId,
      investmentAmount: investment.investmentAmount,
      status: investment.status,
      balanceBefore: investment.balanceBefore,
      balanceAfter: investment.balanceAfter,
      notes: investment.notes,
      createdAt: investment.createdAt,
      opportunity: opportunity ? {
        id: opportunity.id,
        name: opportunity.name,
        totalAmount: opportunity.totalAmount,
      } : undefined,
    };
  }
}
