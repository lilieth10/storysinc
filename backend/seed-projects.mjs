import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

<<<<<<< HEAD
async function seedProjects() {
  try {
    // Buscar un usuario existente
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No se encontró ningún usuario. Crea un usuario primero.');
      return;
    }

    // Proyectos de ejemplo según el Figma
    const projects = [
      {
        name: 'Componente de Autenticación',
        description: 'Sistema de autenticación con JWT y OAuth2',
        pattern: 'microservices',
        status: 'active',
        ownerId: user.id,
        tags: 'react,typescript,jwt,oauth',
        collaborators: JSON.stringify([]),
        components: JSON.stringify([
          { name: 'AuthService', type: 'nestjs', status: 'active', version: 1.2 },
          { name: 'LoginComponent', type: 'react', status: 'active', version: 2.1 },
          { name: 'UserDatabase', type: 'sqlite', status: 'active', version: 1.0 }
        ]),
        iaInsights: JSON.stringify({
          recommendations: [
            { type: 'security', component: 'AuthService', message: 'Implementar rate limiting', priority: 'high' },
            { type: 'performance', component: 'LoginComponent', message: 'Optimizar re-renders', priority: 'medium' }
          ],
          alerts: [
            { type: 'security', message: 'JWT expiración muy larga', priority: 'medium' }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: { score: 85, bottlenecks: ['Token validation'] }
        })
      },
      {
        name: 'Generador de Reportes',
        description: 'Sistema de generación automática de reportes con IA',
        pattern: 'event-driven',
        status: 'active',
        ownerId: user.id,
        tags: 'python,ai,pandas,reporting',
        collaborators: JSON.stringify([]),
        components: JSON.stringify([
          { name: 'ReportGenerator', type: 'python', status: 'active', version: 1.5 },
          { name: 'AIAnalyzer', type: 'python', status: 'active', version: 2.0 },
          { name: 'DataProcessor', type: 'python', status: 'active', version: 1.8 }
        ]),
        iaInsights: JSON.stringify({
          recommendations: [
            { type: 'optimization', component: 'ReportGenerator', message: 'Usar multiprocessing', priority: 'high' },
            { type: 'security', component: 'AIAnalyzer', message: 'Validar inputs', priority: 'medium' }
          ],
          alerts: [
            { type: 'performance', message: 'Procesamiento lento en archivos grandes', priority: 'high' }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: { score: 78, bottlenecks: ['Data processing', 'AI inference'] }
        })
      },
      {
        name: 'E-commerce Checkout',
        description: 'Sistema de checkout optimizado con BFF',
        pattern: 'microservices',
        status: 'active',
        ownerId: user.id,
        tags: 'react,nodejs,redis,payment',
        collaborators: JSON.stringify([]),
        components: JSON.stringify([
          { name: 'CheckoutBFF', type: 'nodejs', status: 'active', version: 1.3 },
          { name: 'PaymentService', type: 'nodejs', status: 'active', version: 2.1 },
          { name: 'CartComponent', type: 'react', status: 'active', version: 1.7 }
        ]),
        iaInsights: JSON.stringify({
          recommendations: [
            { type: 'performance', component: 'CheckoutBFF', message: 'Implementar cache Redis', priority: 'high' },
            { type: 'security', component: 'PaymentService', message: 'Encriptar datos sensibles', priority: 'critical' }
          ],
          alerts: [
            { type: 'security', message: 'Falta validación de tarjetas', priority: 'critical' }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: { score: 92, bottlenecks: ['Payment processing'] }
        })
      },
      {
        name: 'Dashboard Analytics',
        description: 'Dashboard en tiempo real con métricas de negocio',
        pattern: 'monolith',
        status: 'active',
        ownerId: user.id,
        tags: 'vue,php,mysql,analytics',
        collaborators: JSON.stringify([]),
        components: JSON.stringify([
          { name: 'AnalyticsAPI', type: 'php', status: 'active', version: 1.4 },
          { name: 'DashboardUI', type: 'vue', status: 'active', version: 2.2 },
          { name: 'MetricsDB', type: 'mysql', status: 'active', version: 1.1 }
        ]),
        iaInsights: JSON.stringify({
          recommendations: [
            { type: 'architecture', component: 'AnalyticsAPI', message: 'Migrar a microservicios', priority: 'medium' },
            { type: 'performance', component: 'DashboardUI', message: 'Implementar lazy loading', priority: 'low' }
          ],
          alerts: [
            { type: 'performance', message: 'Queries lentas en MySQL', priority: 'medium' }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: { score: 88, bottlenecks: ['Database queries'] }
        })
      },
      {
        name: 'API Gateway',
        description: 'Gateway para gestión centralizada de APIs',
        pattern: 'microservices',
        status: 'active',
        ownerId: user.id,
        tags: 'go,nginx,api,gateway',
        collaborators: JSON.stringify([]),
        components: JSON.stringify([
          { name: 'GatewayCore', type: 'go', status: 'active', version: 1.6 },
          { name: 'LoadBalancer', type: 'nginx', status: 'active', version: 1.3 },
          { name: 'RateLimiter', type: 'go', status: 'active', version: 1.2 }
        ]),
        iaInsights: JSON.stringify({
          recommendations: [
            { type: 'security', component: 'GatewayCore', message: 'Implementar WAF', priority: 'high' },
            { type: 'monitoring', component: 'LoadBalancer', message: 'Agregar health checks', priority: 'medium' }
          ],
          alerts: [
            { type: 'security', message: 'Falta autenticación en endpoints', priority: 'high' }
          ],
          lastAnalysis: new Date().toISOString(),
          performance: { score: 95, bottlenecks: ['Rate limiting'] }
        })
      }
    ];

    // Crear los proyectos
=======
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
>>>>>>> c346063ded0218dc9d078f783d8eb2fe3f391f63
    for (const project of projects) {
      await prisma.project.create({
        data: project
      });
<<<<<<< HEAD
=======
      console.log(`✅ Proyecto creado: ${project.name}`);
>>>>>>> c346063ded0218dc9d078f783d8eb2fe3f391f63
    }

    console.log('✅ Proyectos de ejemplo creados exitosamente');
  } catch (error) {
<<<<<<< HEAD
    console.error('❌ Error creando proyectos:', error);
=======
    console.error('❌ Error al crear proyectos:', error);
>>>>>>> c346063ded0218dc9d078f783d8eb2fe3f391f63
  } finally {
    await prisma.$disconnect();
  }
}

<<<<<<< HEAD
seedProjects(); 
=======
main(); 
>>>>>>> c346063ded0218dc9d078f783d8eb2fe3f391f63
