import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/store/auth';

interface ConnectedUser {
  userId: number;
  userName: string;
}

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

export const useCollaboration = (projectId: number) => {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId || !user || !token) return;

    // Conectar al namespace de colaboración
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/collaboration`, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      
      // Unirse al proyecto
      socket.emit('join-project', {
        projectId,
        userId: user.id,
        userName: user.fullName || user.username
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connected-users', (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    socket.on('user-joined', (data: { userId: number; userName: string; timestamp: string }) => {
      setConnectedUsers(prev => [...prev, { userId: data.userId, userName: data.userName }]);
    });

    socket.on('user-left', (data: { userId: number; userName: string; timestamp: string }) => {
      setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      socket.emit('leave-project', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, user, token]);

  const sendCodeChange = (filePath: string, content: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('code-change', {
        projectId,
        filePath,
        content,
        userId: user.id,
        userName: user.fullName || user.username,
        timestamp: new Date().toISOString()
      });
    }
  };

  const sendCursorPosition = (filePath: string, line: number, column: number) => {
    if (socketRef.current && user) {
      socketRef.current.emit('cursor-position', {
        projectId,
        filePath,
        line,
        column,
        userId: user.id,
        userName: user.fullName || user.username
      });
    }
  };

  const sendFileOpened = (filePath: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('file-opened', {
        projectId,
        filePath
      });
    }
  };

  const onCodeChanged = (callback: (data: CodeChange) => void) => {
    if (socketRef.current) {
      socketRef.current.on('code-changed', callback);
      return () => socketRef.current?.off('code-changed', callback);
    }
  };

  const onCursorMoved = (callback: (data: CursorPosition) => void) => {
    if (socketRef.current) {
      socketRef.current.on('cursor-moved', callback);
      return () => socketRef.current?.off('cursor-moved', callback);
    }
  };

  const onFileOpened = (callback: (data: { filePath: string; userId: number; userName: string; timestamp: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('file-opened-by-user', callback);
      return () => socketRef.current?.off('file-opened-by-user', callback);
    }
  };

  return {
    isConnected,
    connectedUsers,
    sendCodeChange,
    sendCursorPosition,
    sendFileOpened,
    onCodeChanged,
    onCursorMoved,
    onFileOpened
  };
};