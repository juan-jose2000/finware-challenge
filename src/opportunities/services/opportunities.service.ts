import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Opportunity } from '../entities/opportunity.entity';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { OpportunityResponseDto } from '../dto/opportunity-response.dto';
import { OllamaService } from './ollama.service';

@Injectable()
export class OpportunitiesService implements OnModuleInit {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    private ollamaService: OllamaService,
  ) {}

  onModuleInit() {}

  async create(createOpportunityDto: CreateOpportunityDto): Promise<OpportunityResponseDto> {
    const { name, totalAmount, details, marketAnalysis } = createOpportunityDto;

    // Validate amount range (additional check beyond DTO)
    if (totalAmount < 40000 || totalAmount > 600000) {
      throw new BadRequestException(
        `Opportunity amount must be between $40,000 and $600,000 MXN. Provided: $${totalAmount.toLocaleString()}`
      );
    }

    const opportunity = this.opportunityRepository.create({
      name,
      totalAmount,
      details,
      marketAnalysis, // Will be updated later by AI OLLAMA
    });

    const savedOpportunity = await this.opportunityRepository.save(opportunity);

    // Queue AI market analysis generation (don't await - fire and forget)
    try {
      await this.ollamaService.generateMarketAnalysisAsync(
        savedOpportunity.id,
        name,
        totalAmount
      );
      this.logger.log(`Queued AI analysis for opportunity ${savedOpportunity.id}`);
    } catch (error) {
      this.logger.error(`Failed to queue AI analysis for opportunity ${savedOpportunity.id}:`, error.message);
      // Don't fail the opportunity creation if AI queuing fails
    }

    return this.mapToResponseDto(savedOpportunity);
  }

  async findAll(): Promise<OpportunityResponseDto[]> {
    const opportunities = await this.opportunityRepository.find({
      order: { createdAt: 'DESC' },
    });
    return opportunities.map(opp => this.mapToResponseDto(opp));
  }

  async findOne(id: number): Promise<OpportunityResponseDto> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    return this.mapToResponseDto(opportunity);
  }

  async update(id: number, updateOpportunityDto: UpdateOpportunityDto): Promise<OpportunityResponseDto> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    // Validate amount if being updated
    if (updateOpportunityDto.totalAmount !== undefined) {
      const newAmount = updateOpportunityDto.totalAmount;
      if (newAmount < 40000 || newAmount > 600000) {
        throw new BadRequestException(
          `Opportunity amount must be between $40,000 and $600,000 MXN. Provided: $${newAmount.toLocaleString()}`
        );
      }
    }

    // update name / total_amount / details (or all)
    await this.opportunityRepository.update(id, updateOpportunityDto);

    //generate new market analyses with updates
    try {
      await this.ollamaService.generateMarketAnalysisAsync(
        id,
        updateOpportunityDto.name !== undefined ? updateOpportunityDto.name : opportunity.name,
        updateOpportunityDto.totalAmount !== undefined ? updateOpportunityDto.totalAmount : opportunity.totalAmount
      );
      this.logger.log(`Queued AI analysis for opportunity ${id}`);
    } catch (error) {
      this.logger.error(`Failed to queue AI analysis for opportunity ${id}:`, error.message);
      // Don't fail the opportunity creation if AI queuing fails
    }

    //get updated opportunity for response
    const updatedOpportunity = await this.opportunityRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedOpportunity!);
  }

  async remove(id: number): Promise<void> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }

    try {
      await this.opportunityRepository.remove(opportunity);
    } catch (error) {
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        throw new BadRequestException(
          `Cannot delete opportunity "${opportunity.name}" because it has associated investments. ` +
          `Please remove all related investments first before deleting this opportunity.`
        );
      }
      // Re-throw other database errors
      throw error;
    }
  }

  // Event listener for completed Ollama analysis
  @OnEvent('ollama.analysis.completed')
  async handleAnalysisCompleted(payload: { opportunityId: number; analysis: string }) {
    await this.updateMarketAnalysis(payload.opportunityId, payload.analysis);
  }

  // Event listener for failed Ollama analysis
  @OnEvent('ollama.analysis.failed')
  async handleAnalysisFailed(payload: { opportunityId: number; error: string }) {
    this.logger.warn(`Ollama analysis failed for opportunity ${payload.opportunityId}: ${payload.error}`);
    await this.updateMarketAnalysis(
      payload.opportunityId,
      'Market analysis generation failed. Please try again later.'
    );
  }

  ///Update market analysis for an opportunity (called by event listeners)
  async updateMarketAnalysis(opportunityId: number, marketAnalysis: string): Promise<void> {
    try {
      await this.opportunityRepository.update(opportunityId, {
        marketAnalysis,
        updatedAt: new Date(),
      });
      this.logger.log(`Updated market analysis for opportunity ${opportunityId}`);
    } catch (error) {
      this.logger.error(`Failed to update market analysis for opportunity ${opportunityId}:`, error.message);
    }
  }

  private mapToResponseDto(opportunity: Opportunity): OpportunityResponseDto {
    return {
      id: opportunity.id,
      name: opportunity.name,
      totalAmount: opportunity.totalAmount,
      details: opportunity.details,
      marketAnalysis: opportunity.marketAnalysis,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }
}
