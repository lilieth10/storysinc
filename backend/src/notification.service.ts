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

  createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }): NotificationPayload {
    // Simular creación de notificación por ahora
    const notification = {
      id: Date.now(),
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };

    return notification;
  }

  getNotificationsForUser(userId: number): NotificationPayload[] {
    // Simular notificaciones por ahora
    return [
      {
        id: 1,
        userId,
        title: 'Bienvenido a Proogia',
        message: 'Tu cuenta ha sido creada exitosamente',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  markAsRead(notificationId: number): NotificationPayload {
    // Simular marcar como leída
    return {
      id: notificationId,
      userId: 1,
      title: 'Notificación',
      message: 'Mensaje de prueba',
      type: 'info',
      read: true,
      createdAt: new Date().toISOString(),
    };
  }

  deleteNotification(notificationId: number): NotificationPayload {
    // Simular eliminación
    return {
      id: notificationId,
      userId: 1,
      title: 'Notificación eliminada',
      message: 'Esta notificación fue eliminada',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
  }

  getUnreadCount(): number {
    // Simular conteo de no leídas
    return 2;
  }
}
