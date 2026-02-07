import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './core/errors/all-exceptions.filter';
import { Logger } from 'nestjs-pino';
import { ShutdownService } from './core/shutdown/shutdown.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // ✅ tell Nest to use Pino
  app.useLogger(app.get(Logger));

  // ✅ Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // ✅ global error handling
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('EventShuffle API')
    .setDescription(
      'A production-ready NestJS API for event scheduling and voting',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);

  // 🛡️ Setup graceful shutdown
  const shutdownService = app.get(ShutdownService);
  shutdownService.setServer(server);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
  console.log(`📊 Metrics: http://localhost:${port}/metrics`);
  console.log(`🛡️  Graceful shutdown enabled`);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();
}

bootstrap().catch((error) => {
  console.error('💥 Application failed to start:', error);
  process.exit(1);
});
