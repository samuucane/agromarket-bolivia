import { Module } from '@nestjs/common';
import { CreditController } from './controllers/credit.controller';
import { CreditService } from './services/credit.service';
import { ScoringService } from './services/scoring.service';

@Module({
  controllers: [CreditController],
  providers: [CreditService, ScoringService],
  exports: [CreditService],
})
export class CreditModule {}
