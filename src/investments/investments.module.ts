import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentsController } from './controllers/investments.controller';
import { InvestmentsService } from './services/investments.service';
import { Investment } from './entities/investment.entity';
import { User } from '../auth/entities/user.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Investment, User, Opportunity])],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
