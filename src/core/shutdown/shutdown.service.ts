// Simple graceful shutdown service
// TODO: Can be enhanced with more sophisticated shutdown orchestration in production

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Injectable()
export class ShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(ShutdownService.name);
  private server: any;
  private isShuttingDown = false;

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  setServer(server: any) {
    this.server = server;
    this.setupSignalHandlers();
  }

  private setupSignalHandlers() {
    // Handle different shutdown signals
    const signals = ['SIGTERM', 'SIGINT'] as const;

    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.logger.log(`📡 Received ${signal}, starting graceful shutdown...`);
        await this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('💥 Unhandled Rejection:', reason);
      process.exit(1);
    });
  }

  async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.log('⚠️  Already shutting down...');
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    this.logger.log(`🚦 Starting graceful shutdown (signal: ${signal})`);

    try {
      // Step 1: Stop accepting new connections
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((error: any) => {
            if (error) {
              this.logger.error('❌ Error closing server:', error);
              reject(error);
            } else {
              this.logger.log('✅ Server stopped accepting new connections');
              resolve();
            }
          });
        });
      }

      // Step 2: Wait a moment for in-flight requests to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Graceful shutdown completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('❌ Error during graceful shutdown:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔄 NestJS module destroy hook called');
    if (!this.isShuttingDown) {
      await this.gracefulShutdown('MODULE_DESTROY');
    }
  }

  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}
