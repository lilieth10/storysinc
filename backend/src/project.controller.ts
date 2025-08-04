import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpException,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { Request } from 'express';
import { ProjectRolesGuard } from './guards/project-roles.guard';
import { ProjectPermissions } from './decorators/project-permissions.decorator';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

interface CreateProjectDto {
  name: string;
  description?: string;
  pattern: string;
  tags?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string;
  pattern?: string;
  status?: string;
  tags?: string;
}

interface SaveFileDto {
  filePath: string;
  content: string;
}

interface ExecuteCodeDto {
  filePath: string;
  content: string;
  language: string;
}

interface AnalyzeCodeDto {
  filePath: string;
  content: string;
  language: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthRequest,
  ) {
    return this.projectService.createProject({
      ...createProjectDto,
      ownerId: req.user.userId,
    });
  }

  @Get()
  async getProjects(@Req() req: AuthRequest) {
    return this.projectService.getProjectsForUser(req.user.userId);
  }

  @Get(':id')
  async getProject(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectService.getProjectById(parseInt(id), req.user.userId);
  }

  @Put(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(parseInt(id), updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(ProjectRolesGuard)
  @ProjectPermissions('delete')
  async deleteProject(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectService.deleteProject(parseInt(id));
  }

  // Nuevos endpoints para el editor de código
  @Get(':id/files')
  async getProjectFiles(@Param('id') id: string, @Req() req: AuthRequest) {
    try {
      return await this.projectService.getProjectFiles(
        parseInt(id),
        req.user.userId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error obteniendo archivos del proyecto';
      throw new HttpException(message, 404);
    }
  }

  @Get(':id/files/:fileName')
  async getFileContent(
    @Param('id') id: string,
    @Param('fileName') fileName: string,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.projectService.getFileContent(
        parseInt(id),
        fileName,
        req.user.userId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error obteniendo contenido del archivo';
      throw new HttpException(message, 404);
    }
  }

  @Put(':id/files')
  @UseGuards(ProjectRolesGuard)
  @ProjectPermissions('write')
  async saveFile(
    @Param('id') id: string,
    @Body() saveFileDto: SaveFileDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.projectService.saveFile(
        parseInt(id),
        saveFileDto.filePath,
        saveFileDto.content,
        req.user.userId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error guardando archivo';
      throw new HttpException(message, 400);
    }
  }

  @Post(':id/execute')
  async executeCode(
    @Param('id') id: string,
    @Body() executeCodeDto: ExecuteCodeDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.projectService.executeCode(
        parseInt(id),
        executeCodeDto.filePath,
        executeCodeDto.content,
        executeCodeDto.language,
        req.user.userId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error ejecutando código';
      throw new HttpException(message, 400);
    }
  }

  @Post(':id/analyze')
  async analyzeCode(
    @Param('id') id: string,
    @Body() analyzeCodeDto: AnalyzeCodeDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.projectService.analyzeCode(
        parseInt(id),
        analyzeCodeDto.filePath,
        analyzeCodeDto.content,
        analyzeCodeDto.language,
        req.user.userId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error analizando código';
      throw new HttpException(message, 400);
    }
  }

  @Post(':id/analyze-ia')
  async analyzeIA(@Param('id') id: string) {
    return this.projectService.analyzeProjectIA(parseInt(id));
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectService.syncProject(parseInt(id), req.user.userId);
  }

  @Post(':id/collaborators')
  @UseGuards(ProjectRolesGuard)
  @ProjectPermissions('manage_collaborators')
  async addCollaborator(
    @Param('id') id: string,
    @Body() body: { email: string; name: string },
    @Req() req: AuthRequest,
  ) {
    const collaborator = await this.projectService.addCollaborator(
      parseInt(id),
      body.email,
      body.name,
    );
    return { message: 'Colaborador agregado', collaborator };
  }

  @Patch(':id/collaborators/:userId')
  async updateCollaboratorRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    await this.projectService.updateCollaboratorRole(
      parseInt(id),
      parseInt(userId),
      body.role,
    );
    return { message: 'Rol actualizado' };
  }

  @Delete(':id/collaborators/:userId')
  async removeCollaborator(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.projectService.removeCollaborator(
      parseInt(id),
      parseInt(userId),
    );
    return { message: 'Colaborador eliminado' };
  }

  @Post(':id/sync-folder')
  async createSyncFolder(
    @Param('id') id: string,
    @Body() body: { userId: number; userName: string; syncFiles: any[]; lastSync: string; changes: any[] },
  ) {
    const syncFolder = await this.projectService.createSyncFolder(
      parseInt(id),
      body.userId,
      body.userName,
      body.syncFiles,
      body.lastSync,
      body.changes,
    );
    return { message: 'Carpeta sync creada', syncFolder };
  }
}
