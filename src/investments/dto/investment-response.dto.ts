import { InvestmentStatus } from '../entities/investment.entity';

export class InvestmentResponseDto {
  id: number;
  userId: number;
  opportunityId: number;
  investmentAmount: number;
  status: InvestmentStatus;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
  createdAt: Date;
  opportunity?: {
    id: number;
    name: string;
    totalAmount: number;
  };
}
