// Simple metrics service for basic observability

import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  // Essential metrics for monitoring
  private readonly httpRequestTotal: client.Counter<string>;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly activeConnections: client.Gauge<string>;
  private readonly databaseQueryDuration: client.Histogram<string>;
  private readonly errorRate: client.Counter<string>;

  constructor() {
    // HTTP Request tracking
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

    // System health
    this.activeConnections = new client.Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
    });

    // Database performance
    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    });

    // Error tracking
    this.errorRate = new client.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'operation'],
    });
  }

  onModuleInit() {
    // Register default Node.js metrics (CPU, memory, etc.)
    client.collectDefaultMetrics({
      prefix: 'eventshuffle_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }

  // HTTP request tracking
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

  // Database query tracking
  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.observe({ operation, table }, duration);
  }

  // Error tracking
  recordError(type: string, operation?: string) {
    this.errorRate.inc({ type, operation: operation || 'unknown' });
  }

  // Connection tracking
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Simple counter for custom events
  incrementCounter(name: string, labels?: Record<string, string>) {
    // For basic custom metrics - can be enhanced later
    if (labels) {
      this.httpRequestTotal.inc(labels as any);
    }
  }

  // Get metrics for Prometheus
  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }

  // Get simplified metrics for dashboards
  async getMetricValues() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      httpRequests:
        (await client.register.getSingleMetricAsString(
          'http_requests_total',
        )) || '0',
      errors:
        (await client.register.getSingleMetricAsString('errors_total')) || '0',
    };
  }
}
