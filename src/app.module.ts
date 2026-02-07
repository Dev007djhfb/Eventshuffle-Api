import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { CoreModule } from './core/core.module';
import { EventsModule } from './events/events.module';
import { RequestIdMiddleware } from './core/middleware/request-id.middleware';
import { MetricsMiddleware } from './core/middleware/metrics.middleware';

@Module({
  imports: [CoreModule, EventsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, MetricsMiddleware).forRoutes('*');
  }
}
