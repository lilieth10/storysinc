import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  

  // Obtener proyectos existentes
  const projects = await prisma.project.findMany();

  if (projects.length === 0) {
    return;
  }

  const versionData = [
    {
      hash: 'a1b2c3d',
      message: 'Fix: Corrige error de autenticación en móviles',
      author: 'Ana López',
      branch: 'fix/auth-mobile',
      status: 'deployed',
      filesChanged: ['src/components/Login.js', 'src/utils/auth.js'],
      projectId: projects[0].id,
    },
    {
      hash: 'f8e9d2c',
      message: 'feat: Agrega nueva funcionalidad de reportes',
      author: 'Carlos Méndez',
      branch: 'feature/reports',
      status: 'testing',
      filesChanged: ['src/components/Reports.js', 'src/pages/reports.js'],
      projectId: projects[0].id,
    },
    {
      hash: 'b4c5d6e',
      message: 'refactor: Optimiza rendimiento de la base de datos',
      author: 'María García',
      branch: 'main',
      status: 'deployed',
      filesChanged: ['src/database/queries.js', 'src/config/db.js'],
      projectId: projects[1]?.id || projects[0].id,
    },
    {
      hash: 'g7h8i9j',
      message: 'fix: Resuelve conflicto en merge de ramas',
      author: 'Luis Rodríguez',
      branch: 'develop',
      status: 'conflict',
      filesChanged: ['src/components/Header.js', 'src/styles/main.css'],
      projectId: projects[0].id,
    },
    {
      hash: 'k1l2m3n',
      message: 'feat: Implementa sistema de notificaciones',
      author: 'Ana López',
      branch: 'feature/notifications',
      status: 'testing',
      filesChanged: [
        'src/components/Notifications.js',
        'src/services/notification.js',
      ],
      projectId: projects[0].id,
    },
    {
      hash: 'o4p5q6r',
      message: 'docs: Actualiza documentación de la API',
      author: 'Carlos Méndez',
      branch: 'docs/api',
      status: 'deployed',
      filesChanged: ['docs/api.md', 'README.md'],
      projectId: projects[1]?.id || projects[0].id,
    },
  ];

  for (const version of versionData) {
    try {
      const existingVersion = await prisma.version.findFirst({
        where: { hash: version.hash },
      });

      if (existingVersion) {
        await prisma.version.update({
          where: { id: existingVersion.id },
          data: {
            message: version.message,
            author: version.author,
            branch: version.branch,
            status: version.status,
            filesChanged: JSON.stringify(version.filesChanged),
            projectId: version.projectId,
          },
        });

      } else {
        await prisma.version.create({
          data: {
            hash: version.hash,
            message: version.message,
            author: version.author,
            branch: version.branch,
            status: version.status,
            filesChanged: JSON.stringify(version.filesChanged),
            projectId: version.projectId,
          },
        });

      }
    } catch (error) {
      console.error(`❌ Error con versión ${version.hash}:`, error);
    }
  }


}

main()
  .catch((e) => {
    console.error('❌ Error sembrando versiones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
