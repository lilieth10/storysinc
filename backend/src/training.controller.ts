/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PrismaService } from './prisma.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

interface UpdateProgressDto {
  progress: number;
  timeSpent: number;
}

interface CreateTrainingResourceDto {
  title: string;
  description: string;
  content: string;
  type: string;
  category: string;
  difficulty: string;
  duration?: number;
  imageUrl?: string;
  codeSnippet?: string;
  order?: number;
  isActive?: boolean;
  fileUrl?: string;
  videoUrl?: string;
}

@Controller('training')
@UseGuards(AuthGuard('jwt'))
export class TrainingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAllTrainingResources(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;

    try {
      // Obtener recursos reales de la base de datos
      const trainingResources = await this.prisma.trainingResource.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      // Obtener progreso del usuario desde la base de datos
      const userProgress = await this.prisma.userTrainingProgress.findMany({
        where: { userId },
        include: { resource: true },
      });

      // Combinar recursos con progreso del usuario
      return trainingResources.map((resource) => {
        const progress = userProgress.find((p) => p.resourceId === resource.id);
        return {
          id: resource.id,
          title: resource.title,
          description: resource.description,
          type: resource.type,
          category: resource.category,
          difficulty: resource.difficulty,
          duration: resource.duration,
          fileUrl: resource.fileUrl,
          videoUrl: resource.videoUrl,
          codeSnippet: resource.codeSnippet
            ? JSON.parse(resource.codeSnippet)
            : null,
          userProgress: progress
            ? {
                progress: progress.progress,
                timeSpent: progress.timeSpent,
                completed: progress.completed,
                startedAt: progress.startedAt.toISOString(),
                completedAt: progress.completedAt?.toISOString(),
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error fetching training resources:', error);
      return [];
    }
  }

  @Get('categories')
  getCategories() {
    return ['react', 'css', 'testing', 'javascript', 'typescript'];
  }

  @Post(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const resourceId = parseInt(id);

    try {
      // Actualizar o crear progreso del usuario
      const progress = await this.prisma.userTrainingProgress.upsert({
        where: {
          userId_resourceId: {
            userId,
            resourceId,
          },
        },
        update: {
          progress: updateProgressDto.progress,
          timeSpent: updateProgressDto.timeSpent,
          completed: updateProgressDto.progress >= 100,
          completedAt: updateProgressDto.progress >= 100 ? new Date() : null,
        },
        create: {
          userId,
          resourceId,
          progress: updateProgressDto.progress,
          timeSpent: updateProgressDto.timeSpent,
          completed: updateProgressDto.progress >= 100,
          completedAt: updateProgressDto.progress >= 100 ? new Date() : null,
        },
      });

      return { success: true, progress };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  }

  @Get(':id/certificate')
  async generateCertificate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const resourceId = parseInt(id);

    try {
      // Verificar si el usuario completó el curso
      const progress = await this.prisma.userTrainingProgress.findUnique({
        where: {
          userId_resourceId: {
            userId,
            resourceId,
          },
        },
      });

      if (!progress || !progress.completed) {
        return { success: false, error: 'Course not completed' };
      }

      // Generar certificado (mock)
      const certificate = await this.prisma.trainingCertificate.upsert({
        where: {
          userId_resourceId: {
            userId,
            resourceId,
          },
        },
        update: {
          certificateUrl: `https://example.com/certificates/${userId}-${resourceId}.pdf`,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        },
        create: {
          userId,
          resourceId,
          certificateUrl: `https://example.com/certificates/${userId}-${resourceId}.pdf`,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        },
      });

      return { success: true, certificate };
    } catch (error) {
      console.error('Error generating certificate:', error);
      return { success: false, error: 'Failed to generate certificate' };
    }
  }

  @Get('my-progress')
  async getUserProgress(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;

    try {
      const progress = await this.prisma.userTrainingProgress.findMany({
        where: { userId },
        include: { resource: true },
      });

      const totalCourses = progress.length;
      const completedCourses = progress.filter((p) => p.completed).length;
      const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
      const averageProgress =
        progress.length > 0
          ? progress.reduce((sum, p) => sum + p.progress, 0) / progress.length
          : 0;

      return {
        totalCourses,
        completedCourses,
        totalTimeSpent,
        averageProgress: Math.round(averageProgress),
        courses: progress.map((p) => ({
          id: p.resourceId,
          title: p.resource.title,
          progress: p.progress,
          completed: p.completed,
          timeSpent: p.timeSpent,
        })),
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return { success: false, error: 'Failed to fetch progress' };
    }
  }

  // ========== ENDPOINTS PARA ADMIN ==========

  @Get('admin/resources')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTrainingResourcesForAdmin() {
    try {
      const resources = await this.prisma.trainingResource.findMany({
        include: {
          userProgress: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          certificates: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return resources;
    } catch (error) {
      console.error('Error fetching training resources for admin:', error);
      throw new Error('Error al obtener recursos de capacitación');
    }
  }

  @Post('admin/resources')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createTrainingResource(@Body() createDto: CreateTrainingResourceDto) {
    try {
      const resource = await this.prisma.trainingResource.create({
        data: {
          title: createDto.title,
          description: createDto.description,
          content: createDto.content,
          type: createDto.type,
          category: createDto.category,
          difficulty: createDto.difficulty,
          duration: createDto.duration,
          imageUrl: createDto.imageUrl,
          codeSnippet: createDto.codeSnippet,
          order: createDto.order || 0,
          isActive: createDto.isActive !== false,
          fileUrl: createDto.fileUrl,
          videoUrl: createDto.videoUrl,
        },
      });

      return {
        success: true,
        message: 'Recurso de capacitación creado exitosamente',
        resource,
      };
    } catch (error) {
      console.error('Error creating training resource:', error);
      throw new Error('Error al crear recurso de capacitación');
    }
  }

  @Put('admin/resources/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateTrainingResource(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTrainingResourceDto>,
  ) {
    try {
      const resource = await this.prisma.trainingResource.update({
        where: { id: parseInt(id) },
        data: updateDto,
      });

      return {
        success: true,
        message: 'Recurso de capacitación actualizado exitosamente',
        resource,
      };
    } catch (error) {
      console.error('Error updating training resource:', error);
      throw new Error('Error al actualizar recurso de capacitación');
    }
  }

  @Delete('admin/resources/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deleteTrainingResource(@Param('id') id: string) {
    try {
      // Eliminar progreso y certificados relacionados
      await this.prisma.userTrainingProgress.deleteMany({
        where: { resourceId: parseInt(id) },
      });

      await this.prisma.trainingCertificate.deleteMany({
        where: { resourceId: parseInt(id) },
      });

      // Eliminar el recurso
      await this.prisma.trainingResource.delete({
        where: { id: parseInt(id) },
      });

      return {
        success: true,
        message: 'Recurso de capacitación eliminado exitosamente',
      };
    } catch (error) {
      console.error('Error deleting training resource:', error);
      throw new Error('Error al eliminar recurso de capacitación');
    }
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getTrainingStatsForAdmin() {
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

      // Estadísticas por categoría
      const statsByCategory = await this.prisma.trainingResource.groupBy({
        by: ['category'],
        _count: { category: true },
      });

      // Usuarios más activos en capacitación
      const topUsers = await this.prisma.userTrainingProgress.groupBy({
        by: ['userId'],
        _count: { userId: true },
        _sum: { timeSpent: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      });

      return {
        totalResources,
        totalProgress,
        completedCourses,
        totalCertificates,
        averageProgress: Math.round(averageProgress._avg.progress || 0),
        statsByCategory,
        topUsers,
      };
    } catch (error) {
      console.error('Error fetching training stats for admin:', error);
      throw new Error('Error al obtener estadísticas de capacitación');
    }
  }

  @Get('admin/user-progress/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUserProgressForAdmin(@Param('userId') userId: string) {
    try {
      const progress = await this.prisma.userTrainingProgress.findMany({
        where: { userId: parseInt(userId) },
        include: {
          resource: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      });

      return {
        user,
        progress,
        totalCourses: progress.length,
        completedCourses: progress.filter((p) => p.completed).length,
        totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0),
        averageProgress:
          progress.length > 0
            ? Math.round(
                progress.reduce((sum, p) => sum + p.progress, 0) /
                  progress.length,
              )
            : 0,
      };
    } catch (error) {
      console.error('Error fetching user progress for admin:', error);
      throw new Error('Error al obtener progreso del usuario');
    }
  }
}
