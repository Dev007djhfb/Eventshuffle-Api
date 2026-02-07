import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventsValidationService } from './services/events-validation.service';
import { EventsRepository } from './repository/events.repository';
import { DatabaseModule } from '../core/database/database.module';
import { TelemetryModule } from '../core/telemetry/telemetry.module';

@Module({
  imports: [DatabaseModule, TelemetryModule],
  controllers: [EventsController],
  providers: [EventsService, EventsValidationService, EventsRepository],
  exports: [EventsService, EventsValidationService, EventsRepository],
})
export class EventsModule {}
