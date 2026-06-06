export type UserRole =
  | 'SUPER_ADMIN' | 'ADMIN' | 'PRODUCER' | 'BUYER'
  | 'SUPPLIER' | 'MACHINERY_OWNER' | 'FINANCIAL_INST'
  | 'FIELD_AGENT' | 'COOPERATIVE';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type KycStatus  = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  language: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ProducerProfile {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  municipality: string;
  community?: string;
  totalHectares?: number;
  kycStatus: KycStatus;
  certificationLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM' | 'ORGANIC' | 'EXPORTER';
  creditScore?: number;
}
