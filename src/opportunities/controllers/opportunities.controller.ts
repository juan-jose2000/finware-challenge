import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OpportunitiesService } from '../services/opportunities.service';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { OpportunityResponseDto } from '../dto/opportunity-response.dto';
import { JwtAuth } from '../../common/decorators/jwt-auth.decorator';

@Controller('opportunities')
@JwtAuth() // All opportunity endpoints require authentication
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOpportunityDto: CreateOpportunityDto): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(createOpportunityDto);
  }

  @Get()
  async findAll(): Promise<OpportunityResponseDto[]> {
    return this.opportunitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(id, updateOpportunityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.opportunitiesService.remove(id);
  }
}
