import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { OpportunitiesService } from '../services/opportunities.service';
import { OllamaService } from '../services/ollama.service';
import { Opportunity } from '../entities/opportunity.entity';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let opportunityRepository: Repository<Opportunity>;
  let ollamaService: OllamaService;
  let eventEmitter: EventEmitter2;

  const mockOpportunityRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockOllamaService = {
    generateMarketAnalysisAsync: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        {
          provide: getRepositoryToken(Opportunity),
          useValue: mockOpportunityRepository,
        },
        {
          provide: OllamaService,
          useValue: mockOllamaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
    opportunityRepository = module.get<Repository<Opportunity>>(getRepositoryToken(Opportunity));
    ollamaService = module.get<OllamaService>(OllamaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('create', () => {
    it('should create opportunity with valid data and queue AI analysis', async () => {
      const createDto: CreateOpportunityDto = {
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
      };

      const savedOpportunity = {
        id: 1,
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
        marketAnalysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOpportunityRepository.create.mockReturnValue(savedOpportunity);
      mockOpportunityRepository.save.mockResolvedValue(savedOpportunity);
      mockOllamaService.generateMarketAnalysisAsync.mockResolvedValue('job-123');

      const result = await service.create(createDto);

      expect(mockOpportunityRepository.create).toHaveBeenCalledWith({
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
        marketAnalysis: undefined,
      });
      expect(mockOllamaService.generateMarketAnalysisAsync).toHaveBeenCalledWith(
        1, 'Fintech Startup', 150000
      );
      expect(result).toEqual({
        id: 1,
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
        marketAnalysis: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw BadRequestException for amount too low', async () => {
      const createDto: CreateOpportunityDto = {
        name: 'Test',
        totalAmount: 30000, // Below $40K
        details: 'Test details',
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockOpportunityRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for amount too high', async () => {
      const createDto: CreateOpportunityDto = {
        name: 'Test',
        totalAmount: 700000, // Above $600K
        details: 'Test details',
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle AI queuing failure gracefully', async () => {
      const createDto: CreateOpportunityDto = {
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
      };

      const savedOpportunity = {
        id: 1,
        name: 'Fintech Startup',
        totalAmount: 150000,
        details: 'Promising fintech opportunity',
        marketAnalysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOpportunityRepository.create.mockReturnValue(savedOpportunity);
      mockOpportunityRepository.save.mockResolvedValue(savedOpportunity);
      mockOllamaService.generateMarketAnalysisAsync.mockRejectedValue(new Error('AI service down'));

      const result = await service.create(createDto);

      // Should still create opportunity even if AI fails
      expect(result.id).toBe(1);
      expect(mockOpportunityRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all opportunities ordered by creation date', async () => {
      const opportunities = [
        { id: 1, name: 'Opp 1', totalAmount: 100000, details: 'Details 1', marketAnalysis: null, createdAt: new Date('2025-01-02'), updatedAt: new Date() },
        { id: 2, name: 'Opp 2', totalAmount: 200000, details: 'Details 2', marketAnalysis: 'Analysis', createdAt: new Date('2025-01-01'), updatedAt: new Date() },
      ];

      mockOpportunityRepository.find.mockResolvedValue(opportunities);

      const result = await service.findAll();

      expect(mockOpportunityRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return opportunity if found', async () => {
      const opportunity = { id: 1, name: 'Test', totalAmount: 100000, details: 'Details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };
      
      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);

      const result = await service.findOne(1);

      expect(mockOpportunityRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if opportunity not found', async () => {
      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow('Opportunity with ID 1 not found');
    });
  });

  describe('update', () => {
    it('should update opportunity with valid data', async () => {
      const existingOpp = { id: 1, name: 'Old Name', totalAmount: 100000, details: 'Old details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };
      const updateDto: UpdateOpportunityDto = { name: 'New Name', totalAmount: 150000 };

      mockOpportunityRepository.findOne.mockResolvedValueOnce(existingOpp);
      mockOpportunityRepository.update.mockResolvedValue(undefined);
      mockOpportunityRepository.findOne.mockResolvedValueOnce({ ...existingOpp, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(mockOpportunityRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('New Name');
      expect(result.totalAmount).toBe(150000);
    });

    it('should validate amount range on update', async () => {
      const existingOpp = { id: 1, name: 'Test', totalAmount: 100000, details: 'Details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };
      const updateDto: UpdateOpportunityDto = { totalAmount: 700000 }; // Too high

      mockOpportunityRepository.findOne.mockResolvedValue(existingOpp);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove opportunity if found', async () => {
      const opportunity = { id: 1, name: 'Test', totalAmount: 100000, details: 'Details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };
      
      mockOpportunityRepository.findOne.mockResolvedValue(opportunity);
      mockOpportunityRepository.remove.mockResolvedValue(opportunity);

      await service.remove(1);

      expect(mockOpportunityRepository.remove).toHaveBeenCalledWith(opportunity);
    });

    it('should throw NotFoundException if opportunity not found', async () => {
      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow('Opportunity with ID 1 not found');
    });
  });

  describe('updateMarketAnalysis', () => {
    it('should update market analysis for opportunity', async () => {
      const analysis = 'This is a great investment opportunity...';

      await service.updateMarketAnalysis(1, analysis);

      expect(mockOpportunityRepository.update).toHaveBeenCalledWith(1, {
        marketAnalysis: analysis,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('event handlers', () => {
    it('should handle ollama.analysis.completed event', async () => {
      const payload = { opportunityId: 1, analysis: 'Great analysis!' };

      await service.handleAnalysisCompleted(payload);

      expect(mockOpportunityRepository.update).toHaveBeenCalledWith(1, {
        marketAnalysis: 'Great analysis!',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle ollama.analysis.failed event', async () => {
      const payload = { opportunityId: 1, error: 'AI service error' };

      await service.handleAnalysisFailed(payload);

      expect(mockOpportunityRepository.update).toHaveBeenCalledWith(1, {
        marketAnalysis: 'Market analysis generation failed. Please try again later.',
        updatedAt: expect.any(Date),
      });
    });
  });
});
