export type TransactionType   = 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'DEPOSIT' | 'PLATFORM_FEE' | 'CREDIT_DISBURSEMENT' | 'CREDIT_PAYMENT';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export type PaymentMethod     = 'QR_BOLIVIA' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_PLATFORM' | 'CARD';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isFrozen: boolean;
}

export interface Transaction {
  id: string;
  transactionRef: string;
  amount: number;
  netAmount: number;
  feeAmount: number;
  currency: string;
  type: TransactionType;
  method: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
}

export interface QrPayment {
  qrId: string;
  qrCode: string;
  qrImageUrl: string;
  amount: number;
  currency: string;
  expiresAt: string;
}
