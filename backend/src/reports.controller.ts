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
      // Obtener datos reales del usuario y sus proyectos
      const userProjects = await this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.userId },
            {
              collaborators: {
                some: { userId: req.user.userId },
              },
            },
          ],
        },
        include: {
          collaborators: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          owner: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // Generar métricas dinámicas basadas en datos reales
      const totalProjects = userProjects.length;
      const totalCollaborators = userProjects.reduce(
        (sum, project) => sum + project.collaborators.length,
        0,
      );
      const projectsByPattern = userProjects.reduce((acc, project) => {
        acc[project.pattern] = (acc[project.pattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Generar métricas específicas según el tipo de reporte
      let metrics = {};
      let iaResults = {};

      if (createReportDto.type === 'project') {
        // Métricas de proyectos
        metrics = {
          totalProjects,
          totalCollaborators,
          projectsByPattern,
          averageCollaboratorsPerProject: totalProjects > 0 ? (totalCollaborators / totalProjects).toFixed(2) : 0,
          activeProjects: userProjects.filter(p => p.status === 'active').length,
          recentProjects: userProjects.filter(p => {
            const projectDate = new Date(p.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return projectDate > thirtyDaysAgo;
          }).length,
        };

        // IA Results para proyectos
        const performanceScore = Math.floor(Math.random() * 30) + 70;
        const recommendations = [
          {
            type: 'performance',
            message: totalProjects > 5 ? 'Considera consolidar proyectos similares' : 'Excelente gestión de proyectos',
            priority: totalProjects > 5 ? 'high' : 'low',
          },
          {
            type: 'collaboration',
            message: totalCollaborators > 10 ? 'Gran trabajo en equipo detectado' : 'Considera agregar más colaboradores',
            priority: totalCollaborators > 10 ? 'low' : 'medium',
          },
          {
            type: 'architecture',
            message: projectsByPattern['microservices'] > 2 ? 'Arquitectura escalable detectada' : 'Considera migrar a microservicios',
            priority: projectsByPattern['microservices'] > 2 ? 'low' : 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'info',
              message: `Gestión de ${totalProjects} proyectos activos`,
              severity: 'low',
            },
          ],
          insights: {
            performanceScore,
            collaborationScore: Math.floor(Math.random() * 20) + 80,
            architectureScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else if (createReportDto.type === 'collaboration') {
        // Métricas de colaboración
        const allCollaborators = userProjects.flatMap(p => p.collaborators);
        const uniqueCollaborators = new Set(allCollaborators.map(c => c.user.id));
        const collaboratorsByRole = allCollaborators.reduce((acc, colab) => {
          acc[colab.role] = (acc[colab.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        metrics = {
          totalCollaborators: uniqueCollaborators.size,
          totalCollaborations: allCollaborators.length,
          collaboratorsByRole,
          averageProjectsPerCollaborator: uniqueCollaborators.size > 0 ? (totalProjects / uniqueCollaborators.size).toFixed(2) : 0,
          mostCollaborativeProject: userProjects.reduce((max, project) => 
            project.collaborators.length > max.collaborators.length ? project : max
          , userProjects[0] || { name: 'N/A', collaborators: [] }),
        };

        // IA Results para colaboración
        const collaborationScore = Math.floor(Math.random() * 25) + 75;
        const recommendations = [
          {
            type: 'team',
            message: uniqueCollaborators.size > 5 ? 'Excelente diversidad de equipo' : 'Considera expandir el equipo',
            priority: uniqueCollaborators.size > 5 ? 'low' : 'medium',
          },
          {
            type: 'communication',
            message: 'Implementa herramientas de comunicación en tiempo real',
            priority: 'medium',
          },
          {
            type: 'roles',
            message: Object.keys(collaboratorsByRole).length > 3 ? 'Buena distribución de roles' : 'Considera definir roles más específicos',
            priority: Object.keys(collaboratorsByRole).length > 3 ? 'low' : 'medium',
          },
        ];

        iaResults = {
          recommendations,
          alerts: [
            {
              type: 'success',
              message: `${uniqueCollaborators.size} colaboradores activos`,
              severity: 'low',
            },
          ],
          insights: {
            collaborationScore,
            teamDiversityScore: Math.floor(Math.random() * 20) + 80,
            communicationScore: Math.floor(Math.random() * 15) + 85,
            recommendations: recommendations.length,
          },
        };
      } else {
        // Reporte general
        metrics = {
          totalProjects,
          totalCollaborators,
          projectsByPattern,
          userActivity: {
            projectsCreated: userProjects.filter(p => p.ownerId === req.user.userId).length,
            collaborations: userProjects.filter(p => p.ownerId !== req.user.userId).length,
          },
        };

        iaResults = {
          recommendations: [
            {
              type: 'general',
              message: 'Mantén un buen balance entre proyectos propios y colaboraciones',
              priority: 'medium',
            },
          ],
          alerts: [
            {
              type: 'info',
              message: 'Reporte general generado exitosamente',
              severity: 'low',
            },
          ],
          insights: {
            overallScore: Math.floor(Math.random() * 30) + 70,
            recommendations: 1,
          },
        };
      }

      const report = await this.prisma.report.create({
        data: {
          userId: req.user.userId,
          type: createReportDto.type,
          title: createReportDto.title,
          description: createReportDto.description || '',
          metrics: JSON.stringify(metrics),
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
          doc
            .fontSize(20)
            .text(`Reporte: ${report.title}`, { align: 'center' });
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
            message: 'Error generando PDF',
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
        message: 'Error en la descarga',
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
