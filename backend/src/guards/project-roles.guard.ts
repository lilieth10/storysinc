import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'project-permissions',
      context.getHandler(),
    );
    
    if (!requiredPermissions) {
      return true; // No se requieren permisos específicos
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const projectId = parseInt(request.params.id);

    if (!user || !projectId) {
      return false;
    }

    // Verificar si es el propietario del proyecto
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (project?.ownerId === user.userId) {
      return true; // El propietario siempre tiene todos los permisos
    }

    // Verificar rol como colaborador
    const collaborator = await this.prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: user.userId,
      },
      select: { role: true }
    });

    if (!collaborator) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    // Mapear roles a permisos
    const rolePermissions = {
      'Admin': ['read', 'write', 'delete', 'manage_collaborators', 'manage_settings'],
      'Editor': ['read', 'write'],
      'Viewer': ['read'],
      'Usuario': ['read', 'write'], // Rol por defecto
    };

    const userPermissions = rolePermissions[collaborator.role as keyof typeof rolePermissions] || ['read'];
    
    // Verificar si el usuario tiene todos los permisos requeridos
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Tu rol '${collaborator.role}' no permite esta acción. Permisos requeridos: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}