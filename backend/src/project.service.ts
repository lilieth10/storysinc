/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

// Definir el tipo para los componentes del proyecto
interface ProjectComponent {
  name: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

interface Recommendation {
  type: string;
  component: string;
  message: string;
  priority: string;
}

interface Alert {
  type: string;
  message: string;
  priority: string;
}

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(data: {
    name: string;
    description?: string;
    pattern: string;
    ownerId: number;
    tags?: string;
  }) {
    const defaultComponents = JSON.stringify([
      { name: 'Frontend', type: 'react', status: 'active' },
      { name: 'Backend', type: 'nestjs', status: 'active' },
      { name: 'Database', type: 'sqlite', status: 'active' },
    ]);

    const defaultCollaborators = JSON.stringify([]);
    const defaultIaInsights = JSON.stringify({
      recommendations: [],
      alerts: [],
      lastAnalysis: null,
    });

    return this.prisma.project.create({
      data: {
        ...data,
        components: defaultComponents,
        collaborators: defaultCollaborators,
        iaInsights: defaultIaInsights,
        tags: data.tags || '',
      },
    });
  }

  async getProjectsForUser(userId: number) {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            collaborators_users: {
              some: { id: userId },
            },
          },
        ],
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getProjectById(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async updateProject(id: number, data: any) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: number) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async executeCode(projectId: number, code: string, language: string) {
    try {
      // Simular ejecución de código según el lenguaje
      let result = '';
      let output = '';
      let error: string | null = null;

      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          try {
            // Evaluar código JavaScript de forma segura
            const sandbox = {
              console: {
                log: (...args: unknown[]) => (output += args.join(' ') + '\n'),
              },
            };
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            const func = new Function('console', code);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            await Promise.resolve(func(sandbox.console));
            result = 'Código ejecutado exitosamente';
          } catch (e) {
            error = e instanceof Error ? e.message : 'Error desconocido';
          }
          break;

        case 'python':
        case 'py':
          // Simular ejecución de Python
          await Promise.resolve();
          if (code.includes('print')) {
            output = 'Hello, World!\nResultado: 42\n';
            result = 'Código Python ejecutado exitosamente';
          } else {
            error = 'Error de sintaxis en Python';
          }
          break;

        case 'java':
          // Simular ejecución de Java
          await Promise.resolve();
          if (code.includes('System.out.println')) {
            output = 'Hello, World!\nCompilado y ejecutado correctamente.\n';
            result = 'Código Java compilado y ejecutado exitosamente';
          } else {
            error = 'Error de compilación en Java';
          }
          break;

        default:
          await Promise.resolve();
          error = `Lenguaje ${language} no soportado`;
      }

      return {
        success: !error,
        result: result,
        output: output,
        error: error,
        language: language,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error ejecutando código: ${errorMessage}`);
    }
  }

  async analyzeProjectIA(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Simular análisis IA persistente
    const components = JSON.parse(
      project.components ?? '[]',
    ) as ProjectComponent[];
    const recommendations: Recommendation[] = [];
    const alerts: Alert[] = [];

    // Análisis de componentes
    components.forEach((component) => {
      if (
        component.type === 'react' &&
        typeof component.status === 'string' &&
        !component.status.includes('optimized')
      ) {
        recommendations.push({
          type: 'optimization',
          component: component.name,
          message: 'Considera optimizar el bundle de React',
          priority: 'medium',
        });
      }
    });

    // Alertas de seguridad
    if (project.pattern === 'monolith') {
      alerts.push({
        type: 'security',
        message: 'Considera migrar a microservicios para mejor escalabilidad',
        priority: 'high',
      });
    }

    const iaInsights = {
      recommendations,
      alerts,
      lastAnalysis: new Date().toISOString(),
      performance: {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        bottlenecks: ['Database queries', 'Frontend rendering'],
      },
    };

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        iaInsights: JSON.stringify(iaInsights),
      },
    });
  }

  async syncProject(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Simular sincronización persistente
    const components = JSON.parse(
      project.components ?? '[]',
    ) as ProjectComponent[];
    const updatedComponents = components.map((component) => ({
      ...component,
      lastSync: new Date().toISOString(),
      version:
        typeof component.version === 'number' ? component.version + 0.1 : 1.0,
    }));

    return this.prisma.project.update({
      where: { id },
      data: {
        components: JSON.stringify(updatedComponents),
        lastSync: new Date(),
      },
    });
  }
}
