import { Controller, Get, Version, Inject, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DATABASE_CONNECTION } from '../database/database.module';
import type { Database } from '../database/database';
import { sql } from 'drizzle-orm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    try {
      // Check database connectivity
      await this.db.execute(sql`SELECT 1 as health_check`);

      return {
        status: 'ok',
        service: 'eventshuffle-api',
        database: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'degraded',
        service: 'eventshuffle-api',
        database: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
