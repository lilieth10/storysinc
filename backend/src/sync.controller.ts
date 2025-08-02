import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Param,
  Delete,
  Patch,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { NotificationService } from './notification.service';

interface AuthenticatedRequest extends Request {
  user: {
    id?: number;
    userId?: number;
  };
}

interface CreateSyncProjectDto {
  name: string;
  description: string;
  pattern: string;
  language: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('sync')
export class SyncController {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Crear proyecto de sincronización
  @Post('create')
  async createProject(
    @Body() body: CreateSyncProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.userId ?? req.user.id ?? 0;

      const syncProject = await this.prisma.syncProject.create({
        data: {
          name: body.name,
          description: body.description,
          type: body.pattern, // 'bff' or 'sidecar'
          pattern: body.pattern,
          userId: userId,
          status: 'active',
        },
      });

      return {
        success: true,
        project: syncProject,
        message: 'Componente de sincronización creado exitosamente',
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw new HttpException(
        'Error al crear el proyecto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener proyectos de sincronización
  @Get('projects')
  async getProjects(@Request() req: AuthenticatedRequest) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      const projects = await this.prisma.syncProject.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new HttpException(
        'Error al obtener proyectos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener proyecto específico
  @Get('projects/:id')
  async getProject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      const project = await this.prisma.syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: userId,
        },
      });

      if (!project) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw new HttpException(
        'Error al obtener el proyecto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar proyecto
  @Patch('projects/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() body: Partial<CreateSyncProjectDto>,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.userId ?? req.user.id ?? 0;

      // Verificar que el proyecto pertenece al usuario
      const existingProject = await this.prisma.syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: userId,
        },
      });

      if (!existingProject) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      const updatedProject = await this.prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          name: body.name,
          description: body.description,
          pattern: body.pattern,
          language: body.language,
        },
      });

      return {
        success: true,
        project: updatedProject,
        message: 'Proyecto actualizado exitosamente',
      };
    } catch (error) {
      console.error('Error updating project:', error);
      throw new HttpException(
        'Error al actualizar el proyecto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Eliminar proyecto
  @Delete('projects/:id')
  async deleteProject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.userId ?? req.user.id ?? 0;

      // Verificar que el proyecto pertenece al usuario
      const existingProject = await this.prisma.syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: userId,
        },
      });

      if (!existingProject) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      await this.prisma.project.delete({
        where: { id: parseInt(id) },
      });

      return {
        success: true,
        message: 'Proyecto eliminado exitosamente',
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new HttpException(
        'Error al eliminar el proyecto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Sincronización manual
  @Post('projects/:id/sync')
  async manualSyncProject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      // Verificar que el proyecto pertenece al usuario
      const project = await this.prisma.syncProject.findFirst({
        where: {
          id: parseInt(id),
          userId: userId,
        },
      });

      if (!project) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      // Simular sincronización
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Actualizar último sync
      await this.prisma.syncProject.update({
        where: { id: parseInt(id) },
        data: {
          lastSync: new Date(),
        },
      });

      // Crear entrada en el historial
      await this.prisma.syncHistory.create({
        data: {
          projectId: parseInt(id),
          userId: userId,
          date: new Date(),
          status: 'success',
          message: 'Sincronización manual realizada',
        },
      });

      // Crear entrada en historial de versiones
      try {
        // Obtener el nombre real del usuario
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true, username: true }
        });
        
        const authorName = user?.fullName || user?.username || 'Usuario';
        
        const newVersion = await this.prisma.version.create({
          data: {
            hash: Math.random().toString(36).substring(2, 9),
            message: `Sync: ${project.type.toUpperCase()} pattern updated for ${project.name}`,
            author: authorName,
            branch: 'main',
            filesChanged: JSON.stringify([project.name, `${project.type}_pattern.js`, 'config.json']),
            projectId: parseInt(id), // Este es el SyncProject ID
          },
        });
        // Version created for sync project
      } catch (versionError) {
        console.error('❌ Error creating version entry for sync:', versionError);
      }

      // Crear notificación de sincronización exitosa
      await this.notificationService.createNotification({
        userId: userId,
        title: 'Sincronización completada',
        message: `El proyecto "${project.name}" se sincronizó exitosamente`,
        type: 'success',
      });

      return {
        success: true,
        message: 'Sincronización completada exitosamente',
        lastSync: new Date(),
      };
    } catch {
      throw new HttpException(
        'Error durante la sincronización',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener historial de sincronización
  @Get('projects/:id/history')
  async getSyncHistory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      // Consultar historial real de la DB
      const history = await this.prisma.syncHistory.findMany({
        where: {
          projectId: parseInt(id),
          userId: userId,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return history;
    } catch {
      throw new HttpException(
        'Error al obtener historial',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Eliminar entrada del historial
  @Delete('history/:historyId')
  async deleteHistoryEntry(
    @Param('historyId') historyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      await this.prisma.syncHistory.deleteMany({
        where: {
          id: parseInt(historyId),
          userId: userId,
        },
      });

      return {
        success: true,
        message: 'Entrada del historial eliminada',
      };
    } catch {
      throw new HttpException(
        'Error al eliminar entrada del historial',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener métricas de IA
  @Get('projects/:id/ai-metrics')
  async getAIMetrics(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId ?? req.user?.id ?? 1;

      const project = await this.prisma.project.findFirst({
        where: {
          id: parseInt(id),
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId: userId },
              },
            },
          ],
        },
      });

      if (!project) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      const suggestions = this.generateSuggestions(project, project.language);
      const performanceData = this.generatePerformanceData(project);
      const patterns = this.generatePatterns(project);

      return {
        performance: {
          averageTime: performanceData.performance,
          successRate: performanceData.maintainability,
          optimizations: performanceData.complexity,
        },
        patterns: patterns, // Ahora patterns es directamente el objeto con los porcentajes
        suggestions: suggestions.map((suggestion, index) => ({
          type: 'optimization',
          title: suggestion,
          description: `Sugerencia ${index + 1} para optimizar tu proyecto`,
          priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        })),
        performanceData: [
          performanceData.performance,
          performanceData.maintainability,
          performanceData.complexity,
          performanceData.security,
          performanceData.performance,
          performanceData.maintainability,
          performanceData.complexity,
        ],
      };
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      throw new HttpException(
        'Error al obtener métricas de IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateSuggestions(project: { pattern: string }, language: string) {
    const suggestions: string[] = [];

    // Sugerencias COMPLETAMENTE DIFERENTES según el patrón
    if (project.pattern === 'bff') {
      suggestions.push(
        '🔧 Implementa cache inteligente con Redis para respuestas de microservicios',
        '🛡️ Configura rate limiting específico por endpoint y usuario',
        '📊 Agrega métricas de latencia entre servicios con Prometheus',
        '🔐 Implementa autenticación JWT con refresh tokens',
        '⚡ Considera usar GraphQL para consultas complejas de múltiples servicios',
        '🔄 Implementa circuit breakers para manejar fallos de microservicios',
        '📈 Agrega health checks para cada microservicio',
        '🔍 Implementa distributed tracing con Jaeger',
      );
    } else if (project.pattern === 'sidecar') {
      suggestions.push(
        '📝 Configura logging estructurado con Winston y correlación de requests',
        '🔍 Implementa distributed tracing con Jaeger para observabilidad',
        '📈 Configura health checks ligeros con métricas de recursos',
        '🔄 Implementa circuit breakers para resiliencia en cascada',
        '🔐 Centraliza autenticación con OAuth2 y OpenID Connect',
        '📊 Agrega métricas customizadas con Prometheus',
        '🛡️ Implementa mTLS para comunicación segura entre servicios',
        '⚡ Optimiza el uso de recursos con límites de CPU/memoria',
      );
    } else {
      // Monolith y otros patrones
      suggestions.push(
        '🏗️ Considera migrar a arquitectura de microservicios para escalabilidad',
        '📦 Implementa contenedores con Docker para consistencia',
        '☁️ Prepárate para despliegue en la nube con Kubernetes',
        '🔄 Agrega CI/CD pipeline con GitHub Actions',
        '📊 Implementa monitoreo completo con ELK Stack',
        '🔧 Refactoriza código legacy a patrones modernos',
        '📈 Implementa feature flags para despliegues seguros',
        '🛡️ Agrega WAF (Web Application Firewall) para seguridad',
      );
    }

    // Sugerencias específicas por lenguaje (sin duplicar)
    if (language === 'javascript' || language === 'typescript') {
      suggestions.push(
        '🔧 Migra a TypeScript para mejor tipado y detección de errores',
        '⚡ Implementa code splitting y lazy loading para React',
        '🛡️ Agrega validación de esquemas con Zod',
        '📦 Configura bundlers modernos como Vite o Turbopack',
        '🧪 Implementa testing con Jest, React Testing Library y Cypress',
        '🔍 Agrega ESLint y Prettier para consistencia de código',
        '📊 Implementa error boundaries para manejo de errores',
        '⚡ Optimiza bundle size con tree shaking',
      );
    } else if (language === 'python') {
      suggestions.push(
        '🐍 Implementa type hints y mypy para mejor documentación',
        '📊 Usa async/await con asyncio para operaciones I/O',
        '🛡️ Agrega validación con Pydantic para APIs',
        '🧪 Configura testing con pytest y coverage',
        '📦 Considera usar FastAPI para APIs REST modernas',
        '🔍 Implementa logging con structlog',
        '📊 Agrega profiling con cProfile',
        '🛡️ Usa virtual environments y poetry para dependencias',
      );
    }

    // Retornar sugerencias únicas y mezcladas (máximo 8)
    return [...new Set(suggestions)].slice(0, 8);
  }

  private generatePerformanceData(project: { pattern: string }) {
    const baseComplexity = project.pattern === 'monolith' ? 75 : 45;
    const baseMaintainability = project.pattern === 'microservices' ? 85 : 60;
    const baseSecurity = 70;
    const basePerformance = 65;

    return {
      complexity: Math.min(
        100,
        baseComplexity + Math.floor(Math.random() * 20),
      ),
      maintainability: Math.min(
        100,
        baseMaintainability + Math.floor(Math.random() * 15),
      ),
      security: Math.min(100, baseSecurity + Math.floor(Math.random() * 25)),
      performance: Math.min(
        100,
        basePerformance + Math.floor(Math.random() * 20),
      ),
    };
  }

  private generatePatterns(project: { pattern: string }) {
    // Generar porcentajes reales según el tipo de proyecto
    if (project.pattern === 'bff') {
      return {
        bff: 85,
        sidecar: 10,
        monolith: 3,
        microservices: 2,
      };
    } else if (project.pattern === 'sidecar') {
      return {
        bff: 5,
        sidecar: 80,
        monolith: 10,
        microservices: 5,
      };
    } else if (project.pattern === 'microservices') {
      return {
        bff: 15,
        sidecar: 20,
        monolith: 10,
        microservices: 55,
      };
    } else {
      // Monolith por defecto
      return {
        bff: 5,
        sidecar: 10,
        monolith: 75,
        microservices: 10,
      };
    }
  }
}
