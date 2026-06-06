import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreditService } from '../services/credit.service';

@ApiTags('credit')
@Controller('credit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditController {
  constructor(private creditService: CreditService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Solicitar crédito agrícola' })
  apply(@CurrentUser() user: User, @Body() dto: any) {
    return this.creditService.applyForCredit(user.id, dto);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Mis solicitudes de crédito' })
  getApplications(@CurrentUser() user: User) {
    return this.creditService.getApplications(user.id);
  }

  @Get('loans')
  @ApiOperation({ summary: 'Mis créditos activos' })
  getLoans(@CurrentUser() user: User) {
    return this.creditService.getLoans(user.id);
  }

  @Get('score')
  @ApiOperation({ summary: 'Mi score crediticio actual' })
  getScore(@CurrentUser() user: User) {
    return this.creditService.getCreditScore(user.id);
  }

  @Get('simulate')
  @ApiOperation({ summary: 'Simular crédito sin aplicar' })
  simulate(
    @Query('amount') amount: number,
    @Query('term') term: number,
    @Query('risk') risk?: string,
  ) {
    return this.creditService.simulateCredit(Number(amount), Number(term), risk);
  }
}
