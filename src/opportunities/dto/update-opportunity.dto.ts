import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOpportunityDto {
    @ApiProperty({
        description: 'Investment opportunity name',
        example: 'Fintech payments project'
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Total investment amount (40,000 - 600,000 MXN)',
        example: 150000,
        minimum: 40000,
        maximum: 600000
    })
    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(40000, { message: 'Amount must be at least $40,000 MXN' })
    @Max(600000, { message: 'Amount must not exceed $600,000 MXN' })
    totalAmount: number;

    @ApiProperty({
        description: 'Detailed description of the investment opportunity',
        example: 'Promising fintech startup with innovative payment solutions'
    })
    @IsNotEmpty()
    @IsString()
    details: string;
}