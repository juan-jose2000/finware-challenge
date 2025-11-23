import { Investment, InvestmentStatus } from '../entities/investment.entity';

describe('Investment Entity', () => {
  it('should create investment with default status', () => {
    const investment = new Investment();
    investment.userId = 1;
    investment.opportunityId = 1;
    investment.investmentAmount = 5000;
    investment.balanceBefore = 10000;
    investment.balanceAfter = 5000;
    investment.notes = 'Test investment';
    investment.status = InvestmentStatus.PENDING;

    expect(investment.userId).toBe(1);
    expect(investment.opportunityId).toBe(1);
    expect(investment.investmentAmount).toBe(5000);
    expect(investment.balanceBefore).toBe(10000);
    expect(investment.balanceAfter).toBe(5000);
    expect(investment.notes).toBe('Test investment');
    expect(investment.status).toBe(InvestmentStatus.PENDING);
  });

  it('should allow setting completed status', () => {
    const investment = new Investment();
    investment.status = InvestmentStatus.COMPLETED;

    expect(investment.status).toBe(InvestmentStatus.COMPLETED);
  });

  it('should allow setting failed status', () => {
    const investment = new Investment();
    investment.status = InvestmentStatus.FAILED;

    expect(investment.status).toBe(InvestmentStatus.FAILED);
  });

  describe('InvestmentStatus enum', () => {
    it('should have correct status values', () => {
      expect(InvestmentStatus.PENDING).toBe('pending');
      expect(InvestmentStatus.COMPLETED).toBe('completed');
      expect(InvestmentStatus.FAILED).toBe('failed');
      expect(InvestmentStatus.CANCELLED).toBe('cancelled');
    });
  });
});
