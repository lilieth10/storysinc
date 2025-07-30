/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import { VM } from 'vm2';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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
    // Optimización: Consulta más simple y rápida
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        pattern: true,
        status: true,
        tags: true,
        lastSync: true,
        iaInsights: true,
        components: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        // Cargar colaboradores solo si es necesario
        collaborators: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    return project;
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
    // Optimización: Verificación más rápida de acceso
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
      select: {
        id: true,
        name: true,
      },
    });

    if (!project) {
      throw new Error('Proyecto no encontrado o sin acceso');
    }

    // Estructura de archivos optimizada (menos contenido inicial)
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
                name: 'App.tsx',
                type: 'file',
                path: '/src/App.tsx',
                content: `import React from 'react';
import { Button } from './components/Button';

function App() {
  return (
    <div className="App">
      <h1>Mi Aplicación</h1>
      <Button variant="primary">
        Hacer clic
      </Button>
    </div>
  );
}

export default App;`,
                language: 'typescript',
              },
            ],
          },
          {
            id: '5',
            name: 'index.tsx',
            type: 'file',
            path: '/src/index.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
            language: 'typescript',
          },
        ],
      },
      {
        id: '6',
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: `{
  "name": "mi-proyecto",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
        language: 'json',
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

    let output = '';
    let success = true;
    let error = '';

    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'typescript':
          output = await this.executeJavaScript(content);
          break;

        case 'python':
          output = await this.executePython(content);
          break;

        case 'html':
          output = await this.executeHTML(content);
          break;

        case 'css':
          output = await this.executeCSS(content);
          break;

        case 'json':
          output = await this.executeJSON(content);
          break;

        default:
          output = `Lenguaje ${language} no soportado aún. Código procesado correctamente.\n`;
      }

      // Agregar timestamp
      output += `\n--- Ejecutado a las ${new Date().toLocaleTimeString()} ---`;
    } catch (e) {
      success = false;
      error = `Error de ejecución: ${e instanceof Error ? e.message : 'Error desconocido'}`;
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

  private async executeJavaScript(code: string): Promise<string> {
    // Verificar si es código ejecutable o archivo de proyecto
    if (this.isProjectFile(code)) {
      return 'Este archivo contiene código de proyecto (React/TypeScript) y no se puede ejecutar directamente.\n\nPara ejecutar código JavaScript puro, crea un archivo .js con código como:\n\nconsole.log("¡Hola mundo!");\nconst suma = 2 + 2;\nconsole.log("Resultado:", suma);';
    }

    let output = '';

    const vm = new VM({
      timeout: 5000, // 5 segundos máximo
      sandbox: {
        console: {
          log: (...args: unknown[]) => {
            const message = args
              .map((arg) =>
                typeof arg === 'object'
                  ? JSON.stringify(arg, null, 2)
                  : String(arg),
              )
              .join(' ');
            output += message + '\n';
          },
          warn: (...args: unknown[]) => {
            const message = `WARN: ${args.join(' ')}`;
            output += message + '\n';
          },
          error: (...args: unknown[]) => {
            const message = `ERROR: ${args.join(' ')}`;
            output += message + '\n';
          },
        },
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        Buffer: Buffer,
        process: {
          env: {},
          platform: 'node',
          version: process.version,
        },
      },
    });

    try {
      vm.run(code);
    } catch (error) {
      output += `Error de ejecución: ${error instanceof Error ? error.message : 'Error desconocido'}\n`;
    }

    return output || 'Código JavaScript ejecutado sin salida visible.';
  }

  private isProjectFile(code: string): boolean {
    // Detectar archivos de proyecto React/TypeScript de manera más específica
    const projectPatterns = [
      /import\s+React\s+from/,
      /import\s+.*\s+from\s+['"]react/,
      /ReactDOM\.render/,
      /export\s+default/,
      /<React\.StrictMode>/,
      /document\.getElementById/,
      /JSX\.Element/,
      /from\s+['"]\.\/[A-Z]/,
      /import\s+.*\s+from\s+['"]\./,
    ];

    // Si contiene patrones de React/TypeScript, es un archivo de proyecto
    if (projectPatterns.some((pattern) => pattern.test(code))) {
      return true;
    }

    // También verificar si es código puro ejecutable
    const executablePatterns = [
      /console\.log\(/,
      /print\(/,
      /def\s+\w+\s*\(/,
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
    ];

    // Si NO contiene patrones ejecutables, probablemente es un archivo de proyecto
    return !executablePatterns.some((pattern) => pattern.test(code));
  }

  private async executePython(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const tempFile = join(tmpdir(), `python_${Date.now()}.py`);

      try {
        writeFileSync(tempFile, code);

        const pythonProcess = spawn('python', [tempFile], {
          timeout: 10000, // 10 segundos máximo
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          // Limpiar archivo temporal
          try {
            unlinkSync(tempFile);
          } catch (e) {
            // Ignorar errores de limpieza
          }

          if (code === 0) {
            resolve(output || 'Código Python ejecutado sin salida visible.');
          } else {
            resolve(`Error de Python:\n${errorOutput}`);
          }
        });

        pythonProcess.on('error', (err) => {
          try {
            unlinkSync(tempFile);
          } catch (e) {
            // Ignorar errores de limpieza
          }
          resolve(`Error ejecutando Python: ${err.message}`);
        });
      } catch (err) {
        resolve(`Error creando archivo temporal: ${err.message}`);
      }
    });
  }

  private async executeHTML(code: string): Promise<string> {
    // Para HTML, devolvemos el código con un mensaje de previsualización
    return `HTML generado correctamente.\n\nPara previsualizar, copia este código en un archivo .html:\n\n${code}\n\n--- Previsualización disponible en el editor ---`;
  }

  private async executeCSS(code: string): Promise<string> {
    // Para CSS, validamos la sintaxis básica
    try {
      // Validación básica de CSS
      if (code.includes('{') && code.includes('}')) {
        return `CSS válido generado.\n\nEstilos definidos:\n${code}\n\n--- Aplicar a un archivo HTML para ver resultados ---`;
      } else {
        return 'CSS procesado. Asegúrate de incluir reglas CSS válidas con llaves {}.';
      }
    } catch (e) {
      return `Error en CSS: ${e instanceof Error ? e.message : 'Error desconocido'}`;
    }
  }

  private async executeJSON(code: string): Promise<string> {
    try {
      const parsed = JSON.parse(code);
      return `JSON válido:\n${JSON.stringify(parsed, null, 2)}`;
    } catch (e) {
      return `Error de sintaxis JSON: ${e instanceof Error ? e.message : 'Error desconocido'}`;
    }
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
