import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from '../controllers/investments.controller';
import { InvestmentsService } from '../services/investments.service';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let investmentsService: InvestmentsService;

  const mockInvestmentsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    getUserBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [
        {
          provide: InvestmentsService,
          useValue: mockInvestmentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock JWT guard
      .compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
    investmentsService = module.get<InvestmentsService>(InvestmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create investment and return result', async () => {
      const createDto: CreateInvestmentDto = {
        opportunityId: 1,
        amount: 5000,
      };

      const expectedResult = {
        id: 1,
        userId: 1,
        opportunityId: 1,
        investmentAmount: 5000,
        status: 'completed',
        balanceBefore: 10000,
        balanceAfter: 5000,
        notes: 'Investment created',
        createdAt: new Date(),
        opportunity: { id: 1, name: 'Test Opp', totalAmount: 100000 },
      };

      mockInvestmentsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, 1);

      expect(mockInvestmentsService.create).toHaveBeenCalledWith(createDto, 1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return user investments', async () => {
      const investments = [
        {
          id: 1,
          userId: 1,
          opportunityId: 1,
          investmentAmount: 5000,
          status: 'completed',
          balanceBefore: 10000,
          balanceAfter: 5000,
          notes: 'Investment 1',
          createdAt: new Date(),
        },
      ];

      mockInvestmentsService.findAllByUser.mockResolvedValue(investments);

      const result = await controller.findAll(1);

      expect(mockInvestmentsService.findAllByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(investments);
    });
  });

  describe('getBalance', () => {
    it('should return user balance information', async () => {
      const balanceInfo = {
        balance: 5000,
        totalInvested: 5000,
      };

      mockInvestmentsService.getUserBalance.mockResolvedValue(balanceInfo);

      const result = await controller.getBalance(1);

      expect(mockInvestmentsService.getUserBalance).toHaveBeenCalledWith(1);
      expect(result).toEqual(balanceInfo);
    });
  });

  describe('findOne', () => {
    it('should return specific investment', async () => {
      const investment = {
        id: 1,
        userId: 1,
        opportunityId: 1,
        investmentAmount: 5000,
        status: 'completed',
        balanceBefore: 10000,
        balanceAfter: 5000,
        notes: 'Investment details',
        createdAt: new Date(),
        opportunity: { id: 1, name: 'Test Opp', totalAmount: 100000 },
      };

      mockInvestmentsService.findOne.mockResolvedValue(investment);

      const result = await controller.findOne(1, 1);

      expect(mockInvestmentsService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(investment);
    });
  });
});
