import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from './prisma.module';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [PrismaModule],
  providers: [UserService, NotificationGateway, NotificationService],
  controllers: [UserController, NotificationController],
  exports: [UserService, NotificationGateway, NotificationService],
})
export class UserModule {}
