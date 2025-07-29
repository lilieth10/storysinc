/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PrismaService } from './prisma.service';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @Roles('admin')
  async getDashboard() {
    // Métricas globales para admin
    const totalUsers = await this.prisma.user.count();
    const totalProjects = await this.prisma.project.count();
    const totalReports = await this.prisma.report.count();

    // Usuarios activos (con proyectos)
    const activeUsers = await this.prisma.user.count({
      where: {
        OR: [{ projectsOwned: { some: {} } }, { collaborations: { some: {} } }],
      },
    });

    return {
      metrics: {
        totalUsers,
        totalProjects,
        totalReports,
        activeUsers,
      },
      recentActivity: {
        // Últimos 5 proyectos creados
        recentProjects: await this.prisma.project.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { owner: { select: { fullName: true, email: true } } },
        }),
        // Últimos 5 reportes generados
        recentReports: await this.prisma.report.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true, email: true } } },
        }),
      },
    };
  }

  @Get('users')
  @Roles('admin')
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            projectsOwned: true,
            reports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Put('users/:id/role')
  @Roles('admin')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: body.role },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }

  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return { message: 'Usuario eliminado' };
  }

  @Get('reports/global')
  @Roles('admin')
  async getGlobalReports() {
    // Reportes globales de toda la plataforma
    const totalProjects = await this.prisma.project.count();
    const projectsByPattern = await this.prisma.project.groupBy({
      by: ['pattern'],
      _count: { pattern: true },
    });

    const totalUsers = await this.prisma.user.count();
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    return {
      platformMetrics: {
        totalProjects,
        totalUsers,
        projectsByPattern,
        usersByRole,
      },
    };
  }
}
