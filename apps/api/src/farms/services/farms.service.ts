import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';

// ─── Weather Service ──────────────────────────────────────────────────────────

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private config: ConfigService) {}

  async getWeather(lat: number, lng: number) {
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) return { message: 'Weather service not configured' };

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=es&cnt=40`,
        { timeout: 5000 },
      );
      return res.data;
    } catch (err) {
      this.logger.warn(`Weather API error: ${err.message}`);
      return null;
    }
  }
}

// ─── Farms Service ────────────────────────────────────────────────────────────

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService, private weatherService: WeatherService) {}

  async createFarm(producerId: string, userId: string, dto: any) {
    const profile = await this.prisma.producerProfile.findFirst({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil de productor no encontrado');

    return this.prisma.farm.create({
      data: {
        producerId: profile.id,
        name: dto.name,
        totalHectares: dto.totalHectares,
        locationDept: dto.locationDept,
        locationMuni: dto.locationMuni,
        latitude: dto.latitude,
        longitude: dto.longitude,
        soilType: dto.soilType,
        waterSource: dto.waterSource,
      },
    });
  }

  async getMyFarms(userId: string) {
    const profile = await this.prisma.producerProfile.findFirst({ where: { userId } });
    if (!profile) return [];

    return this.prisma.farm.findMany({
      where: { producerId: profile.id },
      include: {
        cycles: { where: { status: { in: ['ACTIVE', 'PLANNED'] } } },
        _count: { select: { cycles: true, alerts: { where: { isRead: false } } } },
      },
    });
  }

  async getFarmDashboard(farmId: string, userId: string) {
    const farm = await this.assertFarmAccess(farmId, userId);

    const [activeCycles, recentExpenses, alerts] = await Promise.all([
      this.prisma.cropCycle.findMany({
        where: { farmId, status: 'ACTIVE' },
        include: { expenses: true },
      }),
      this.prisma.farmExpense.findMany({
        where: { cycle: { farmId } },
        orderBy: { expenseDate: 'desc' },
        take: 10,
      }),
      this.prisma.farmAlert.findMany({
        where: { farmId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalExpenses = activeCycles.reduce(
      (acc, cycle) => acc + cycle.expenses.reduce((s, e) => s + Number(e.amount), 0), 0,
    );

    return { farm, activeCycles: activeCycles.length, totalExpenses, recentExpenses, alerts };
  }

  async startCycle(farmId: string, userId: string, dto: any) {
    await this.assertFarmAccess(farmId, userId);
    return this.prisma.cropCycle.create({
      data: { farmId, cropName: dto.cropName, variety: dto.variety, plantedHectares: dto.plantedHectares,
        plantingDate: new Date(dto.plantingDate), expectedHarvest: dto.expectedHarvest ? new Date(dto.expectedHarvest) : undefined,
        expectedYield: dto.expectedYield, notes: dto.notes, status: 'ACTIVE' },
    });
  }

  async addExpense(cycleId: string, userId: string, dto: any) {
    const cycle = await this.prisma.cropCycle.findUnique({ where: { id: cycleId }, include: { farm: true } });
    if (!cycle) throw new NotFoundException('Ciclo no encontrado');
    await this.assertFarmAccess(cycle.farmId, userId);

    return this.prisma.farmExpense.create({
      data: { cycleId, category: dto.category, description: dto.description,
        amount: dto.amount, expenseDate: new Date(dto.expenseDate), receiptUrl: dto.receiptUrl },
    });
  }

  async getFarmWeather(farmId: string, userId: string) {
    const farm = await this.assertFarmAccess(farmId, userId);
    if (!farm.latitude || !farm.longitude) return { message: 'Coordenadas de finca no configuradas' };
    return this.weatherService.getWeather(farm.latitude, farm.longitude);
  }

  private async assertFarmAccess(farmId: string, userId: string) {
    const profile = await this.prisma.producerProfile.findFirst({ where: { userId } });
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Finca no encontrada');
    if (farm.producerId !== profile?.id) throw new ForbiddenException('Sin autorización');
    return farm;
  }
}
