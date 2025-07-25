import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  @Get('metrics')
  getMetrics() {
    return {
      subscriptions: {
        categories: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN'],
        Gratis: [200000, 250000, 300000, 350000, 400000, 450000],
        Basico: [80000, 90000, 100000, 110000, 120000, 130000],
        Pro: [40000, 45000, 50000, 55000, 60000, 65000],
        Empresa: [10000, 12000, 14000, 16000, 18000, 20000],
      },
      resources: {
        labels: ['CPU', 'GPU', 'RAM'],
        values: [50, 30, 20],
      },
    };
  }
}
