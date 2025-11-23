import { validate } from 'class-validator';
import { CreateInvestmentDto } from '../dto/create-investment.dto';

describe('Investments DTO Validation', () => {
  describe('CreateInvestmentDto', () => {
    it('should validate valid investment data', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      dto.amount = 50000;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for missing opportunityId', async () => {
      const dto = new CreateInvestmentDto();
      dto.amount = 50000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation for invalid opportunityId type', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 'invalid' as any;
      dto.amount = 50000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation for amount below minimum', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      dto.amount = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for amount above maximum', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      dto.amount = 700000; // Above $600,000

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail validation for non-numeric amount', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      dto.amount = '50000' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation for negative amount', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      dto.amount = -1000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for missing amount', async () => {
      const dto = new CreateInvestmentDto();
      dto.opportunityId = 1;
      // amount is missing

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
