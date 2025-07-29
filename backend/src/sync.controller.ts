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
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

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

@Controller('sync')
export class SyncController {
  constructor(private prisma: PrismaService) {}

  // Crear proyecto de sincronización
  @Post('create')
  async createProject(
    @Body() body: CreateSyncProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.userId ?? req.user.id ?? 0;

      const project = await this.prisma.project.create({
        data: {
          name: body.name,
          description: body.description,
          pattern: body.pattern,
          language: body.language,
          ownerId: userId,
          components: JSON.stringify([]),
          iaInsights: JSON.stringify([]),
          tags: '',
        },
      });

      return {
        success: true,
        project,
        message: 'Proyecto creado exitosamente',
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
      const userId = req.user.userId ?? req.user.id ?? 0;

      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId: userId },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
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
      const userId = req.user.userId ?? req.user.id ?? 0;

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
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
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
      const existingProject = await this.prisma.project.findFirst({
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
      const existingProject = await this.prisma.project.findFirst({
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
      const userId = req.user.userId ?? req.user.id ?? 0;

      // Verificar que el proyecto pertenece al usuario
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

      // Simular sincronización
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Actualizar último sync
      await this.prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          lastSync: new Date(),
        },
      });

      return {
        success: true,
        message: 'Sincronización completada exitosamente',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during sync:', error);
      throw new HttpException(
        'Error durante la sincronización',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener historial de sincronización (simulado)
  @Get('projects/:id/history')
  async getSyncHistory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.userId ?? req.user.id ?? 0;

      // Simular historial
      const history = await Promise.resolve([
        {
          id: 1,
          projectId: parseInt(id),
          userId: userId,
          date: new Date(),
          status: 'success',
          message: 'Sincronización automática completada',
        },
        {
          id: 2,
          projectId: parseInt(id),
          userId: userId,
          date: new Date(Date.now() - 86400000), // 1 día atrás
          status: 'success',
          message: 'Sincronización manual realizada',
        },
      ]);

      return history;
    } catch (error) {
      console.error('Error fetching sync history:', error);
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
      const userId = req.user.userId ?? req.user.id ?? 0;

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
    } catch (error) {
      console.error('Error deleting history entry:', error);
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
      const userId = req.user.userId ?? req.user.id ?? 0;

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
        suggestions,
        performanceData,
        patterns,
        project: {
          name: project.name,
          pattern: project.pattern,
          language: project.language,
        },
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
    const patterns: { name: string; value: number; color: string }[] = [];

    if (project.pattern === 'bff') {
      patterns.push(
        { name: 'API Gateway', value: 85, color: '#10B981' },
        { name: 'Load Balancing', value: 72, color: '#3B82F6' },
        { name: 'Caching', value: 68, color: '#F59E0B' },
        { name: 'Rate Limiting', value: 45, color: '#EF4444' },
      );
    } else if (project.pattern === 'sidecar') {
      patterns.push(
        { name: 'Logging', value: 90, color: '#10B981' },
        { name: 'Monitoring', value: 78, color: '#3B82F6' },
        { name: 'Health Checks', value: 82, color: '#F59E0B' },
        { name: 'Security', value: 65, color: '#EF4444' },
      );
    } else {
      patterns.push(
        { name: 'Monolith', value: 75, color: '#10B981' },
        { name: 'Database', value: 68, color: '#3B82F6' },
        { name: 'API', value: 72, color: '#F59E0B' },
        { name: 'Frontend', value: 60, color: '#EF4444' },
      );
    }

    return patterns;
  }
}
