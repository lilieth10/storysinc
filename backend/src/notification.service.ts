import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface NotificationPayload {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }): Promise<NotificationPayload> {
    // Crear notificación real en la DB
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        read: false,
      },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async getNotificationsForUser(
    userId: number,
  ): Promise<NotificationPayload[]> {
    // Obtener notificaciones reales de la DB
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    }));
  }

  async markAsRead(
    notificationId: number,
  ): Promise<NotificationPayload> {
    // Marcar como leída en la DB
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async deleteNotification(notificationId: number): Promise<NotificationPayload> {
    // Eliminar de la DB
    const notification = await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  getUnreadCount(): number {
    // Simular conteo de no leídas
    return 2;
  }
}
