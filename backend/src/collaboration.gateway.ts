import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface CodeChange {
  projectId: number;
  filePath: string;
  content: string;
  userId: number;
  userName: string;
  timestamp: string;
}

interface CursorPosition {
  projectId: number;
  filePath: string;
  line: number;
  column: number;
  userId: number;
  userName: string;
}

@WebSocketGateway({ 
  cors: { origin: 'http://localhost:3000' },
  namespace: '/collaboration'
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapear projectId a sockets de usuarios conectados
  private projectRooms = new Map<number, Set<string>>();
  // Mapear socketId a información del usuario
  private socketUsers = new Map<string, { userId: number; userName: string; projectId?: number }>();

  handleConnection(socket: Socket) {
    console.log(`Cliente conectado para colaboración: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    const userInfo = this.socketUsers.get(socket.id);
    if (userInfo?.projectId) {
      this.leaveProject(socket, userInfo.projectId);
    }
    this.socketUsers.delete(socket.id);
    console.log(`Cliente desconectado de colaboración: ${socket.id}`);
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { projectId: number; userId: number; userName: string }
  ) {
    const { projectId, userId, userName } = data;
    
    // Guardar información del usuario
    this.socketUsers.set(socket.id, { userId, userName, projectId });
    
    // Unirse a la sala del proyecto
    socket.join(`project-${projectId}`);
    
    // Añadir a la lista de usuarios del proyecto
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId)?.add(socket.id);

    // Notificar a otros usuarios que alguien se unió
    socket.to(`project-${projectId}`).emit('user-joined', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });

    // Enviar lista de usuarios conectados al que se acaba de unir
    const connectedUsers = this.getConnectedUsers(projectId);
    socket.emit('connected-users', connectedUsers);

    console.log(`${userName} se unió al proyecto ${projectId}`);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { projectId: number }
  ) {
    this.leaveProject(socket, data.projectId);
  }

  @SubscribeMessage('code-change')
  handleCodeChange(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CodeChange
  ) {
    const userInfo = this.socketUsers.get(socket.id);
    if (!userInfo) return;

    // Retransmitir el cambio a todos los demás usuarios del proyecto
    socket.to(`project-${data.projectId}`).emit('code-changed', {
      ...data,
      userId: userInfo.userId,
      userName: userInfo.userName,
      timestamp: new Date().toISOString()
    });

    console.log(`Cambio de código de ${userInfo.userName} en proyecto ${data.projectId}: ${data.filePath}`);
  }

  @SubscribeMessage('cursor-position')
  handleCursorPosition(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: CursorPosition
  ) {
    const userInfo = this.socketUsers.get(socket.id);
    if (!userInfo) return;

    // Retransmitir posición del cursor a otros usuarios
    socket.to(`project-${data.projectId}`).emit('cursor-moved', {
      ...data,
      userId: userInfo.userId,
      userName: userInfo.userName
    });
  }

  @SubscribeMessage('file-opened')
  handleFileOpened(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { projectId: number; filePath: string }
  ) {
    const userInfo = this.socketUsers.get(socket.id);
    if (!userInfo) return;

    // Notificar que un usuario abrió un archivo
    socket.to(`project-${data.projectId}`).emit('file-opened-by-user', {
      filePath: data.filePath,
      userId: userInfo.userId,
      userName: userInfo.userName,
      timestamp: new Date().toISOString()
    });
  }

  private leaveProject(socket: Socket, projectId: number) {
    const userInfo = this.socketUsers.get(socket.id);
    
    socket.leave(`project-${projectId}`);
    this.projectRooms.get(projectId)?.delete(socket.id);
    
    if (userInfo) {
      // Notificar a otros que el usuario se desconectó
      socket.to(`project-${projectId}`).emit('user-left', {
        userId: userInfo.userId,
        userName: userInfo.userName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${userInfo.userName} dejó el proyecto ${projectId}`);
    }
  }

  private getConnectedUsers(projectId: number) {
    const sockets = this.projectRooms.get(projectId) || new Set();
    const users: Array<{ userId: number; userName: string }> = [];
    
    for (const socketId of sockets) {
      const userInfo = this.socketUsers.get(socketId);
      if (userInfo) {
        users.push({
          userId: userInfo.userId,
          userName: userInfo.userName
        });
      }
    }
    
    return users;
  }

  // Método público para enviar notificaciones desde otros servicios
  notifyProjectChange(projectId: number, event: string, data: any) {
    this.server.to(`project-${projectId}`).emit(event, data);
  }
}