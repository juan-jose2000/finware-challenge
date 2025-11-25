import { validate } from 'class-validator';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';

describe('Opportunities DTO Validation', () => {
  describe('CreateOpportunityDto', () => {
    it('should validate valid opportunity data', async () => {
      const dto = new CreateOpportunityDto();
      dto.name = 'Fintech Startup';
      dto.totalAmount = 150000;
      dto.details = 'Promising investment opportunity';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for missing name', async () => {
      const dto = new CreateOpportunityDto();
      dto.totalAmount = 150000;
      dto.details = 'Details';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation for amount below minimum', async () => {
      const dto = new CreateOpportunityDto();
      dto.name = 'Test';
      dto.totalAmount = 30000; // Below $40K
      dto.details = 'Details';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation for amount above maximum', async () => {
      const dto = new CreateOpportunityDto();
      dto.name = 'Test';
      dto.totalAmount = 700000; // Above $600K
      dto.details = 'Details';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail validation for missing details', async () => {
      const dto = new CreateOpportunityDto();
      dto.name = 'Test';
      dto.totalAmount = 150000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for non-numeric amount', async () => {
      const dto = new CreateOpportunityDto();
      dto.name = 'Test';
      dto.totalAmount = '150000' as any; // String instead of number
      dto.details = 'Details';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateOpportunityDto', () => {
    it('should allow partial updates', async () => {
      const dto = new UpdateOpportunityDto();
      dto.name = 'Updated Name';
      // Other fields optional - this should pass
      // No validation errors expected for partial updates
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate amount range when provided', async () => {
      const dto = new UpdateOpportunityDto();
      dto.totalAmount = 700000; // Too high

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
