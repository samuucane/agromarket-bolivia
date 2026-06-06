import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import {
  RegisterDto,
  LoginDto,
  LoginPinDto,
  VerifyOtpDto,
  ResetPinDto,
  SetPinDto,
  AuthTokensDto,
  OtpSentDto,
} from '../dto/auth.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private tokenService: TokenService,
  ) {}

  // ─── Registration ─────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<OtpSentDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      throw new ConflictException('Este número de teléfono ya está registrado');
    }

    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('Este email ya está registrado');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
        language: dto.language || 'es',
        whatsappOptIn: dto.whatsappOptIn ?? true,
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    await this.otpService.sendOtp(dto.phone, 'REGISTRATION');

    this.logger.log(`New user registered: ${dto.phone} (${dto.role})`);

    return {
      message: `Código de verificación enviado a ${dto.phone}`,
      expiresIn: 300,
    };
  }

  // ─── OTP Verification ─────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokensDto> {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.otp, dto.purpose);

    if (!isValid) {
      throw new UnauthorizedException('Código inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Activate user on registration
    if (dto.purpose === 'REGISTRATION') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
        },
      });

      // Create wallet for the user
      await this.prisma.wallet.create({
        data: { userId: user.id },
      });

      this.logger.log(`User activated: ${user.phone}`);
    }

    const updatedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.tokenService.generateAuthTokens(updatedUser);
  }

  // ─── Login with Password ──────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Cuenta pendiente de verificación. Revisa tu SMS.');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Cuenta suspendida. Contacta soporte.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.phone}`);
    return this.tokenService.generateAuthTokens(user);
  }

  // ─── Login with PIN ───────────────────────────────────────────────────────

  async loginWithPin(dto: LoginPinDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user || !user.pinHash) {
      throw new UnauthorizedException('PIN no configurado o usuario no encontrado');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Cuenta no activa');
    }

    const pinValid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!pinValid) {
      throw new UnauthorizedException('PIN incorrecto');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.tokenService.generateAuthTokens(user);
  }

  // ─── Set PIN ──────────────────────────────────────────────────────────────

  async setPin(userId: string, dto: SetPinDto): Promise<{ message: string }> {
    const pinHash = await bcrypt.hash(dto.pin, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });

    return { message: 'PIN configurado correctamente' };
  }

  // ─── Reset PIN ────────────────────────────────────────────────────────────

  async forgotPin(phone: string): Promise<OtpSentDto> {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // Return success to avoid user enumeration
      return { message: 'Si el número está registrado, recibirás un SMS', expiresIn: 300 };
    }

    await this.otpService.sendOtp(phone, 'LOGIN');

    return { message: `Código enviado a ${phone}`, expiresIn: 300 };
  }

  async resetPin(dto: ResetPinDto): Promise<{ message: string }> {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.otp, 'LOGIN');

    if (!isValid) {
      throw new UnauthorizedException('Código inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const pinHash = await bcrypt.hash(dto.newPin, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    });

    return { message: 'PIN actualizado correctamente' };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<AuthTokensDto> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken: string): Promise<{ message: string }> {
    await this.tokenService.revokeRefreshToken(refreshToken);
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─── Validate User (for Passport) ─────────────────────────────────────────

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}
