import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';
import { AuthTokensDto, UserBasicDto } from '../dto/auth.dto';

export interface JwtPayload {
  sub: string;       // user ID
  phone: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Generate a new access + refresh token pair for a user
   */
  async generateAuthTokens(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    // Access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<number>('JWT_ACCESS_EXPIRY', 900),
    });

    // Refresh token (30 days) — stored in DB for revocation capability
    const refreshToken = uuidv4();
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('JWT_REFRESH_EXPIRY', 2592000) * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Cleanup old expired tokens for this user (housekeeping)
    await this.cleanupExpiredTokens(user.id);

    const userDto: UserBasicDto = {
      id: user.id,
      phone: user.phone,
      email: user.email ?? null,
      role: user.role,
      status: user.status,
      language: user.language,
      createdAt: user.createdAt,
    };

    return { accessToken, refreshToken, user: userDto };
  }

  /**
   * Validate a refresh token and issue a new access+refresh pair
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokensDto> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Rotate: revoke current, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateAuthTokens(tokenRecord.user);
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user (security: "logout all devices")
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Validate JWT payload (used by JwtStrategy)
   */
  async validatePayload(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async cleanupExpiredTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });
  }
}
