import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { InvestmentsService } from '../services/investments.service';
  import { CreateInvestmentDto } from '../dto/create-investment.dto';
  import { InvestmentResponseDto } from '../dto/investment-response.dto';
  import { JwtAuth } from '../../common/decorators/jwt-auth.decorator';
  import { User } from '../../common/decorators/user.decorator';
  
  @Controller('invest')
  @JwtAuth() // All invest endpoints require authentication
  export class InvestmentsController {
    constructor(private readonly investmentsService: InvestmentsService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
      @Body() createInvestmentDto: CreateInvestmentDto,
      @User('id') userId: number,
    ): Promise<InvestmentResponseDto> {
      return this.investmentsService.create(createInvestmentDto, userId);
    }
  
    @Get()
    async findAll(@User('id') userId: number): Promise<InvestmentResponseDto[]> {
      return this.investmentsService.findAllByUser(userId);
    }
  
    @Get('balance')
    async getBalance(@User('id') userId: number): Promise<{ balance: number; totalInvested: number }> {
      return this.investmentsService.getUserBalance(userId);
    }
  
    @Get(':id')
    async findOne(
      @Param('id', ParseIntPipe) id: number,
      @User('id') userId: number,
    ): Promise<InvestmentResponseDto> {
      return this.investmentsService.findOne(id, userId);
    }
  }