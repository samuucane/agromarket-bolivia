export type CreditPurpose = 'SEEDS' | 'FERTILIZERS' | 'AGROCHEMICALS' | 'MACHINERY' | 'WORKING_CAPITAL' | 'INFRASTRUCTURE' | 'OTHER';
export type CreditStatus  = 'SUBMITTED' | 'SCORING' | 'APPROVED' | 'REJECTED' | 'PENDING_DOCS' | 'DISBURSED' | 'CANCELLED';
export type LoanStatus    = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'RESTRUCTURED' | 'WRITTEN_OFF';
export type RiskTier      = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface CreditScore {
  score: number;
  riskTier: RiskTier;
  updatedAt?: string;
  maxCreditAmount?: number;
}

export interface CreditApplication {
  id: string;
  purpose: CreditPurpose;
  requestedAmount: number;
  requestedTerm: number;
  creditScore?: number;
  riskTier?: RiskTier;
  status: CreditStatus;
  approvedAmount?: number;
  approvedRate?: number;
  submittedAt: string;
}

export interface CreditSimulation {
  principal: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
}
