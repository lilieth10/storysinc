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
  list(@Req() req: AuthRequest): NotificationPayload[] {
    return this.notificationService.getNotificationsForUser(req.user.userId);
  }

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body()
    data: {
      title: string;
      message: string;
      type?: string;
    },
  ): NotificationPayload {
    return this.notificationService.createNotification({
      userId: req.user.userId,
      ...data,
    });
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string): NotificationPayload {
    return this.notificationService.markAsRead(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string): NotificationPayload {
    return this.notificationService.deleteNotification(Number(id));
  }
}
