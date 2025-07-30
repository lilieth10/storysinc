/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    try {
      // Métricas reales de la base de datos
      const totalUsers = await this.prisma.user.count();
      const totalProjects = await this.prisma.project.count();
      const totalReports = await this.prisma.report.count();
      const totalTrainingResources = await this.prisma.trainingResource.count();
      const totalCertificates = await this.prisma.trainingCertificate.count();

      // Usuarios activos (con proyectos o reportes en los últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await this.prisma.user.count({
        where: {
          OR: [
            { projectsOwned: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { reports: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { userProgress: { some: { startedAt: { gte: thirtyDaysAgo } } } },
          ],
        },
      });

      // Últimos 5 proyectos creados
      const recentProjects = await this.prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { fullName: true, email: true } } },
      });

      // Últimos 5 reportes generados
      const recentReports = await this.prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      });

      // Obtener todos los usuarios para la tabla
      const users = await this.prisma.user.findMany({
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
              userProgress: true,
              certificates: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Estadísticas de capacitación
      const trainingStats = await this.prisma.userTrainingProgress.groupBy({
        by: ['completed'],
        _count: { completed: true },
      });

      const completedCourses =
        trainingStats.find((stat) => stat.completed)?._count.completed || 0;
      const inProgressCourses =
        trainingStats.find((stat) => !stat.completed)?._count.completed || 0;

      // Transformar los datos para que sean compatibles con el frontend
      const transformedRecentProjects = recentProjects.map((project) => ({
        id: project.id,
        name: project.name,
        user: project.owner.fullName,
        date: project.createdAt.toLocaleDateString('es-ES'),
        pattern: project.pattern,
        language: project.language,
      }));

      const transformedRecentReports = recentReports.map((report) => ({
        id: report.id,
        title: report.title || 'Reporte sin título',
        user: report.user.fullName,
        date: report.createdAt.toLocaleDateString('es-ES'),
      }));

      return {
        metrics: {
          totalUsers,
          totalProjects,
          totalReports,
          activeUsers,
          totalTrainingResources,
          totalCertificates,
          completedCourses,
          inProgressCourses,
        },
        users,
        recentProjects: transformedRecentProjects,
        recentReports: transformedRecentReports,
      };
    } catch (error: any) {
      console.error('Error en getDashboard:', error);
      throw new Error('Error al obtener datos del dashboard');
    }
  }

  @Get('users')
  @Roles('admin')
  async getAllUsers() {
    try {
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
              userProgress: true,
              certificates: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      console.error('Error en getAllUsers:', error);
      throw new Error('Error al obtener usuarios');
    }
  }

  @Put('users/:id/role')
  @Roles('admin')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    try {
      // Validar que el rol sea válido
      if (!['admin', 'user'].includes(body.role)) {
        throw new Error('Rol inválido. Debe ser "admin" o "user"');
      }

      // Verificar que el usuario existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar el rol
      const updatedUser = await this.prisma.user.update({
        where: { id: parseInt(id) },
        data: { role: body.role },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        message: `Rol actualizado exitosamente a ${body.role}`,
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('Error en updateUserRole:', error);
      throw new Error(
        `Error al actualizar rol: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // No permitir eliminar el último admin
      if (existingUser.role === 'admin') {
        const adminCount = await this.prisma.user.count({
          where: { role: 'admin' },
        });
        if (adminCount <= 1) {
          throw new Error('No se puede eliminar el último administrador');
        }
      }

      // Eliminar registros relacionados en orden
      await this.prisma.userTrainingProgress.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.trainingCertificate.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.projectCollaborator.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.report.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.syncHistory.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.aIChatMessage.deleteMany({
        where: { userId: parseInt(id) },
      });

      await this.prisma.aIAnalysis.deleteMany({
        where: { userId: parseInt(id) },
      });

      // Eliminar proyectos del usuario
      await this.prisma.project.deleteMany({
        where: { ownerId: parseInt(id) },
      });

      // Finalmente eliminar el usuario
      const deletedUser = await this.prisma.user.delete({
        where: { id: parseInt(id) },
      });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente',
        user: deletedUser,
      };
    } catch (error: any) {
      console.error('Error en deleteUser:', error);
      throw new Error(
        `Error al eliminar usuario: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  @Get('reports')
  @Roles('admin')
  async getGlobalReports() {
    try {
      // Reporte de proyectos por patrón
      const projectsByPattern = await this.prisma.project.groupBy({
        by: ['pattern'],
        _count: {
          pattern: true,
        },
      });

      // Reporte de usuarios por rol
      const usersByRole = await this.prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      });

      // Reporte de capacitación
      const trainingStats = await this.prisma.userTrainingProgress.groupBy({
        by: ['completed'],
        _count: { completed: true },
        _avg: { progress: true },
      });

      // Reporte de reportes por tipo
      const reportsByType = await this.prisma.report.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
      });

      return {
        projectsByPattern,
        usersByRole,
        trainingStats,
        reportsByType,
      };
    } catch (error) {
      console.error('Error en getGlobalReports:', error);
      throw new Error('Error al obtener reportes globales');
    }
  }

  @Get('training/stats')
  @Roles('admin')
  async getTrainingStats() {
    try {
      const totalResources = await this.prisma.trainingResource.count();
      const totalProgress = await this.prisma.userTrainingProgress.count();
      const completedCourses = await this.prisma.userTrainingProgress.count({
        where: { completed: true },
      });
      const totalCertificates = await this.prisma.trainingCertificate.count();

      const averageProgress = await this.prisma.userTrainingProgress.aggregate({
        _avg: { progress: true },
      });

      return {
        totalResources,
        totalProgress,
        completedCourses,
        totalCertificates,
        averageProgress: Math.round(averageProgress._avg.progress || 0),
      };
    } catch (error) {
      console.error('Error en getTrainingStats:', error);
      throw new Error('Error al obtener estadísticas de capacitación');
    }
  }
}
