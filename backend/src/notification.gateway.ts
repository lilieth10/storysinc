/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface NotificationPayload {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

@WebSocketGateway({ cors: { origin: 'http://localhost:3000' } })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // Mapea userId a socketId para notificaciones privadas
  private userSockets = new Map<number, string>();

  handleConnection(socket: Socket) {
    // El frontend debe enviar el userId como query param al conectar
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userIdParam = socket.handshake.query.userId;
    const userId =
      typeof userIdParam === 'string'
        ? parseInt(userIdParam, 10)
        : Number(userIdParam);

    if (!isNaN(userId)) {
      this.userSockets.set(userId, socket.id);
    }
  }

  handleDisconnect(socket: Socket) {
    // Eliminar el socket del mapa al desconectar
    for (const [userId, sockId] of this.userSockets.entries()) {
      if (sockId === socket.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Método para emitir una notificación a un usuario específico
  sendNotificationToUser(userId: number, notification: NotificationPayload) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // (Opcional) Para pruebas: recibir mensaje y reenviar
  @SubscribeMessage('test-notification')
  handleTestNotification(
    @MessageBody() data: { userId: number; notification: NotificationPayload },
  ) {
    this.sendNotificationToUser(data.userId, data.notification);
  }
}
