import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ListingStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto, ListListingsDto } from '../dto/marketplace.dto';

const PLATFORM_FEE_RATES = {
  AGRICULTURAL_PRODUCT: 0.03,  // 3%
  SUPPLY: 0.025,               // 2.5%
  MACHINERY: 0.02,             // 2%
};

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private prisma: PrismaService) {}

  async createListing(sellerId: string, dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        listingType: dto.listingType,
        productType: dto.productType,
        quantity: dto.quantity,
        unit: dto.unit,
        pricePerUnit: dto.pricePerUnit,
        minOrder: dto.minOrder,
        maxOrder: dto.maxOrder,
        locationDept: dto.locationDept,
        locationMuni: dto.locationMuni,
        latitude: dto.latitude,
        longitude: dto.longitude,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        isNegotiable: dto.isNegotiable ?? true,
        isOrganic: dto.isOrganic ?? false,
        hasCertification: dto.hasCertification ?? false,
        certificationType: dto.certificationType,
        status: ListingStatus.ACTIVE,
        // Listings expire in 60 days by default
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            producerProfile: { select: { fullName: true, certificationLevel: true } },
          },
        },
        category: true,
        images: true,
      },
    });

    this.logger.log(`Listing created: ${listing.id} by ${sellerId}`);
    return listing;
  }

  async getListings(filters: ListListingsDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...rest } = filters;

    const where: any = {
      status: ListingStatus.ACTIVE,
      expiresAt: { gt: new Date() },
    };

    if (rest.productType) where.productType = rest.productType;
    if (rest.categoryId) where.categoryId = rest.categoryId;
    if (rest.department) where.locationDept = rest.department;
    if (rest.isOrganic !== undefined) where.isOrganic = rest.isOrganic;
    if (rest.hasCertification !== undefined) where.hasCertification = rest.hasCertification;

    if (rest.minPrice || rest.maxPrice) {
      where.pricePerUnit = {
        ...(rest.minPrice && { gte: rest.minPrice }),
        ...(rest.maxPrice && { lte: rest.maxPrice }),
      };
    }

    return this.prisma.paginate('listing', {
      where,
      orderBy: { [sortBy]: sortOrder },
      page,
      limit,
      include: {
        seller: {
          select: {
            id: true,
            producerProfile: { select: { fullName: true, certificationLevel: true } },
          },
        },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { orders: true } },
      },
    });
  }

  async getListing(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            phone: true,
            producerProfile: {
              select: {
                fullName: true,
                certificationLevel: true,
                department: true,
                municipality: true,
                totalHectares: true,
              },
            },
            reviewsReceived: {
              select: { rating: true },
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
          },
        },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orders: true } },
      },
    });

    if (!listing || listing.status === ListingStatus.REMOVED) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Increment view count (fire and forget)
    this.prisma.listing
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    // Calculate seller average rating
    const ratings = (listing.seller as any).reviewsReceived?.map((r: any) => r.rating) ?? [];
    const avgRating = ratings.length
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : null;

    return {
      ...listing,
      seller: {
        ...listing.seller,
        avgRating,
        totalReviews: ratings.length,
        reviewsReceived: undefined, // hide raw data
      },
    };
  }

  async updateListing(id: string, sellerId: string, data: Partial<CreateListingDto>) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Publicación no encontrada');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Sin autorización');

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.pricePerUnit !== undefined && { pricePerUnit: data.pricePerUnit }),
        ...(data.isNegotiable !== undefined && { isNegotiable: data.isNegotiable }),
        ...(data.locationDept && { locationDept: data.locationDept }),
        ...(data.locationMuni && { locationMuni: data.locationMuni }),
      },
    });
  }

  async deleteListing(id: string, userId: string, userRole: UserRole) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Publicación no encontrada');

    const isOwner = listing.sellerId === userId;
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) throw new ForbiddenException('Sin autorización');

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.REMOVED },
    });
  }

  async getMyListings(sellerId: string, page = 1, limit = 20) {
    return this.prisma.paginate('listing', {
      where: { sellerId, status: { not: ListingStatus.REMOVED } },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true } },
        _count: { select: { orders: true } },
      },
    });
  }

  async addImages(listingId: string, sellerId: string, imageUrls: string[]) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Publicación no encontrada');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Sin autorización');

    const images = await this.prisma.listingImage.createMany({
      data: imageUrls.map((url, i) => ({
        listingId,
        url,
        isPrimary: i === 0 && !(await this.hasImages(listingId)),
        sortOrder: i,
      })),
    });

    return images;
  }

  private async hasImages(listingId: string): Promise<boolean> {
    const count = await this.prisma.listingImage.count({ where: { listingId } });
    return count > 0;
  }
}
