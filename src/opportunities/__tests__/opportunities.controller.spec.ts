import { Test, TestingModule } from '@nestjs/testing';
import { OpportunitiesController } from '../controllers/opportunities.controller';
import { OpportunitiesService } from '../services/opportunities.service';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('OpportunitiesController', () => {
  let controller: OpportunitiesController;
  let opportunitiesService: OpportunitiesService;

  const mockOpportunitiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [
        {
          provide: OpportunitiesService,
          useValue: mockOpportunitiesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock JWT guard
      .compile();

    controller = module.get<OpportunitiesController>(OpportunitiesController);
    opportunitiesService = module.get<OpportunitiesService>(OpportunitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create opportunity and return result', async () => {
      const createDto: CreateOpportunityDto = {
        name: 'Test Opportunity',
        totalAmount: 150000,
        details: 'Test details',
      };

      const expectedResult = {
        id: 1,
        name: 'Test Opportunity',
        totalAmount: 150000,
        details: 'Test details',
        marketAnalysis: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOpportunitiesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(mockOpportunitiesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all opportunities', async () => {
      const opportunities = [
        { id: 1, name: 'Opp 1', totalAmount: 100000, details: 'Details 1', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockOpportunitiesService.findAll.mockResolvedValue(opportunities);

      const result = await controller.findAll();

      expect(mockOpportunitiesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(opportunities);
    });
  });

  describe('findOne', () => {
    it('should return specific opportunity', async () => {
      const opportunity = { id: 1, name: 'Test', totalAmount: 100000, details: 'Details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };

      mockOpportunitiesService.findOne.mockResolvedValue(opportunity);

      const result = await controller.findOne(1);

      expect(mockOpportunitiesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(opportunity);
    });
  });

  describe('update', () => {
    it('should update opportunity and return result', async () => {
      const updateDto: UpdateOpportunityDto = { name: 'Updated Name' };
      const expectedResult = { id: 1, name: 'Updated Name', totalAmount: 100000, details: 'Details', marketAnalysis: null, createdAt: new Date(), updatedAt: new Date() };

      mockOpportunitiesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(1, updateDto);

      expect(mockOpportunitiesService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove opportunity', async () => {
      mockOpportunitiesService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockOpportunitiesService.remove).toHaveBeenCalledWith(1);
    });
  });
});
