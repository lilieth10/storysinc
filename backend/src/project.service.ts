/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
            collaborators: {
              some: { userId: userId },
            },
          },
        ],
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        collaborators: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getProjectById(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        collaborators: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
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

  // Nuevos métodos para el editor de código
  async getProjectFiles(projectId: number, userId: number) {
    // Verificar que el usuario tenga acceso al proyecto
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
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
      throw new Error('Proyecto no encontrado o sin acceso');
    }

    // Estructura de archivos ejemplo (en un caso real, esto vendría de un sistema de archivos o base de datos)
    const fileTree = [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
          {
            id: '2',
            name: 'components',
            type: 'folder',
            path: '/src/components',
            children: [
              {
                id: '3',
                name: 'Button.tsx',
                type: 'file',
                path: '/src/components/Button.tsx',
                content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant} \${disabled ? 'opacity-50' : ''}\`}
    >
      {children}
    </button>
  );
};`,
                language: 'typescript',
              },
              {
                id: '4',
                name: 'Header.tsx',
                type: 'file',
                path: '/src/components/Header.tsx',
                content: `import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="header">
      <h1>{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </header>
  );
};`,
                language: 'typescript',
              },
            ],
          },
          {
            id: '5',
            name: 'utils',
            type: 'folder',
            path: '/src/utils',
            children: [
              {
                id: '6',
                name: 'api.ts',
                type: 'file',
                path: '/src/utils/api.ts',
                content: `export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method: 'GET',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return response.json();
  }
}

export const apiClient = new ApiClient();`,
                language: 'typescript',
              },
            ],
          },
          {
            id: '7',
            name: 'hooks',
            type: 'folder',
            path: '/src/hooks',
            children: [
              {
                id: '8',
                name: 'useLocalStorage.ts',
                type: 'file',
                path: '/src/hooks/useLocalStorage.ts',
                content: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(\`Error setting localStorage key "\${key}":\`, error);
    }
  };

  return [storedValue, setValue] as const;
}`,
                language: 'typescript',
              },
            ],
          },
        ],
      },
      {
        id: '9',
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: `{
  "name": "${project.name.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "description": "${project.description || 'Project description'}",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.0.0"
  }
}`,
        language: 'json',
      },
      {
        id: '10',
        name: 'README.md',
        type: 'file',
        path: '/README.md',
        content: `# ${project.name}

${project.description || 'Project description'}

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- \`src/components/\` - React components
- \`src/utils/\` - Utility functions
- \`src/hooks/\` - Custom React hooks

## Technologies Used

- Next.js
- React
- TypeScript
- ESLint

## Contributing

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request
`,
        language: 'markdown',
      },
    ];

    return fileTree;
  }

  async saveFile(
    projectId: number,
    filePath: string,
    content: string,
    userId: number,
  ) {
    // Verificar acceso al proyecto
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
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
      throw new Error('Proyecto no encontrado o sin acceso');
    }

    // En un caso real, aquí guardarías el archivo en el sistema de archivos o base de datos
    // Por ahora, simularemos que se guardó correctamente
    console.log(
      `Saving file ${filePath} in project ${projectId}:`,
      content.substring(0, 100) + '...',
    );

    // Actualizar la fecha de modificación del proyecto
    await this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Archivo guardado correctamente',
      filePath,
      savedAt: new Date().toISOString(),
    };
  }

  async executeCode(
    projectId: number,
    filePath: string,
    content: string,
    language: string,
    userId: number,
  ) {
    // Verificar acceso al proyecto
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
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
      throw new Error('Proyecto no encontrado o sin acceso');
    }

    // Simular ejecución de código (en un caso real, usarías un sandbox)
    let output = '';
    let success = true;
    let error = '';

    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'typescript':
          if (content.includes('console.log')) {
            const logMatches = content.match(
              /console\.log\(['"`]([^'"`]*)['"`]\)/g,
            );
            if (logMatches) {
              output = logMatches
                .map((match) => {
                  const textMatch = match.match(
                    /console\.log\(['"`]([^'"`]*)['"`]\)/,
                  );
                  return textMatch ? textMatch[1] : '';
                })
                .join('\n');
            } else {
              output = 'Código ejecutado correctamente\n';
            }
          } else if (content.includes('function')) {
            output = 'Función definida correctamente\n';
          } else {
            output = 'Código JavaScript ejecutado\n';
          }
          break;

        case 'python':
          if (content.includes('print(')) {
            const printMatches = content.match(/print\(['"`]([^'"`]*)['"`]\)/g);
            if (printMatches) {
              output = printMatches
                .map((match) => {
                  const textMatch = match.match(/print\(['"`]([^'"`]*)['"`]\)/);
                  return textMatch ? textMatch[1] : '';
                })
                .join('\n');
            } else {
              output = 'Código Python ejecutado\n';
            }
          } else {
            output = 'Script Python ejecutado correctamente\n';
          }
          break;

        case 'json':
          JSON.parse(content);
          output = 'JSON válido\n';
          break;

        default:
          output = `Código ${language} procesado correctamente\n`;
      }

      // Agregar timestamp
      output += `\n--- Ejecutado a las ${new Date().toLocaleTimeString()} ---`;
    } catch (e) {
      success = false;
      error = `Error de sintaxis: ${e instanceof Error ? e.message : 'Error desconocido'}`;
      output = error;
    }

    return {
      success,
      output,
      error: success ? undefined : error,
      language,
      executedAt: new Date().toISOString(),
    };
  }

  async analyzeCode(
    projectId: number,
    filePath: string,
    content: string,
    language: string,
    userId: number,
  ) {
    // Verificar acceso al proyecto
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
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
      throw new Error('Proyecto no encontrado o sin acceso');
    }

    // Simular análisis de IA (en un caso real, usarías OpenAI, Claude, etc.)
    const lines = content.split('\n').length;
    const hasComments = content.includes('//') || content.includes('/*');
    const hasTypeScript =
      language === 'typescript' ||
      filePath.endsWith('.ts') ||
      filePath.endsWith('.tsx');
    const hasConsoleLog =
      content.includes('console.log') || content.includes('console.warn');
    const hasErrorHandling =
      content.includes('try') || content.includes('catch');

    // Generar puntuaciones basadas en el análisis
    let performanceScore = 85;
    let securityScore = 90;
    let bestPracticesScore = 80;

    const performanceSuggestions: string[] = [];
    const securityRisks: string[] = [];
    const bestPracticesIssues: string[] = [];

    // Análisis de rendimiento
    if (lines > 100) {
      performanceScore -= 10;
      performanceSuggestions.push(
        'Considera dividir este archivo en módulos más pequeños',
      );
    }
    if (content.includes('for (') && !content.includes('const ')) {
      performanceScore -= 5;
      performanceSuggestions.push(
        'Usa for...of o métodos de array como map/filter para mejor rendimiento',
      );
    }
    if (!hasTypeScript && language === 'javascript') {
      performanceScore -= 15;
      performanceSuggestions.push(
        'Migrar a TypeScript mejorará el rendimiento y mantenibilidad',
      );
    }

    // Análisis de seguridad
    if (content.includes('eval(')) {
      securityScore -= 20;
      securityRisks.push(
        'Uso de eval() detectado - riesgo de ejecución de código malicioso',
      );
    }
    if (content.includes('innerHTML') && !content.includes('sanitize')) {
      securityScore -= 10;
      securityRisks.push('Uso de innerHTML sin sanitización - riesgo de XSS');
    }
    if (content.includes('localStorage') && !content.includes('JSON.parse')) {
      securityScore -= 5;
      securityRisks.push(
        'Datos en localStorage podrían necesitar validación adicional',
      );
    }

    // Análisis de mejores prácticas
    if (!hasComments && lines > 20) {
      bestPracticesScore -= 15;
      bestPracticesIssues.push(
        'Agregar comentarios para mejorar la legibilidad del código',
      );
    }
    if (hasConsoleLog) {
      bestPracticesScore -= 10;
      bestPracticesIssues.push(
        'Remover console.log antes de producción o usar un logger apropiado',
      );
    }
    if (
      !hasErrorHandling &&
      (content.includes('fetch') || content.includes('api'))
    ) {
      bestPracticesScore -= 15;
      bestPracticesIssues.push(
        'Agregar manejo de errores para llamadas asíncronas',
      );
    }
    if (content.includes('any') && hasTypeScript) {
      bestPracticesScore -= 10;
      bestPracticesIssues.push(
        'Evitar el uso de "any" - definir tipos específicos',
      );
    }

    // Agregar sugerencias positivas si el código está bien
    if (performanceSuggestions.length === 0) {
      performanceSuggestions.push('Código bien optimizado para rendimiento');
    }
    if (securityRisks.length === 0) {
      securityRisks.push('No se detectaron problemas de seguridad evidentes');
    }
    if (bestPracticesIssues.length === 0) {
      bestPracticesIssues.push('Código sigue buenas prácticas de desarrollo');
    }

    return {
      performance: {
        score: Math.max(0, Math.min(100, performanceScore)),
        suggestions: performanceSuggestions,
      },
      security: {
        score: Math.max(0, Math.min(100, securityScore)),
        risks: securityRisks,
      },
      bestPractices: {
        score: Math.max(0, Math.min(100, bestPracticesScore)),
        issues: bestPracticesIssues,
      },
      summary: {
        linesOfCode: lines,
        language,
        hasTypeScript,
        hasComments,
        hasErrorHandling,
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  async addCollaborator(projectId: number, email: string, name: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: name,
          username: email.split('@')[0],
          password: 'changeme',
        },
      });
    }
    let collaborator = await this.prisma.projectCollaborator.findFirst({
      where: { projectId, userId: user.id },
      include: { user: true },
    });
    if (!collaborator) {
      collaborator = await this.prisma.projectCollaborator.create({
        data: { projectId, userId: user.id, role: 'Usuario' },
        include: { user: true },
      });
    }
    return collaborator;
  }

  async updateCollaboratorRole(
    projectId: number,
    userId: number,
    role: string,
  ) {
    await this.prisma.projectCollaborator.updateMany({
      where: { projectId, userId },
      data: { role },
    });
  }

  async removeCollaborator(projectId: number, userId: number) {
    await this.prisma.projectCollaborator.deleteMany({
      where: { projectId, userId },
    });
  }
}
