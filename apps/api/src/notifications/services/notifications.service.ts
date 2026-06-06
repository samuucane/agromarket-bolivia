import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
  }

  async send(userId: string, event: { title: string; message: string; eventType: string; data?: any }) {
    await this.prisma.notification.create({
      data: { userId, title: event.title, message: event.message, eventType: event.eventType, data: event.data, channel: NotificationChannel.IN_APP },
    });
    this.logger.log(`Notification sent to ${userId}: ${event.eventType}`);
  }
}
