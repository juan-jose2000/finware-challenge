import { validate } from 'class-validator';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

describe('DTO Validation', () => {
  describe('RegisterDto', () => {
    it('should validate valid register data', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'john@example.com';
      dto.birthDate = '1990-01-01';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid email', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'invalid-email';
      dto.birthDate = '1990-01-01';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation for short password', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'john@example.com';
      dto.birthDate = '1990-01-01';
      dto.password = '123'; // Too short

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation for missing required fields', async () => {
      const dto = new RegisterDto();
      // Missing all required fields

      const errors = await validate(dto);
      expect(errors.length).toBe(4); // 4 required fields
    });
  });

  describe('LoginDto', () => {
    it('should validate valid login data', async () => {
      const dto = new LoginDto();
      dto.email = 'john@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation for invalid email', async () => {
      const dto = new LoginDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for missing password', async () => {
      const dto = new LoginDto();
      dto.email = 'john@example.com';
      // Missing password

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
