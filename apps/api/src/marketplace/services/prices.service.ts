import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ─── Prices Service ───────────────────────────────────────────────────────────

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  constructor(private prisma: PrismaService) {}

  async getCurrentPrices(department?: string, categoryId?: string) {
    const where: any = {};
    if (department) where.department = department;
    if (categoryId) where.categoryId = categoryId;

    // Get the latest price entry per product per department
    const prices = await this.prisma.priceHistory.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 100,
      include: { category: { select: { name: true, slug: true } } },
    });

    return prices;
  }

  async getPriceHistory(categoryId: string, department?: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.priceHistory.findMany({
      where: {
        categoryId,
        ...(department && { department }),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async recordPrice(
    categoryId: string,
    productName: string,
    department: string,
    prices: { avg: number; min: number; max: number; sampleCount: number },
    unit: string,
  ) {
    return this.prisma.priceHistory.create({
      data: {
        categoryId,
        productName,
        department,
        avgPrice: prices.avg,
        minPrice: prices.min,
        maxPrice: prices.max,
        sampleCount: prices.sampleCount,
        unit,
      },
    });
  }

  /**
   * Aggregate current listing prices into price history
   * Runs as a scheduled job (every 6 hours)
   */
  async aggregatePrices() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        category_id,
        location_dept,
        EXTRACT(EPOCH FROM NOW())::bigint as ts,
        AVG(price_per_unit) as avg_price,
        MIN(price_per_unit) as min_price,
        MAX(price_per_unit) as max_price,
        COUNT(*) as sample_count,
        unit
      FROM listings
      WHERE status = 'ACTIVE'
        AND expires_at > NOW()
        AND created_at > NOW() - INTERVAL '7 days'
        AND product_type = 'AGRICULTURAL_PRODUCT'
      GROUP BY category_id, location_dept, unit
      HAVING COUNT(*) >= 3
    `;

    for (const row of result) {
      await this.prisma.priceHistory.create({
        data: {
          categoryId: row.category_id,
          productName: '',
          department: row.location_dept ?? 'Nacional',
          avgPrice: row.avg_price,
          minPrice: row.min_price,
          maxPrice: row.max_price,
          sampleCount: Number(row.sample_count),
          unit: row.unit ?? 'qq',
        },
      });
    }

    this.logger.log(`Price aggregation complete: ${result.length} records`);
  }
}

// ─── Search Service ───────────────────────────────────────────────────────────

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Full-text search using PostgreSQL tsvector
   * Elasticsearch integration can be added later for production
   */
  async searchListings(query: string, filters: any = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT
        l.id,
        l.title,
        l.description,
        l.price_per_unit,
        l.currency,
        l.unit,
        l.quantity,
        l.location_dept,
        l.location_muni,
        l.is_organic,
        l.has_certification,
        l.product_type,
        l.listing_type,
        l.created_at,
        ts_rank(
          to_tsvector('spanish', l.title || ' ' || COALESCE(l.description, '')),
          plainto_tsquery('spanish', ${query})
        ) AS rank,
        u.id as seller_id,
        pp.full_name as seller_name,
        pp.certification_level
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      LEFT JOIN producer_profiles pp ON u.id = pp.user_id
      WHERE
        l.status = 'ACTIVE'
        AND l.expires_at > NOW()
        AND to_tsvector('spanish', l.title || ' ' || COALESCE(l.description, ''))
            @@ plainto_tsquery('spanish', ${query})
        ${filters.department ? `AND l.location_dept = '${filters.department}'` : ''}
        ${filters.productType ? `AND l.product_type = '${filters.productType}'` : ''}
        ${filters.isOrganic !== undefined ? `AND l.is_organic = ${filters.isOrganic}` : ''}
      ORDER BY rank DESC, l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as total
      FROM listings l
      WHERE
        l.status = 'ACTIVE'
        AND l.expires_at > NOW()
        AND to_tsvector('spanish', l.title || ' ' || COALESCE(l.description, ''))
            @@ plainto_tsquery('spanish', ${query})
    `;

    const total = Number(countResult[0]?.total ?? 0);

    return {
      data: results,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getCategories(type?: string) {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        ...(type && { type: type as any }),
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
