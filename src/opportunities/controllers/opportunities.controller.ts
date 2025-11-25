import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OpportunitiesService } from '../services/opportunities.service';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { OpportunityResponseDto } from '../dto/opportunity-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('opportunities')
@ApiBearerAuth('JWT-auth')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new investment opportunity' })
  @ApiResponse({ 
    status: 201, 
    description: 'Opportunity created successfully',
    type: OpportunityResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createOpportunityDto: CreateOpportunityDto): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(createOpportunityDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all investment opportunities' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of opportunities',
    type: [OpportunityResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<OpportunityResponseDto[]> {
    return this.opportunitiesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get specific investment opportunity' })
  @ApiParam({ name: 'id', description: 'Opportunity ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Opportunity details',
    type: OpportunityResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update investment opportunity' })
  @ApiParam({ name: 'id', description: 'Opportunity ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Opportunity updated successfully',
    type: OpportunityResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateOpportunityDto: UpdateOpportunityDto
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(id, updateOpportunityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete investment opportunity' })
  @ApiParam({ name: 'id', description: 'Opportunity ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Opportunity deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete - investments exist' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.opportunitiesService.remove(id);
  }
}
