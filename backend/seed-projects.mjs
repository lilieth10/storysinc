import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    for (const project of projects) {
      await prisma.project.create({
        data: project
      });
    }

    console.log('✅ Proyectos de ejemplo creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando proyectos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProjects(); 