import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ListingsService } from '../services/listings.service';
import { OrdersService } from '../services/orders.service';
import { PricesService, SearchService } from '../services/prices.service';
import {
  CreateListingDto,
  ListListingsDto,
  CreateOrderDto,
  CreateReviewDto,
  SearchDto,
} from '../dto/marketplace.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private listingsService: ListingsService,
    private ordersService: OrdersService,
    private pricesService: PricesService,
    private searchService: SearchService,
  ) {}

  // ─── Listings ──────────────────────────────────────────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'Listar publicaciones con filtros' })
  getListings(@Query() filters: ListListingsDto) {
    return this.listingsService.getListings(filters);
  }

  @Get('listings/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis publicaciones' })
  getMyListings(@CurrentUser() user: User, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.listingsService.getMyListings(user.id, page, limit);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Detalle de publicación' })
  getListing(@Param('id') id: string) {
    return this.listingsService.getListing(id);
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear publicación' })
  createListing(@CurrentUser() user: User, @Body() dto: CreateListingDto) {
    return this.listingsService.createListing(user.id, dto);
  }

  @Patch('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar publicación' })
  updateListing(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: Partial<CreateListingDto>,
  ) {
    return this.listingsService.updateListing(id, user.id, dto);
  }

  @Delete('listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar publicación' })
  deleteListing(@CurrentUser() user: User, @Param('id') id: string) {
    return this.listingsService.deleteListing(id, user.id, user.role);
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Búsqueda full-text de publicaciones' })
  search(@Query() dto: SearchDto) {
    return this.searchService.searchListings(dto.q, { department: dto.department, productType: dto.productType }, dto.page, dto.limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Árbol de categorías' })
  getCategories(@Query('type') type?: string) {
    return this.searchService.getCategories(type);
  }

  // ─── Prices ────────────────────────────────────────────────────────────────

  @Get('prices')
  @ApiOperation({ summary: 'Precios de referencia actuales por producto/región' })
  getPrices(@Query('department') department?: string, @Query('categoryId') categoryId?: string) {
    return this.pricesService.getCurrentPrices(department, categoryId);
  }

  @Get('prices/history/:categoryId')
  @ApiOperation({ summary: 'Historial de precios por categoría' })
  getPriceHistory(
    @Param('categoryId') categoryId: string,
    @Query('department') department?: string,
    @Query('days') days = 30,
  ) {
    return this.pricesService.getPriceHistory(categoryId, department, days);
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pedido' })
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis pedidos (como comprador o vendedor)' })
  getOrders(
    @CurrentUser() user: User,
    @Query('role') role: 'buyer' | 'seller' | 'all' = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getOrders(user.id, role, page, limit);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de pedido' })
  getOrder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.getOrder(id, user.id);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  updateOrderStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { status: any; note?: string },
  ) {
    return this.ordersService.updateOrderStatus(id, user.id, body.status, body.note);
  }

  @Post('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar pedido' })
  cancelOrder(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.ordersService.cancelOrder(id, user.id, body.reason);
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dejar reseña post-transacción' })
  createReview(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.ordersService.createReview(user.id, dto);
  }
}
