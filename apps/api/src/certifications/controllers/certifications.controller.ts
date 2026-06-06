import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CertificationsService } from '../services/certifications.service';

@ApiTags('certifications')
@Controller('certifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificationsController {
  constructor(private service: CertificationsService) {}
  @Get() getMine(@CurrentUser() user: User) { return this.service.getMyCertifications(user.id); }
  @Post() submit(@CurrentUser() user: User, @Body() dto: any) { return this.service.submitCertification(user.id, dto); }
}
