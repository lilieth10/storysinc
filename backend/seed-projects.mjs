import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar el primer usuario (el que se registró)
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No se encontraron usuarios. Primero regístrate en la aplicación.');
      return;
    }

    console.log(`📝 Creando proyectos para el usuario: ${user.email}`);

    // Proyectos de ejemplo según el Figma
    const projects = [
      {
        name: 'E-Commerce Platform',
        description: 'Plataforma completa de comercio electrónico con React, Node.js y MongoDB',
        pattern: 'microservices',
        tags: 'react, nodejs, mongodb, stripe, docker',
        ownerId: user.id,
        components: JSON.stringify([
          { name: 'Frontend', type: 'react', status: 'active' },
          { name: 'API Gateway', type: 'nestjs', status: 'active' },
          { name: 'User Service', type: 'microservice', status: 'active' },
          { name: 'Product Service', type: 'microservice', status: 'active' },
          { name: 'Payment Service', type: 'microservice', status: 'active' },
          { name: 'Database', type: 'mongodb', status: 'active' }
        ]),
        collaborators: JSON.stringify([]),
        iaInsights: JSON.stringify({
          recommendations: [
            'Implementar caché Redis para mejorar rendimiento',
            'Agregar tests unitarios en servicios críticos',
            'Optimizar consultas de base de datos'
          ],
          alerts: ['Alto acoplamiento detectado en UserService'],
          lastAnalysis: new Date().toISOString()
        }),
        status: 'active'
      },
      {
        name: 'Task Management App',
        description: 'Aplicación de gestión de tareas con funcionalidades avanzadas de colaboración',
        pattern: 'monolith',
        tags: 'vue, express, sqlite, websockets',
        ownerId: user.id,
        components: JSON.stringify([
          { name: 'Frontend', type: 'vue', status: 'active' },
          { name: 'Backend', type: 'express', status: 'active' },
          { name: 'WebSocket Server', type: 'socketio', status: 'active' },
          { name: 'Database', type: 'sqlite', status: 'active' }
        ]),
        collaborators: JSON.stringify([]),
        iaInsights: JSON.stringify({
          recommendations: [
            'Migrar a TypeScript para mejor mantenibilidad',
            'Implementar paginación en listado de tareas',
            'Agregar índices en queries frecuentes'
          ],
          alerts: [],
          lastAnalysis: new Date().toISOString()
        }),
        status: 'active'
      },
      {
        name: 'IoT Dashboard',
        description: 'Dashboard en tiempo real para monitoreo de dispositivos IoT',
        pattern: 'event-driven',
        tags: 'nextjs, mqtt, influxdb, grafana',
        ownerId: user.id,
        components: JSON.stringify([
          { name: 'Dashboard', type: 'nextjs', status: 'active' },
          { name: 'MQTT Broker', type: 'mqtt', status: 'active' },
          { name: 'Data Processor', type: 'nodejs', status: 'active' },
          { name: 'Time Series DB', type: 'influxdb', status: 'active' },
          { name: 'Analytics', type: 'grafana', status: 'active' }
        ]),
        collaborators: JSON.stringify([]),
        iaInsights: JSON.stringify({
          recommendations: [
            'Implementar alertas automáticas por umbrales',
            'Optimizar retention policy de InfluxDB',
            'Agregar compresión a mensajes MQTT'
          ],
          alerts: ['Latencia alta detectada en data processing'],
          lastAnalysis: new Date().toISOString()
        }),
        status: 'active'
      },
      {
        name: 'Social Media API',
        description: 'API REST para red social con funcionalidades de posts, likes y comentarios',
        pattern: 'microservices',
        tags: 'golang, postgresql, redis, jwt',
        ownerId: user.id,
        components: JSON.stringify([
          { name: 'Auth Service', type: 'golang', status: 'active' },
          { name: 'Post Service', type: 'golang', status: 'active' },
          { name: 'User Service', type: 'golang', status: 'active' },
          { name: 'Notification Service', type: 'golang', status: 'active' },
          { name: 'Database', type: 'postgresql', status: 'active' },
          { name: 'Cache', type: 'redis', status: 'active' }
        ]),
        collaborators: JSON.stringify([]),
        iaInsights: JSON.stringify({
          recommendations: [
            'Implementar rate limiting por usuario',
            'Agregar full-text search en posts',
            'Optimizar queries N+1 en comentarios'
          ],
          alerts: ['Potencial vulnerabilidad SQL injection'],
          lastAnalysis: new Date().toISOString()
        }),
        status: 'active'
      },
      {
        name: 'ML Model Deployment',
        description: 'Plataforma serverless para deploy y monitoreo de modelos de Machine Learning',
        pattern: 'serverless',
        tags: 'python, aws, tensorflow, docker, lambda',
        ownerId: user.id,
        components: JSON.stringify([
          { name: 'Model API', type: 'lambda', status: 'active' },
          { name: 'Training Pipeline', type: 'python', status: 'active' },
          { name: 'Data Storage', type: 's3', status: 'active' },
          { name: 'Model Registry', type: 'mlflow', status: 'active' },
          { name: 'Monitoring', type: 'cloudwatch', status: 'active' }
        ]),
        collaborators: JSON.stringify([]),
        iaInsights: JSON.stringify({
          recommendations: [
            'Implementar A/B testing para modelos',
            'Agregar monitoring de data drift',
            'Optimizar cold start en Lambda'
          ],
          alerts: ['Accuracy del modelo por debajo del threshold'],
          lastAnalysis: new Date().toISOString()
        }),
        status: 'active'
      }
    ];

    // Crear proyectos
    for (const project of projects) {
      await prisma.project.create({
        data: project
      });
      console.log(`✅ Proyecto creado: ${project.name}`);
    }

    console.log('✅ Proyectos de ejemplo creados exitosamente');
  } catch (error) {
    console.error('❌ Error al crear proyectos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 