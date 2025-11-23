import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';

export enum InvestmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  opportunityId: number;

  @Column({ name: 'investment_amount', type: 'decimal', precision: 10, scale: 2 })
  investmentAmount: number;

  @Column({ 
    type: 'enum', 
    enum: InvestmentStatus, 
    default: InvestmentStatus.PENDING 
  })
  status: InvestmentStatus;

  @Column({ name: 'balance_before', type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: 'opportunityId' })
  opportunity: Opportunity;
}
