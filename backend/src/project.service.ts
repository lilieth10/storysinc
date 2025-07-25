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

  async updateProject(id: number, data: Partial<Prisma.ProjectUpdateInput>) {
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

  async analyzeProjectIA(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
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
      where: { id },
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
