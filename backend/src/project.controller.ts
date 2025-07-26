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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { Request } from 'express';

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
  async getProject(@Param('id') id: string) {
    return this.projectService.getProjectById(parseInt(id));
  }

  @Put(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(parseInt(id), updateProjectDto);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string) {
    return this.projectService.deleteProject(parseInt(id));
  }

  // Nuevos endpoints para el editor de código
  @Get(':id/files')
  async getProjectFiles(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectService.getProjectFiles(parseInt(id), req.user.userId);
  }

  @Put(':id/files')
  async saveFile(
    @Param('id') id: string,
    @Body() saveFileDto: SaveFileDto,
    @Req() req: AuthRequest,
  ) {
    return this.projectService.saveFile(
      parseInt(id),
      saveFileDto.filePath,
      saveFileDto.content,
      req.user.userId,
    );
  }

  @Post(':id/execute')
  async executeCode(
    @Param('id') id: string,
    @Body() executeCodeDto: ExecuteCodeDto,
    @Req() req: AuthRequest,
  ) {
    return this.projectService.executeCode(
      parseInt(id),
      executeCodeDto.filePath,
      executeCodeDto.content,
      executeCodeDto.language,
      req.user.userId,
    );
  }

  @Post(':id/analyze')
  async analyzeCode(
    @Param('id') id: string,
    @Body() analyzeCodeDto: AnalyzeCodeDto,
    @Req() req: AuthRequest,
  ) {
    return this.projectService.analyzeCode(
      parseInt(id),
      analyzeCodeDto.filePath,
      analyzeCodeDto.content,
      analyzeCodeDto.language,
      req.user.userId,
    );
  }

  @Post(':id/analyze-ia')
  async analyzeIA(@Param('id') id: string) {
    return this.projectService.analyzeProjectIA(parseInt(id));
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.projectService.syncProject(parseInt(id));
  }
}
