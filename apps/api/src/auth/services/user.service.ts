import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from '../dto/auth.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async getUserWithProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        producerProfile: { include: { crops: true } },
        buyerProfile: true,
        supplierProfile: true,
        wallet: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { passwordHash, pinHash, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.language && { language: dto.language }),
        ...(dto.whatsappOptIn !== undefined && { whatsappOptIn: dto.whatsappOptIn }),
      },
    });

    const { passwordHash, pinHash, ...safe } = updated;
    return safe;
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async getAllUsers(page = 1, limit = 20, role?: UserRole) {
    return this.prisma.paginate('user', {
      where: {
        ...(role && { role }),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        language: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }
}
