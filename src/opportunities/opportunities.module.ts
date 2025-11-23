import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunitiesController } from './controllers/opportunities.controller';
import { OpportunitiesService } from './services/opportunities.service';
import { OllamaService } from './services/ollama.service';
import { Opportunity } from './entities/opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Opportunity])],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, OllamaService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
