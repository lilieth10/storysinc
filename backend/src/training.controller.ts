/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PrismaService } from './prisma.service';

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

@Controller('training')
@UseGuards(AuthGuard('jwt'))
export class TrainingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getAllTrainingResources(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;

    // Mock data con URLs reales para descargas y videos
    const trainingResources = [
      {
        id: 1,
        title: 'Introducción a React',
        description:
          'Aprende los fundamentos de React, incluyendo componentes, props, estado y hooks. Este curso te preparará para desarrollar aplicaciones web modernas y dinámicas.',
        type: 'overview',
        category: 'react',
        hasButton: true,
        buttonText: 'Ver más',
        fileUrl: 'https://example.com/react-intro.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        id: 2,
        title: 'Componentes y Props',
        description:
          'Profundiza en el sistema de componentes de React. Aprende a crear componentes reutilizables, pasar props y manejar el flujo de datos.',
        type: 'module',
        category: 'react',
        position: 'right' as const,
        fileUrl: 'https://example.com/react-components.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        codeSnippet: {
          language: 'jsx',
          code: `function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}`,
          lines: [1, 12],
        },
      },
      {
        id: 3,
        title: 'Estado y Ciclo de Vida',
        description:
          'Aprende a manejar el estado de los componentes y el ciclo de vida. Entiende cuándo y cómo actualizar el estado de manera eficiente.',
        type: 'module',
        category: 'react',
        position: 'left' as const,
        fileUrl: 'https://example.com/react-state.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        hasImage: true,
        imageDescription: 'Diagrama del ciclo de vida de React',
      },
      {
        id: 4,
        title: 'Hooks en React',
        description:
          'Explora los hooks de React: useState, useEffect, useContext y más. Aprende a usar hooks para simplificar tu código y hacerlo más legible.',
        type: 'module',
        category: 'react',
        position: 'bottom' as const,
        fileUrl: 'https://example.com/react-hooks.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        codeSnippet: {
          language: 'jsx',
          code: `import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
          lines: [1, 20],
        },
      },
      {
        id: 5,
        title: 'CSS y Styling',
        description:
          'Aprende diferentes técnicas de styling en React: CSS modules, styled-components, Tailwind CSS y más. Domina el arte de crear interfaces hermosas.',
        type: 'module',
        category: 'css',
        position: 'right' as const,
        fileUrl: 'https://example.com/css-styling.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        id: 6,
        title: 'Testing en React',
        description:
          'Aprende a escribir tests para tus componentes React usando Jest y React Testing Library. Asegura la calidad de tu código con testing efectivo.',
        type: 'module',
        category: 'testing',
        position: 'left' as const,
        fileUrl: 'https://example.com/react-testing.pdf',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        codeSnippet: {
          language: 'jsx',
          code: `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});`,
          lines: [1, 8],
        },
      },
    ];

    // Obtener progreso del usuario desde la base de datos
    const getUserProgress = async () => {
      try {
        const userProgress = await this.prisma.userTrainingProgress.findMany({
          where: { userId },
          include: { resource: true },
        });
        return userProgress;
      } catch (error) {
        console.error('Error fetching user progress:', error);
        return [];
      }
    };

    // Combinar recursos con progreso del usuario
    const combineWithProgress = async () => {
      const progress = await getUserProgress();

      return trainingResources.map((resource) => {
        const userProgress = progress.find((p) => p.resourceId === resource.id);
        return {
          ...resource,
          userProgress: userProgress
            ? {
                progress: userProgress.progress,
                timeSpent: userProgress.timeSpent,
                completed: userProgress.completed,
                startedAt: userProgress.startedAt.toISOString(),
                completedAt: userProgress.completedAt?.toISOString(),
              }
            : null,
        };
      });
    };

    return combineWithProgress();
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
}
