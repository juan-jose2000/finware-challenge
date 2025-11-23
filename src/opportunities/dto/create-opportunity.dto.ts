import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateOpportunityDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(40000, { message: 'Amount must be at least $40,000 MXN' })
  @Max(600000, { message: 'Amount must not exceed $600,000 MXN' })
  totalAmount: number;

  @IsNotEmpty()
  @IsString()
  details: string;

  @IsOptional()
  @IsString()
  marketAnalysis?: string;
}
