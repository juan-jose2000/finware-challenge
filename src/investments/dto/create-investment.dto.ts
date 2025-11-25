import { IsNotEmpty, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvestmentDto {
  @ApiProperty({
    description: 'ID of the investment opportunity',
    example: 1
  })
  @IsNotEmpty()
  @IsNumber()
  opportunityId: number;

  @ApiProperty({
    description: 'Investment amount (1 - 600,000 MXN)',
    example: 5000,
    minimum: 1,
    maximum: 600000
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1, { message: 'Minimum investment amount is $1 MXN' })
  @Max(600000, { message: 'Maximum investment amount is $600,000 MXN' })
  amount: number;
}
