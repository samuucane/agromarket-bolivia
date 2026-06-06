import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditStatus, RiskTier } from '@prisma/client';
import axios from 'axios';

import { PrismaService } from '../../database/prisma.service';

// ─── Scoring Service (calls Python FastAPI) ───────────────────────────────────

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async scoreUser(userId: string, requestedAmount: number, requestedTerm: number, purpose: string) {
    const scoringUrl = this.config.get<string>('SCORING_SERVICE_URL', 'http://scoring:8000');
    const apiKey = this.config.get<string>('SCORING_SERVICE_API_KEY', '');

    try {
      const response = await axios.post(
        `${scoringUrl}/score`,
        { user_id: userId, requested_amount: requestedAmount, requested_term: requestedTerm, purpose },
        { headers: { 'X-API-Key': apiKey }, timeout: 10000 },
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Scoring service unavailable, using fallback: ${error.message}`);
      return this.fallbackScore(userId, requestedAmount);
    }
  }

  private async fallbackScore(userId: string, requestedAmount: number) {
    // Simple rule-based fallback when ML service is unavailable
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        producerProfile: true,
        ordersAsBuyer: { where: { status: 'COMPLETED' } },
        ordersAsSeller: { where: { status: 'COMPLETED' } },
      },
    });

    const completedOrders = (user?.ordersAsBuyer?.length ?? 0) + (user?.ordersAsSeller?.length ?? 0);
    const hasKyc = user?.producerProfile?.kycStatus === 'APPROVED';
    const hasFarm = !!user?.producerProfile?.totalHectares;
    const daysOnPlatform = Math.floor((Date.now() - (user?.createdAt?.getTime() ?? Date.now())) / 86400000);

    let score = 400;
    if (hasKyc) score += 80;
    if (hasFarm) score += 60;
    if (completedOrders >= 5) score += 100;
    else if (completedOrders >= 1) score += completedOrders * 15;
    if (daysOnPlatform >= 90) score += 50;

    const riskTier = score >= 700 ? 'LOW' : score >= 580 ? 'MEDIUM' : score >= 450 ? 'HIGH' : 'VERY_HIGH';
    const maxAmount = score >= 700 ? 50000 : score >= 580 ? 20000 : score >= 450 ? 8000 : 2000;

    return {
      credit_score: score,
      max_credit_amount: Math.min(maxAmount, requestedAmount),
      recommended_term_months: riskTier === 'LOW' ? 12 : riskTier === 'MEDIUM' ? 6 : 3,
      approval_probability: (score - 300) / 550,
      risk_tier: riskTier,
      rejection_reasons: score < 450 ? ['Historial de transacciones insuficiente', 'Perfil no verificado'] : [],
    };
  }
}

// ─── Credit Service ───────────────────────────────────────────────────────────

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(private prisma: PrismaService, private scoringService: ScoringService) {}

  async applyForCredit(userId: string, dto: {
    purpose: any;
    requestedAmount: number;
    requestedTerm: number;
    linkedOrderId?: string;
    linkedListingId?: string;
  }) {
    // Run scoring
    const scoring = await this.scoringService.scoreUser(
      userId, dto.requestedAmount, dto.requestedTerm, dto.purpose,
    );

    const application = await this.prisma.creditApplication.create({
      data: {
        applicantId: userId,
        purpose: dto.purpose,
        requestedAmount: dto.requestedAmount,
        requestedTerm: dto.requestedTerm,
        linkedOrderId: dto.linkedOrderId,
        linkedListingId: dto.linkedListingId,
        scoringSnapshot: scoring,
        creditScore: scoring.credit_score,
        riskTier: scoring.risk_tier as RiskTier,
        status: scoring.approval_probability >= 0.6 ? CreditStatus.APPROVED : CreditStatus.SUBMITTED,
        approvedAmount: scoring.approval_probability >= 0.6 ? scoring.max_credit_amount : undefined,
        approvedRate: this.getInterestRate(scoring.risk_tier),
        approvedTerm: scoring.recommended_term_months,
      },
    });

    // Update credit score on producer profile
    await this.prisma.producerProfile.updateMany({
      where: { userId },
      data: { creditScore: scoring.credit_score, creditScoreUpdatedAt: new Date() },
    });

    this.logger.log(`Credit application ${application.id}: score=${scoring.credit_score}, risk=${scoring.risk_tier}`);
    return application;
  }

  async getApplications(userId: string) {
    return this.prisma.creditApplication.findMany({
      where: { applicantId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLoans(userId: string) {
    return this.prisma.creditLoan.findMany({
      where: { borrowerId: userId, status: { not: 'WRITTEN_OFF' } },
      orderBy: { disbursedAt: 'desc' },
      include: {
        application: { select: { purpose: true } },
        payments: { orderBy: { paymentNumber: 'desc' }, take: 3 },
      },
    });
  }

  async getCreditScore(userId: string) {
    const profile = await this.prisma.producerProfile.findUnique({ where: { userId } });
    if (!profile?.creditScore) {
      const scoring = await this.scoringService.scoreUser(userId, 0, 0, 'WORKING_CAPITAL');
      return { score: scoring.credit_score, risk: scoring.risk_tier, updatedAt: new Date() };
    }
    return { score: profile.creditScore, updatedAt: profile.creditScoreUpdatedAt };
  }

  async simulateCredit(amount: number, termMonths: number, riskTier = 'MEDIUM') {
    const rate = this.getInterestRate(riskTier);
    const monthlyRate = rate / 12;
    const monthlyPayment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    return {
      principal: amount,
      termMonths,
      annualRate: rate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalToPay: Math.round(monthlyPayment * termMonths * 100) / 100,
      totalInterest: Math.round((monthlyPayment * termMonths - amount) * 100) / 100,
    };
  }

  private getInterestRate(riskTier: string): number {
    const rates: Record<string, number> = { LOW: 0.14, MEDIUM: 0.18, HIGH: 0.24, VERY_HIGH: 0.30 };
    return rates[riskTier] ?? 0.18;
  }
}
