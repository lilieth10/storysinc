import { SetMetadata } from '@nestjs/common';

export const PROJECT_PERMISSIONS_KEY = 'project-permissions';
export const ProjectPermissions = (...permissions: string[]) => 
  SetMetadata(PROJECT_PERMISSIONS_KEY, permissions);