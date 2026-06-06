import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { QrService } from './services/qr.service';
import { WalletService } from './services/wallet.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, QrService, WalletService],
  exports: [PaymentsService, WalletService],
})
export class PaymentsModule {}
