import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import * as client from 'prom-client';

@ApiTags('observability')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
  })
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', client.register.contentType);
    const metrics = await this.metricsService.getMetrics();
    res.send(metrics);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Metrics summary for dashboards' })
  @ApiResponse({ status: 200, description: 'Summarized metrics data' })
  async getMetricsSummary() {
    const values = await this.metricsService.getMetricValues();

    return {
      service: 'eventshuffle-api',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: values.uptime,
        humanReadable: this.formatUptime(values.uptime),
      },
      memory: {
        rss: `${Math.round(values.memory.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(values.memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(values.memory.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(values.memory.external / 1024 / 1024)}MB`,
      },
      performance: {
        httpRequests: values.httpRequests,
        errors: values.errors,
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}
