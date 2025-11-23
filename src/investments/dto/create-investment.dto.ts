import { IsNotEmpty, IsNumber, IsPositive, Min, Max } from 'class-validator';

export class CreateInvestmentDto {
  @IsNotEmpty()
  @IsNumber()
  opportunityId: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1, { message: 'Minimum investment amount is $1 MXN' })
  @Max(600000, { message: 'Maximum investment amount is $600,000 MXN' })
  amount: number;
}
