import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InvestmentsService } from '../services/investments.service';
import { Investment, InvestmentStatus } from '../entities/investment.entity';
import { User } from '../../auth/entities/user.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { CreateInvestmentDto } from '../dto/create-investment.dto';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let investmentRepository: Repository<Investment>;
  let userRepository: Repository<User>;
  let opportunityRepository: Repository<Opportunity>;
  let dataSource: DataSource;

  const mockInvestmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockOpportunityRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockTransactionalEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        {
          provide: getRepositoryToken(Investment),
          useValue: mockInvestmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: mockOpportunityRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
    investmentRepository = module.get<Repository<Investment>>(getRepositoryToken(Investment));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    opportunityRepository = module.get<Repository<Opportunity>>(getRepositoryToken(Opportunity));
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('create', () => {
    it('should create investment successfully with sufficient balance', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 5000,
      };

      const userId = 1;
      const opportunity = {
        id: 1,
        name: 'Test Opportunity',
        totalAmount: 100000,
      };

      const user = {
        id: userId,
        balance: 10000, // Sufficient balance
      };

      const investment = {
        id: 1,
        userId,
        opportunityId: 1,
        investmentAmount: 5000,
        status: InvestmentStatus.COMPLETED,
        balanceBefore: 10000,
        balanceAfter: 5000,
        notes: `Investment in ${opportunity.name}`,
        createdAt: new Date(),
      };

      // Setup mocks
      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);
      mockTransactionalEntityManager.findOne.mockResolvedValue(user);
      mockTransactionalEntityManager.create.mockReturnValue(investment);
      mockTransactionalEntityManager.save.mockResolvedValue(investment);

      // Mock transaction
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionalEntityManager);
      });

      const result = await service.create(createDto, userId);

      expect(mockOpportunityRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      expect(mockTransactionalEntityManager.update).toHaveBeenCalledWith(User, userId, {
        balance: 5000,
        updatedAt: expect.any(Date),
      });

      expect(result).toEqual({
        id: 1,
        userId,
        opportunityId: 1,
        investmentAmount: 5000,
        status: InvestmentStatus.COMPLETED,
        balanceBefore: 10000,
        balanceAfter: 5000,
        notes: `Investment in ${opportunity.name}`,
        createdAt: expect.any(Date),
        opportunity: {
          id: 1,
          name: 'Test Opportunity',
          totalAmount: 100000,
        },
      });
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 5000,
      };

      const userId = 1;
      const opportunity = {
        id: 1,
        name: 'Test Opportunity',
        totalAmount: 100000,
      };

      const user = {
        id: userId,
        balance: 3000, // Insufficient balance
      };

      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionalEntityManager);
      });

      mockTransactionalEntityManager.findOne.mockResolvedValue(user);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        'Insufficient balance. Available: $3,000, Required: $5,000'
      );

      expect(mockTransactionalEntityManager.save).not.toHaveBeenCalled();
      expect(mockTransactionalEntityManager.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent opportunity', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 999,
        amount: 5000,
      };

      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        'Opportunity with ID 999 not found'
      );

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 5000,
      };

      const opportunity = { id: 1, name: 'Test', totalAmount: 100000 };
      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionalEntityManager);
      });

      mockTransactionalEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        'User with ID 1 not found'
      );
    });

    it('should throw BadRequestException for amount exceeding opportunity total', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 200000, // Exceeds opportunity total
      };

      const opportunity = {
        id: 1,
        name: 'Test Opportunity',
        totalAmount: 100000,
      };

      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        'Investment amount ($200,000) exceeds opportunity total ($100,000)'
      );

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should handle transaction rollback on error', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 5000,
      };

      const opportunity = { id: 1, name: 'Test', totalAmount: 100000 };
      const user = { id: 1, balance: 10000 };

      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);

      // Simulate transaction failure
      mockDataSource.transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto, 1)).rejects.toThrow('Database error');

      // Verify transaction was attempted
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('should return user investments with relations', async () => {
      const userId = 1;
      const investments = [
        {
          id: 1,
          userId,
          opportunityId: 1,
          investmentAmount: 5000,
          status: InvestmentStatus.COMPLETED,
          balanceBefore: 10000,
          balanceAfter: 5000,
          notes: 'Test investment',
          createdAt: new Date(),
          opportunity: { id: 1, name: 'Test Opp', totalAmount: 100000 },
        },
      ];

      mockInvestmentRepository.find.mockResolvedValue(investments);

      const result = await service.findAllByUser(userId);

      expect(mockInvestmentRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['opportunity'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual([
        {
          id: 1,
          userId,
          opportunityId: 1,
          investmentAmount: 5000,
          status: InvestmentStatus.COMPLETED,
          balanceBefore: 10000,
          balanceAfter: 5000,
          notes: 'Test investment',
          createdAt: expect.any(Date),
          opportunity: { id: 1, name: 'Test Opp', totalAmount: 100000 },
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return specific investment for user', async () => {
      const userId = 1;
      const investmentId = 1;
      const investment = {
        id: investmentId,
        userId,
        opportunityId: 1,
        investmentAmount: 5000,
        status: InvestmentStatus.COMPLETED,
        balanceBefore: 10000,
        balanceAfter: 5000,
        notes: 'Test investment',
        createdAt: new Date(),
        opportunity: { id: 1, name: 'Test Opp', totalAmount: 100000 },
      };

      mockInvestmentRepository.findOne.mockResolvedValue(investment);

      const result = await service.findOne(investmentId, userId);

      expect(mockInvestmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: investmentId, userId },
        relations: ['opportunity'],
      });

      expect(result).toEqual(investment);
    });

    it('should throw NotFoundException for non-existent investment', async () => {
      mockInvestmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(
        'Investment with ID 1 not found'
      );
    });
  });

  describe('getUserBalance', () => {
    it('should return user balance and total invested', async () => {
      const userId = 1;
      const user = { id: userId, balance: 5000 };
      const totalInvested = 5000;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockInvestmentRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: totalInvested.toString() }),
      } as any);

      const result = await service.getUserBalance(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual({
        balance: 5000,
        totalInvested: 5000,
      });
    });

    it('should return 0 for total invested when no investments exist', async () => {
      const userId = 1;
      const user = { id: userId, balance: 10000 };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockInvestmentRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.getUserBalance(userId);

      expect(result.totalInvested).toBe(0);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserBalance(1)).rejects.toThrow(
        'User with ID 1 not found'
      );
    });
  });
});