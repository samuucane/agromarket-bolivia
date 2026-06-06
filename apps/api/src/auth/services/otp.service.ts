import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';

import { PrismaService } from '../../database/prisma.service';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_SALT_ROUNDS = 10;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const accountSid = config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = config.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('⚠️  Twilio not configured — OTP will be logged only (dev mode)');
    }
  }

  /**
   * Generate a 6-digit OTP, store hashed, send via SMS
   */
  async sendOtp(phone: string, purpose: string): Promise<void> {
    // Invalidate any existing OTPs for this phone+purpose
    await this.prisma.otpVerification.updateMany({
      where: {
        phone,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() }, // Mark as used to invalidate
    });

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await this.prisma.otpVerification.create({
      data: {
        phone,
        otpHash,
        purpose,
        expiresAt,
      },
    });

    await this.sendSms(phone, otp, purpose);
  }

  /**
   * Verify OTP and mark as used
   */
  async verifyOtp(phone: string, otp: string, purpose: string): Promise<boolean> {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      this.logger.warn(`OTP not found or expired for ${phone} (${purpose})`);
      return false;
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);

    if (isValid) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      this.logger.log(`OTP verified successfully for ${phone} (${purpose})`);
    } else {
      this.logger.warn(`Invalid OTP attempt for ${phone} (${purpose})`);
    }

    return isValid;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async sendSms(phone: string, otp: string, purpose: string): Promise<void> {
    const messages: Record<string, string> = {
      REGISTRATION: `AgroMarket Bolivia: Tu código de verificación es ${otp}. Válido por 5 minutos. No lo compartas.`,
      LOGIN: `AgroMarket Bolivia: Tu código de acceso es ${otp}. Válido por 5 minutos.`,
      TRANSACTION: `AgroMarket Bolivia: Código de confirmación de transacción: ${otp}. Válido por 5 minutos.`,
    };

    const message = messages[purpose] || `AgroMarket Bolivia: Tu código es ${otp}`;

    if (this.twilioClient) {
      try {
        const fromPhone = this.config.get<string>('TWILIO_PHONE_NUMBER');
        await this.twilioClient.messages.create({
          body: message,
          from: fromPhone,
          to: phone,
        });
        this.logger.log(`SMS sent to ${phone}`);
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${phone}`, error);
        throw error;
      }
    } else {
      // Development mode — log OTP to console
      this.logger.debug(`📱 [DEV] OTP for ${phone}: ${otp} (${purpose})`);
    }
  }
}
