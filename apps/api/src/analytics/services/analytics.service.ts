import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getProducerDashboard(userId: string) {
    const [orders, wallet, profile] = await Promise.all([
      this.prisma.order.findMany({ where: { sellerId: userId, status: 'COMPLETED' }, take: 10, orderBy: { createdAt: 'desc' } }),
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.producerProfile.findFirst({ where: { userId } }),
    ]);
    const totalRevenue = orders.reduce((a, o) => a + Number(o.subtotal), 0);
    return { totalRevenue, ordersCompleted: orders.length, walletBalance: wallet?.balance ?? 0, creditScore: profile?.creditScore ?? null, recentOrders: orders.slice(0, 5) };
  }

  async getAdminDashboard() {
    const [users, orders, loans] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.findMany({ where: { status: 'COMPLETED' } }),
      this.prisma.creditLoan.findMany({ where: { status: 'ACTIVE' } }),
    ]);
    const gmv = orders.reduce((a, o) => a + Number(o.total), 0);
    const fees = orders.reduce((a, o) => a + Number(o.platformFee), 0);
    const loanPortfolio = loans.reduce((a, l) => a + Number(l.outstandingBalance), 0);
    return { totalUsers: users, gmv, feesCollected: fees, activeLoans: loans.length, loanPortfolio };
  }
}
