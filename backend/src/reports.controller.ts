import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Res,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
// import PDFDocument from 'pdfkit';

interface AuthRequest extends Request {
  user: { userId: number; email: string };
}

interface CreateReportDto {
  type: string;
  title: string;
  description?: string;
  metrics?: Record<string, any>;
  dateRange?: { start: string; end: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getReports(
    @Req() req: AuthRequest,
    @Query('type') type?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const where: Prisma.ReportWhereInput = {
      userId: req.user.userId,
    };

    if (type) {
      where.type = type;
    }

    if (start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('metrics')
  async getReportsMetrics(
    @Req() req: AuthRequest,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit) : 10;
    
    return this.prisma.report.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  @Get(':id')
  async getReport(@Param('id') id: string, @Req() req: AuthRequest) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
      },
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    return report;
  }

  @Post()
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @Req() req: AuthRequest,
  ) {
    try {
      // Simular análisis IA
      const iaResults = {
        recommendations: [
          {
            type: 'performance',
            message: 'Optimiza las consultas de base de datos',
            priority: 'high',
          },
          {
            type: 'security',
            message: 'Implementa autenticación de dos factores',
            priority: 'medium',
          },
        ],
        alerts: [
          {
            type: 'warning',
            message: 'Uso de CPU por encima del 80%',
            severity: 'medium',
          },
        ],
        insights: {
          performanceScore: Math.floor(Math.random() * 30) + 70,
          securityScore: Math.floor(Math.random() * 20) + 80,
          recommendations: Math.floor(Math.random() * 5) + 3,
        },
      };

      const report = await this.prisma.report.create({
        data: {
          userId: req.user.userId,
          type: createReportDto.type,
          title: createReportDto.title,
          description: createReportDto.description || '',
          metrics: JSON.stringify(createReportDto.metrics || {}),
          iaResults: JSON.stringify(iaResults),
          dateRange: JSON.stringify(createReportDto.dateRange || {}),
          fileUrl: null,
        },
      });

      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Error al crear el reporte');
    }
  }

  @Post('download')
  async downloadReport(
    @Body() body: { reportId: number; format: string },
    @Res() res: Response,
  ) {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: body.reportId },
      });

      if (!report) {
        return res
          .status(404)
          .json({ success: false, message: 'Reporte no encontrado' });
      }

      if (body.format === 'pdf') {
        try {
          const PDFDocument = require('pdfkit');
          const doc = new PDFDocument();
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="reporte_${report.id}.pdf"`,
          );

          // Agregar contenido al PDF
          doc.fontSize(20).text(`Reporte: ${report.title}`, { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Tipo: ${report.type}`);
          doc.text(`Fecha: ${new Date(report.createdAt).toLocaleString()}`);
          doc.moveDown();
          doc.text('---');
          doc.moveDown();
          
          // Métricas
          doc.fontSize(14).text('Métricas del Sistema:');
          doc.moveDown();
          const metrics = JSON.parse(report.metrics);
          doc.fontSize(10).text(JSON.stringify(metrics, null, 2));
          doc.moveDown();
          
          // Resultados IA
          doc.fontSize(14).text('Análisis de IA:');
          doc.moveDown();
          const iaResults = JSON.parse(report.iaResults);
          doc.fontSize(10).text(JSON.stringify(iaResults, null, 2));

          doc.pipe(res);
          doc.end();
        } catch (pdfError) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error generando PDF'
          });
        }
      } else {
        // CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="reporte_${report.id}.csv"`,
        );
        
        const csvContent = `titulo,tipo,fecha,descripcion\n"${report.title}","${report.type}","${new Date(report.createdAt).toLocaleString()}","${report.description || ''}"`;
        res.send(csvContent);
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error en la descarga'
      });
    }
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string, @Req() req: AuthRequest) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
      },
    });

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    return this.prisma.report.delete({
      where: { id: parseInt(id) },
    });
  }
}
