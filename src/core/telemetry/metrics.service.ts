import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly httpRequestTotal: client.Counter<string>;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly activeConnections: client.Gauge<string>;
  private readonly databaseQueryDuration: client.Histogram<string>;
  private readonly errorRate: client.Counter<string>;

  constructor() {
    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.activeConnections = new client.Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
    });

    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    });

    this.errorRate = new client.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'operation'],
    });
  }

  onModuleInit() {
    client.collectDefaultMetrics({
      prefix: 'eventshuffle_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }

  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.observe({ operation, table }, duration);
  }

  recordError(type: string, operation?: string) {
    this.errorRate.inc({ type, operation: operation || 'unknown' });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  incrementCounter(name: string, labels?: Record<string, string>) {
    if (labels) {
      this.httpRequestTotal.inc(labels as any);
    }
  }

  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }

  async getMetricValues() {
    const httpRequestsMetric = await client.register.getSingleMetricAsString(
      'http_requests_total',
    );
    const errorsMetric =
      await client.register.getSingleMetricAsString('errors_total');

    const extractValue = (metricString: string | undefined) => {
      if (!metricString) return 0;
      const match = metricString.match(/\s(\d+(?:\.\d+)?)(?:\n|$)/);
      return match ? Number(match[1]) : 0;
    };

    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      httpRequests: extractValue(httpRequestsMetric),
      errors: extractValue(errorsMetric),
    };
  }
}
