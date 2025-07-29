import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding projects...');

  // Crear proyectos de prueba
  const projects = [
    {
      name: 'E-commerce React',
      description: 'Tienda online con React y Node.js',
      pattern: 'microservices',
      language: 'typescript',
      ownerId: 1, // Asegúrate de que el usuario 1 existe
      tags: 'react,nodejs,typescript,ecommerce',
    },
    {
      name: 'Blog API',
      description: 'API REST para blog personal',
      pattern: 'monolith',
      language: 'javascript',
      ownerId: 1,
      tags: 'nodejs,express,mongodb',
    },
    {
      name: 'Dashboard Admin',
      description: 'Panel de administración con React',
      pattern: 'microservices',
      language: 'typescript',
      ownerId: 1,
      tags: 'react,typescript,admin,dashboard',
    },
    {
      name: 'Mobile App',
      description: 'Aplicación móvil con React Native',
      pattern: 'monolith',
      language: 'javascript',
      ownerId: 1,
      tags: 'react-native,javascript,mobile',
    },
    {
      name: 'AI Chat Bot',
      description: 'Chatbot con inteligencia artificial',
      pattern: 'microservices',
      language: 'python',
      ownerId: 1,
      tags: 'python,ai,chatbot,fastapi',
    },
  ];

  for (const projectData of projects) {
    const defaultComponents = JSON.stringify([
      { name: 'Frontend', type: 'react', status: 'active' },
      { name: 'Backend', type: 'nestjs', status: 'active' },
      { name: 'Database', type: 'sqlite', status: 'active' },
    ]);

    const defaultIaInsights = JSON.stringify({
      recommendations: [],
      alerts: [],
      lastAnalysis: null,
    });

    await prisma.project.create({
      data: {
        ...projectData,
        components: defaultComponents,
        iaInsights: defaultIaInsights,
        status: 'active',
        visibility: 'public',
        addReadme: true,
        addGitignore: true,
        chooseLicense: true,
        license: 'MIT',
      },
    });
  }

  console.log('✅ Projects seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding projects:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
