import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  @Get('metrics')
  getMetrics() {
    return {
      subscriptions: {
        categories: ['ENG', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
        Gratis: [5000, 8000, 12000, 15000, 18000, 22000],
        Basico: [3000, 5000, 8000, 10000, 12000, 15000],
        Pro: [2000, 3000, 5000, 7000, 9000, 12000],
        Empresa: [1000, 1500, 2500, 3500, 4500, 6000],
      },
      summary: {
        labels: ['Plan Básico', 'Plan Pro', 'Plan Empresa'],
        values: [50, 30, 20],
      },
    };
  }
}
