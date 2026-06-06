import { Module } from '@nestjs/common';

import { MarketplaceController } from './controllers/marketplace.controller';
import { ListingsService } from './services/listings.service';
import { OrdersService } from './services/orders.service';
import { PricesService } from './services/prices.service';
import { SearchService } from './services/search.service';

@Module({
  controllers: [MarketplaceController],
  providers: [ListingsService, OrdersService, PricesService, SearchService],
  exports: [ListingsService, OrdersService],
})
export class MarketplaceModule {}
