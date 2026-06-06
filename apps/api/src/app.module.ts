import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PaymentsModule } from './payments/payments.module';
import { CreditModule } from './credit/credit.module';
import { FarmsModule } from './farms/farms.module';
import { CertificationsModule } from './certifications/certifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    // ─── Configuration ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ─── Rate Limiting ───────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 20,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 100,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 500,
        },
      ],
    }),

    // ─── Scheduler for cron jobs ─────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Core Modules ────────────────────────────────────────────────
    DatabaseModule,
    CommonModule,
    HealthModule,

    // ─── Feature Modules ─────────────────────────────────────────────
    AuthModule,
    MarketplaceModule,
    PaymentsModule,
    CreditModule,
    FarmsModule,
    CertificationsModule,
    AnalyticsModule,
    NotificationsModule,
    WhatsappModule,
  ],
})
export class AppModule {}
