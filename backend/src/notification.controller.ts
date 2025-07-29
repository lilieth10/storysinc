import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  NotificationService,
  NotificationPayload,
} from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { userId: number };
}

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@Req() req: AuthRequest): Promise<NotificationPayload[]> {
    return await this.notificationService.getNotificationsForUser(req.user.userId);
  }

  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body()
    data: {
      title: string;
      message: string;
      type?: string;
    },
  ): Promise<NotificationPayload> {
    return await this.notificationService.createNotification({
      userId: req.user.userId,
      ...data,
    });
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string): Promise<NotificationPayload> {
    return await this.notificationService.markAsRead(Number(id));
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<NotificationPayload> {
    return await this.notificationService.deleteNotification(Number(id));
  }
}
