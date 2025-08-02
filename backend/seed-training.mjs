import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  

  // Crear recursos de capacitación


  const trainingResources = [
    {
      title: 'Introducción a React',
      description:
        'Aprende los fundamentos de React, incluyendo componentes, props, estado y hooks.',
      content: JSON.stringify({
        modules: [
          {
            title: 'Componentes Básicos',
            content: 'Los componentes son la base de React...',
            duration: 30,
          },
          {
            title: 'Props y Estado',
            content: 'Props permiten pasar datos entre componentes...',
            duration: 45,
          },
        ],
      }),
      type: 'module',
      category: 'react',
      difficulty: 'beginner',
      duration: 120,
      order: 1,
      isActive: true,
      fileUrl: 'https://example.com/react-intro.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      title: 'Patrones de Arquitectura',
      description:
        'Explora patrones como BFF, Sidecar y Microservicios para aplicaciones modernas.',
      content: JSON.stringify({
        modules: [
          {
            title: 'Backend for Frontend (BFF)',
            content:
              'El patrón BFF optimiza la comunicación entre frontend y backend...',
            duration: 60,
          },
          {
            title: 'Sidecar Pattern',
            content: 'El patrón Sidecar proporciona funcionalidad auxiliar...',
            duration: 45,
          },
        ],
      }),
      type: 'module',
      category: 'architecture',
      difficulty: 'intermediate',
      duration: 180,
      order: 2,
      isActive: true,
      fileUrl: 'https://example.com/architecture-patterns.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      title: 'Testing en JavaScript',
      description:
        'Aprende a escribir tests efectivos con Jest y React Testing Library.',
      content: JSON.stringify({
        modules: [
          {
            title: 'Tests Unitarios',
            content:
              'Los tests unitarios verifican funcionalidades específicas...',
            duration: 40,
          },
          {
            title: 'Tests de Integración',
            content:
              'Los tests de integración verifican la interacción entre componentes...',
            duration: 50,
          },
        ],
      }),
      type: 'module',
      category: 'testing',
      difficulty: 'intermediate',
      duration: 150,
      order: 3,
      isActive: true,
      fileUrl: 'https://example.com/testing-guide.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      title: 'TypeScript Avanzado',
      description:
        'Domina TypeScript con tipos avanzados, genéricos y mejores prácticas.',
      content: JSON.stringify({
        modules: [
          {
            title: 'Tipos Avanzados',
            content: 'Explora tipos como union, intersection y mapped types...',
            duration: 55,
          },
          {
            title: 'Genéricos',
            content:
              'Los genéricos permiten crear código reutilizable y type-safe...',
            duration: 45,
          },
        ],
      }),
      type: 'module',
      category: 'typescript',
      difficulty: 'advanced',
      duration: 200,
      order: 4,
      isActive: true,
      fileUrl: 'https://example.com/typescript-advanced.pdf',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ];

  for (const resource of trainingResources) {
    // Verificar si ya existe un recurso con el mismo título
    const existingResource = await prisma.trainingResource.findFirst({
      where: { title: resource.title },
    });

    if (existingResource) {
      // Actualizar el recurso existente
      await prisma.trainingResource.update({
        where: { id: existingResource.id },
        data: resource,
      });
    } else {
      // Crear nuevo recurso
      await prisma.trainingResource.create({
        data: resource,
      });
    }
  }



  // Crear progreso de usuarios en capacitación


  const users = await prisma.user.findMany();
  const resources = await prisma.trainingResource.findMany();

  for (const user of users) {
    for (const resource of resources) {
      // Simular progreso aleatorio
      const progress = Math.floor(Math.random() * 100);
      const timeSpent = Math.floor(Math.random() * 120);
      const completed = progress >= 100;

      await prisma.userTrainingProgress.upsert({
        where: {
          userId_resourceId: {
            userId: user.id,
            resourceId: resource.id,
          },
        },
        update: {
          progress,
          timeSpent,
          completed,
          completedAt: completed ? new Date() : null,
        },
        create: {
          userId: user.id,
          resourceId: resource.id,
          progress,
          timeSpent,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
    }
  }



  // Crear certificados para cursos completados


  const completedProgress = await prisma.userTrainingProgress.findMany({
    where: { completed: true },
    include: { user: true, resource: true },
  });

  for (const progress of completedProgress) {
    await prisma.trainingCertificate.upsert({
      where: {
        userId_resourceId: {
          userId: progress.userId,
          resourceId: progress.resourceId,
        },
      },
      update: {
        certificateUrl: `https://example.com/certificates/${progress.userId}-${progress.resourceId}.pdf`,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      },
      create: {
        userId: progress.userId,
        resourceId: progress.resourceId,
        certificateUrl: `https://example.com/certificates/${progress.userId}-${progress.resourceId}.pdf`,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      },
    });
  }




}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed de capacitaciones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
