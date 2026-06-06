import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, ProductType } from '@prisma/client';
import { nanoid } from 'nanoid';

import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from '../dto/marketplace.dto';

const PLATFORM_FEE_RATES: Record<string, number> = {
  AGRICULTURAL_PRODUCT: 0.03,
  SUPPLY: 0.025,
  MACHINERY: 0.02,
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    });

    if (!listing) throw new NotFoundException('Publicación no encontrada');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('Esta publicación ya no está activa');
    if (listing.sellerId === buyerId) throw new BadRequestException('No puedes comprar tu propia publicación');

    if (listing.minOrder && dto.quantity < Number(listing.minOrder)) {
      throw new BadRequestException(`Pedido mínimo: ${listing.minOrder} ${listing.unit}`);
    }
    if (listing.maxOrder && dto.quantity > Number(listing.maxOrder)) {
      throw new BadRequestException(`Pedido máximo: ${listing.maxOrder} ${listing.unit}`);
    }

    const subtotal = Number(listing.pricePerUnit) * dto.quantity;
    const feeRate = PLATFORM_FEE_RATES[listing.productType] ?? 0.03;
    const platformFee = subtotal * feeRate;
    const total = subtotal + platformFee;

    const orderNumber = `AM-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        listingId: dto.listingId,
        buyerId,
        sellerId: listing.sellerId,
        quantity: dto.quantity,
        unitPrice: listing.pricePerUnit,
        subtotal,
        platformFee,
        total,
        currency: listing.currency,
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        deliveryType: dto.deliveryType,
        deliveryAddress: dto.deliveryAddress,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        notes: dto.notes,
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            note: 'Pedido creado',
            changedBy: buyerId,
          },
        },
      },
      include: {
        listing: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        buyer: { select: { id: true, phone: true } },
        seller: { select: { id: true, phone: true } },
      },
    });

    this.logger.log(`Order created: ${orderNumber} by ${buyerId}`);
    return order;
  }

  async getOrders(userId: string, role: 'buyer' | 'seller' | 'all', page = 1, limit = 20) {
    const where: any = {};
    if (role === 'buyer') where.buyerId = userId;
    else if (role === 'seller') where.sellerId = userId;
    else where.OR = [{ buyerId: userId }, { sellerId: userId }];

    return this.prisma.paginate('order', {
      where,
      orderBy: { createdAt: 'desc' },
      page,
      limit,
      include: {
        listing: {
          select: { title: true, unit: true, images: { where: { isPrimary: true }, take: 1 } },
        },
        buyer: { select: { id: true, phone: true } },
        seller: {
          select: {
            id: true,
            phone: true,
            producerProfile: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async getOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        listing: { include: { images: true, category: true } },
        buyer: { select: { id: true, phone: true, buyerProfile: true } },
        seller: { select: { id: true, phone: true, producerProfile: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        review: true,
        qrPayments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Sin autorización para ver este pedido');
    }

    return order;
  }

  async updateOrderStatus(id: string, userId: string, status: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const canUpdate = order.buyerId === userId || order.sellerId === userId;
    if (!canUpdate) throw new ForbiddenException('Sin autorización');

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === OrderStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
        statusHistory: {
          create: { status, note, changedBy: userId },
        },
      },
    });

    return updated;
  }

  async cancelOrder(id: string, userId: string, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Sin autorización');
    }
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('No se puede cancelar este pedido');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        statusHistory: {
          create: { status: OrderStatus.CANCELLED, note: reason, changedBy: userId },
        },
      },
    });
  }

  async createReview(reviewerId: string, dto: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { review: true },
    });

    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Solo se puede reseñar pedidos completados');
    }
    if (order.review) throw new BadRequestException('Ya existe una reseña para este pedido');
    if (order.buyerId !== reviewerId && order.sellerId !== reviewerId) {
      throw new ForbiddenException('Sin autorización');
    }

    const reviewedId = reviewerId === order.buyerId ? order.sellerId : order.buyerId;

    return this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        reviewerId,
        reviewedId,
        rating: dto.rating,
        comment: dto.comment,
        reviewType: dto.reviewType,
      },
    });
  }
}
