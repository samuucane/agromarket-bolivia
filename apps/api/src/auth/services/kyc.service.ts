import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { KycSubmitDto } from '../dto/auth.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(private prisma: PrismaService) {}

  async submitKyc(userId: string, dto: KycSubmitDto) {
    const existing = await this.prisma.kycDocument.findFirst({
      where: { userId, status: { in: [KycStatus.PENDING, KycStatus.SUBMITTED] } },
    });

    if (existing) {
      // Update existing KYC submission
      return this.prisma.kycDocument.update({
        where: { id: existing.id },
        data: {
          frontUrl: dto.frontUrl,
          backUrl: dto.backUrl,
          selfieUrl: dto.selfieUrl,
          status: KycStatus.SUBMITTED,
        },
      });
    }

    const kyc = await this.prisma.kycDocument.create({
      data: {
        userId,
        docType: 'NATIONAL_ID',
        frontUrl: dto.frontUrl,
        backUrl: dto.backUrl,
        selfieUrl: dto.selfieUrl,
        status: KycStatus.SUBMITTED,
      },
    });

    // Update producer profile KYC status
    await this.prisma.producerProfile.updateMany({
      where: { userId },
      data: {
        kycStatus: KycStatus.SUBMITTED,
        kycSubmittedAt: new Date(),
      },
    });

    this.logger.log(`KYC submitted for user: ${userId}`);
    return kyc;
  }

  async getKycStatus(userId: string) {
    const kyc = await this.prisma.kycDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      submitted: !!kyc,
      status: kyc?.status ?? 'NOT_SUBMITTED',
      submittedAt: kyc?.createdAt ?? null,
      rejectionReason: kyc?.rejectionReason ?? null,
    };
  }

  async approveKyc(kycId: string, reviewerId: string) {
    const kyc = await this.prisma.kycDocument.update({
      where: { id: kycId },
      data: {
        status: KycStatus.APPROVED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      include: { user: true },
    });

    // Update producer profile
    await this.prisma.producerProfile.updateMany({
      where: { userId: kyc.userId },
      data: {
        kycStatus: KycStatus.APPROVED,
        kycApprovedAt: new Date(),
        nationalIdVerified: true,
        certificationLevel: 'VERIFIED',
      },
    });

    return kyc;
  }
}
