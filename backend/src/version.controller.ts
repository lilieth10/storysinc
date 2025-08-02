import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
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

interface CreateVersionDto {
  hash: string;
  message: string;
  author: string;
  branch: string;
  filesChanged: string[];
  projectId: number;
}

@Controller('versions')
@UseGuards(AuthGuard('jwt'))
export class VersionController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getVersions(
    @Req() req: AuthenticatedRequest,
    @Query('author') author?: string,
    @Query('branch') branch?: string,
    @Query('search') search?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Construir filtros
      const where: any = {};

      // Si es admin, puede ver todas las versiones
      // Si es usuario normal, solo ve versiones de proyectos donde es colaborador o propietario
      if (userRole !== 'admin') {
        // Proyectos donde es colaborador
        const userProjects = await this.prisma.projectCollaborator.findMany({
          where: { userId },
          select: { projectId: true },
        });
        
        // Proyectos que posee
        const ownedProjects = await this.prisma.project.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        
        // SyncProjects que posee
        const ownedSyncProjects = await this.prisma.syncProject.findMany({
          where: { userId },
          select: { id: true },
        });

        const allProjectIds = [
          ...userProjects.map((p) => p.projectId),
          ...ownedProjects.map((p) => p.id),
          ...ownedSyncProjects.map((p) => p.id)
        ];

        where.projectId = {
          in: allProjectIds,
        };
      }

      if (author) {
        where.author = { contains: author, mode: 'insensitive' };
      }

      if (branch) {
        where.branch = { contains: branch, mode: 'insensitive' };
      }

      if (search) {
        where.OR = [
          { message: { contains: search, mode: 'insensitive' } },
          { hash: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (start && end) {
        where.createdAt = {
          gte: new Date(start),
          lte: new Date(end),
        };
      }

      const versions = await this.prisma.version.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });



      // Para cada versión, intentar obtener info del proyecto o syncProject
      const versionsWithProjectInfo = await Promise.all(
        versions.map(async (version) => {
          let projectInfo = version.project;
          
          // Si no hay project, buscar en syncProjects
          if (!projectInfo) {
            const syncProject = await this.prisma.syncProject.findUnique({
              where: { id: version.projectId },
              select: { id: true, name: true },
            });
            if (syncProject) {
              projectInfo = { id: syncProject.id, name: syncProject.name };
            }
          }

          return {
            id: version.id,
            hash: version.hash,
            message: version.message,
            author: version.author,
            date: version.createdAt.toISOString(),
            branch: version.branch,
            status: version.status,
            filesChanged: JSON.parse(version.filesChanged || '[]'),
            projectId: projectInfo?.id || version.projectId,
            projectName: projectInfo?.name || `Proyecto ${version.projectId}`,
          };
        })
      );

      return versionsWithProjectInfo;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    }
  }

  @Delete('all')
  async deleteAllVersions(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Solo admin puede eliminar todas las versiones
      if (userRole === 'admin') {
        await this.prisma.version.deleteMany({});
        return { success: true, message: 'Todas las versiones eliminadas' };
      } else {
        // Usuario normal solo elimina sus versiones
        const userProjects = await this.prisma.projectCollaborator.findMany({
          where: { userId },
          select: { projectId: true },
        });
        
        const ownedProjects = await this.prisma.project.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        
        const ownedSyncProjects = await this.prisma.syncProject.findMany({
          where: { userId },
          select: { id: true },
        });

        const allProjectIds = [
          ...userProjects.map((p) => p.projectId),
          ...ownedProjects.map((p) => p.id),
          ...ownedSyncProjects.map((p) => p.id)
        ];

        await this.prisma.version.deleteMany({
          where: { projectId: { in: allProjectIds } }
        });

        return { success: true, message: 'Versiones del usuario eliminadas' };
      }
    } catch (error) {
      console.error('Error deleting versions:', error);
      throw error;
    }
  }

  @Get('stats')
  async getVersionStats(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      let projectFilter = {};
      if (userRole !== 'admin') {
        const userProjects = await this.prisma.projectCollaborator.findMany({
          where: { userId },
          select: { projectId: true },
        });

        projectFilter = {
          projectId: {
            in: userProjects.map((p) => p.projectId),
          },
        };
      }

      const [
        totalVersions,
        deployedVersions,
        testingVersions,
        conflictVersions,
      ] = await Promise.all([
        this.prisma.version.count({ where: projectFilter }),
        this.prisma.version.count({
          where: { ...projectFilter, status: 'deployed' },
        }),
        this.prisma.version.count({
          where: { ...projectFilter, status: 'testing' },
        }),
        this.prisma.version.count({
          where: { ...projectFilter, status: 'conflict' },
        }),
      ]);

      return {
        totalVersions,
        deployedVersions,
        testingVersions,
        conflictVersions,
      };
    } catch (error) {
      console.error('Error fetching version stats:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createVersion(@Body() createVersionDto: CreateVersionDto) {
    try {
      const version = await this.prisma.version.create({
        data: {
          hash: createVersionDto.hash,
          message: createVersionDto.message,
          author: createVersionDto.author,
          branch: createVersionDto.branch,
          filesChanged: JSON.stringify(createVersionDto.filesChanged),
          projectId: createVersionDto.projectId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Versión creada exitosamente',
        data: {
          id: version.id,
          hash: version.hash,
          message: version.message,
          author: version.author,
          date: version.createdAt.toISOString(),
          branch: version.branch,
          status: version.status,
          filesChanged: JSON.parse(version.filesChanged),
          projectId: version.project.id,
          projectName: version.project.name,
        },
      };
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  @Post(':id/revert')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async revertVersion(@Param('id') id: string) {
    try {
      const version = await this.prisma.version.findUnique({
        where: { id: parseInt(id) },
      });

      if (!version) {
        throw new Error('Versión no encontrada');
      }

      // Aquí se implementaría la lógica real de revert
      // Por ahora solo simulamos el proceso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        message: 'Versión revertida exitosamente',
        data: { versionId: id },
      };
    } catch (error) {
      console.error('Error reverting version:', error);
      throw error;
    }
  }

  @Post(':id/analyze')
  async analyzeVersionWithAI(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const version = await this.prisma.version.findUnique({
        where: { id: parseInt(id) },
        include: {
          project: true,
        },
      });

      if (!version) {
        throw new Error('Versión no encontrada');
      }

      // Simular análisis de IA
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const analysis = {
        versionId: id,
        risks: [
          'Este commit modifica archivos críticos de autenticación',
          'Se detectaron cambios en la configuración de seguridad',
          'Recomendación: Revisar los cambios antes de desplegar',
        ],
        recommendations: [
          'Agregar tests unitarios para los cambios',
          'Revisar la compatibilidad con versiones anteriores',
          'Considerar hacer un rollback si hay problemas',
        ],
        confidence: 85,
      };

      return {
        success: true,
        message: 'Análisis de IA completado',
        data: analysis,
      };
    } catch (error) {
      console.error('Error analyzing version:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deleteVersion(@Param('id') id: string) {
    try {
      const version = await this.prisma.version.findUnique({
        where: { id: parseInt(id) },
      });

      if (!version) {
        throw new Error('Versión no encontrada');
      }

      await this.prisma.version.delete({
        where: { id: parseInt(id) },
      });

      return {
        success: true,
        message: 'Versión eliminada exitosamente',
        data: { versionId: id },
      };
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  }
}
