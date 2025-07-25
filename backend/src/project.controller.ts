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

  @Post(':id/analyze-ia')
  async analyzeIA(@Param('id') id: string) {
    return this.projectService.analyzeProjectIA(parseInt(id));
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.projectService.syncProject(parseInt(id));
  }
}
