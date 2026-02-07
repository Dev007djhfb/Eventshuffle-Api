import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ShutdownModule } from './shutdown/shutdown.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule,
    TelemetryModule,
    ShutdownModule,
    HealthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        autoLogging: true,
        serializers: { req: () => undefined, res: () => undefined },
        genReqId: (req) => (req as any).id,
      },
    }),
  ],
  exports: [
    DatabaseModule,
    TelemetryModule,
    ShutdownModule,
    HealthModule,
    ThrottlerModule,
    LoggerModule,
  ],
})
export class CoreModule {}
