import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth.module';
import { UserModule } from './user.module';
import { PrismaModule } from './prisma.module';
import { DashboardController } from './dashboard.controller';
import { NotificationGateway } from './notification.gateway';
import { ReportsController } from './reports.controller';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { NotificationService } from './notification.service';
import { SyncController } from './sync.controller';
import { AIController } from './ai.controller';
import { AdminController } from './admin.controller';
import { TrainingController } from './training.controller';
import { AIConfigController } from './ai-config.controller';
import { VersionController } from './version.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, UserModule, PrismaModule],
  controllers: [
    AppController,
    DashboardController,
    ReportsController,
    ProjectController,
    SyncController,
    AIController,
    AdminController,
    TrainingController,
    AIConfigController,
    VersionController,
    UserController,
  ],
  providers: [
    AppService,
    NotificationGateway,
    ProjectService,
    NotificationService,
    UserService,
  ],
})
export class AppModule {}
