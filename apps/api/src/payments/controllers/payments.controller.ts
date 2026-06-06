import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PaymentsService, QrService } from '../services/payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private qrService: QrService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Saldo del wallet del usuario' })
  getWallet(@CurrentUser() user: User) {
    return this.paymentsService.getWallet(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historial de transacciones' })
  getTransactions(@CurrentUser() user: User, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.paymentsService.getTransactions(user.id, page, limit);
  }

  @Post('qr/generate')
  @ApiOperation({ summary: 'Generar QR para pago de orden' })
  generateQr(@Body() body: { orderId: string; amount: number; description?: string }) {
    return this.qrService.generateQr(body.orderId, body.amount, body.description ?? 'Pago AgroMarket');
  }

  @Post('qr/verify')
  @ApiOperation({ summary: 'Verificar estado de pago QR' })
  verifyQr(@Body() body: { qrCode: string }) {
    return this.qrService.verifyQr(body.qrCode);
  }

  @Post('order/:orderId/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesar pago de orden desde wallet' })
  payOrder(@Param('orderId') orderId: string, @Body() body: { method: any }) {
    return this.paymentsService.processOrderPayment(orderId, body.method);
  }
}
