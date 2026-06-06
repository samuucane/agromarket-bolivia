import { Module } from '@nestjs/common';
import { CertificationsController } from './controllers/certifications.controller';
import { CertificationsService } from './services/certifications.service';

@Module({
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
