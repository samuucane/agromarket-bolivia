import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private config: ConfigService) {
    super({
      datasources: {
        db: { url: config.get<string>('DATABASE_URL') },
      },
      log:
        config.get<string>('NODE_ENV') === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      if (process.env.NODE_ENV === 'development') {
        (this as any).$on('query', (e: any) => {
          this.logger.debug(`Query: ${e.query} — Duration: ${e.duration}ms`);
        });
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Soft-delete helper — sets deletedAt instead of removing the row
   */
  async softDelete(model: string, id: string): Promise<void> {
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Paginate helper
   */
  async paginate<T>(
    model: string,
    args: {
      where?: any;
      orderBy?: any;
      page?: number;
      limit?: number;
      select?: any;
      include?: any;
    },
  ): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; pages: number } }> {
    const { where, orderBy, select, include, page = 1, limit = 20 } = args;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (this as any)[model].findMany({
        where,
        orderBy,
        select,
        include,
        skip,
        take: limit,
      }),
      (this as any)[model].count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
