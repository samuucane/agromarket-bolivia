import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CertificationsService {
  constructor(private prisma: PrismaService) {}
  async getMyCertifications(userId: string) {
    const profile = await this.prisma.producerProfile.findFirst({ where: { userId } });
    return this.prisma.certification.findMany({ where: { producerId: profile?.id } });
  }
  async submitCertification(userId: string, dto: any) {
    const profile = await this.prisma.producerProfile.findFirst({ where: { userId } });
    return this.prisma.certification.create({ data: { producerId: profile!.id, ...dto } });
  }
}
