import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../telemetry/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const route = this.sanitizeRoute(req.route?.path || req.path);

    // Track active connections (simplified implementation)
    this.metricsService.setActiveConnections(1);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration,
      );
      this.metricsService.setActiveConnections(0);
    });

    res.on('error', () => {
      this.metricsService.recordError('http_request_error', route);
    });

    next();
  }

  private sanitizeRoute(path: string): string {
    if (!path) return 'unknown';
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-zA-Z0-9-_]+$/g, '/:param');
  }
}

export default MetricsMiddleware;
