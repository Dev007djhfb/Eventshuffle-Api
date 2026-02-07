// Simple tracing decorator for observability
// TODO: Can be enhanced with OpenTelemetry for distributed tracing in production

import { Logger } from '@nestjs/common';

export function Traceable(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}`);
    const operation =
      operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Simple tracing log
        logger.debug(`✅ ${operation} completed in ${duration}ms`);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(
          `❌ ${operation} failed after ${duration}ms: ${error.message}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
