/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from '@nestjs/passport';

interface CreateSyncProjectDto {
  serviceName: string;
  description: string;
  type: 'bff' | 'sidecar';
  pattern?: string;
  tags?: string;
  frontendAssociation?: string;
  contact?: string;
  functions?: string[];
}

interface UpdateStatusDto {
  status: 'active' | 'inactive';
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
  };
}

@Controller('api/sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private prisma: PrismaService) {}

  // Método de prueba para verificar que el modelo funciona
  @Get('test')
  async testSyncProject() {
    try {
      const count = await (this.prisma as any).syncProject.count();
      return { message: 'SyncProject model works', count };
    } catch (error) {
      console.error('Error testing sync project:', error);
      throw new HttpException(
        'Error testing sync project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener todos los proyectos de sincronización
  @Get('projects')
  async getSyncProjects(@Request() req: AuthenticatedRequest) {
    try {
      const projects = await (this.prisma as any).syncProject.findMany({
        where: {
          userId: req.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects;
    } catch (error) {
      console.error('Error fetching sync projects:', error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Crear un nuevo proyecto de sincronización
  @Post('create')
  async createSyncProject(
    @Body() body: CreateSyncProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const {
        serviceName,
        description,
        type,
        pattern,
        tags,
        frontendAssociation,
        contact,
        functions,
      } = body;

      if (!serviceName || !description || !type) {
        throw new HttpException(
          'Nombre del servicio, descripción y tipo son requeridos',
          HttpStatus.BAD_REQUEST,
        );
      }

      const project = await (this.prisma as any).syncProject.create({
        data: {
          name: serviceName,
          description,
          type: type,
          pattern: pattern || null,
          tags: tags || null,
          frontendAssociation: frontendAssociation || null,
          contact: contact || null,
          functions: functions ? JSON.stringify(functions) : null,
          status: 'active',
          userId: req.user.id,
          lastSync: new Date(),
        },
      });

      return project;
    } catch (error) {
      console.error('Error creating sync project:', error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Eliminar un proyecto de sincronización
  @Delete('projects/:id')
  async deleteSyncProject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const project = await (this.prisma as any).syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: req.user.id,
        },
      });

      if (!project) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      await (this.prisma as any).syncProject.delete({
        where: { id: parseInt(id) },
      });

      return { message: 'Proyecto eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting sync project:', error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar estado de sincronización
  @Patch('projects/:id/status')
  async updateSyncStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const { status } = body;

      const project = await (this.prisma as any).syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: req.user.id,
        },
      });

      if (!project) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      const updatedProject = await (this.prisma as any).syncProject.update({
        where: { id: parseInt(id) },
        data: {
          status: status,
          lastSync: new Date(),
        },
      });

      return updatedProject;
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
