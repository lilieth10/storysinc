import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  test() {
    return { message: 'Backend is working!' };
  }

  @Get('projects-test')
  projectsTest() {
    return [
      {
        id: 1,
        name: 'E-commerce React',
        language: 'typescript',
        pattern: 'microservices',
      },
      {
        id: 2,
        name: 'Blog API',
        language: 'javascript',
        pattern: 'monolith',
      },
      {
        id: 3,
        name: 'Dashboard Admin',
        language: 'typescript',
        pattern: 'microservices',
      },
      {
        id: 4,
        name: 'Mobile App',
        language: 'javascript',
        pattern: 'monolith',
      },
      {
        id: 5,
        name: 'AI Chat Bot',
        language: 'python',
        pattern: 'microservices',
      },
    ];
  }
}
