import { Module } from '@nestjs/common';
import { FarmsController } from './controllers/farms.controller';
import { FarmsService } from './services/farms.service';
import { WeatherService } from './services/weather.service';

@Module({
  controllers: [FarmsController],
  providers: [FarmsService, WeatherService],
  exports: [FarmsService],
})
export class FarmsModule {}
