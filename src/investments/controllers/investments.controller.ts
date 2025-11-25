import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
  } from '@nestjs/common';
  import { InvestmentsService } from '../services/investments.service';
  import { CreateInvestmentDto } from '../dto/create-investment.dto';
  import { InvestmentResponseDto } from '../dto/investment-response.dto';
  import { JwtAuth } from '../../common/decorators/jwt-auth.decorator';
  import { User } from '../../common/decorators/user.decorator';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  
  @ApiTags('invest')
  @ApiBearerAuth('JWT-auth')
  @Controller('invest') 
  @JwtAuth() // All invest endpoints require authentication
  export class InvestmentsController {
    constructor(private readonly investmentsService: InvestmentsService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new investment' })
    @ApiResponse({ 
      status: 201, 
      description: 'Investment created successfully',
      type: InvestmentResponseDto 
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation error or insufficient balance' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Opportunity not found' })
    async create(
      @Body() createInvestmentDto: CreateInvestmentDto,
      @User('id') userId: number,
    ): Promise<InvestmentResponseDto> {
      return this.investmentsService.create(createInvestmentDto, userId);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user investments' })
    @ApiResponse({ 
      status: 200, 
      description: 'List of user investments',
      type: [InvestmentResponseDto] 
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAllByUser(@User('id') userId: number): Promise<InvestmentResponseDto[]> {
      return this.investmentsService.findAllByUser(userId);
    }
  
    @Get('balance')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user current balance' })
    @ApiResponse({ 
      status: 200, 
      description: 'User balance information',
      schema: {
        type: 'object',
        properties: {
          balance: { type: 'number', example: 500.00 },
          totalInvested: { type: 'number', example: 500.00 }
        }
      }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getBalance(@User('id') userId: number): Promise<{ balance: number; totalInvested: number }> {
      return this.investmentsService.getUserBalance(userId);
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get specific investment' })
    @ApiParam({ name: 'id', description: 'Investment ID', example: 1 })
    @ApiResponse({ 
      status: 200, 
      description: 'Investment details',
      type: InvestmentResponseDto 
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Investment not found' })
    async findOne(@Param('id') id: string, @User('id') userId: number): Promise<InvestmentResponseDto> {
      return this.investmentsService.findOne(+id, userId);
    }
  }