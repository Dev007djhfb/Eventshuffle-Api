import { Module, Global } from '@nestjs/common';
import { createDatabaseConnection, Database } from './database';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (): Database => {
        return createDatabaseConnection(process.env.DATABASE_URL);
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
