import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { Database } from '../../core/database/database';
import { DATABASE_CONNECTION } from '../../core/database/database.module';
import {
  events,
  eventDates,
  eventVotes,
  Event,
  EventDate,
  EventVote,
  NewEventVote,
} from '../../core/database/schema';
import type { CreateEventDto } from '../dto';
import { DatabaseException } from '../../core/errors/custom-exceptions';
import { Traceable } from '../../core/telemetry/tracing.decorator';
import { MetricsService } from '../../core/telemetry/metrics.service';

@Injectable()
export class EventsRepository {
  private readonly logger = new Logger(EventsRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly metricsService: MetricsService,
  ) {}

  private recordQuery(
    type: string,
    table: string,
    startTime: number,
    error?: Error,
  ) {
    this.metricsService.recordDatabaseQuery(
      type,
      table,
      Date.now() - startTime,
    );
    if (error) this.logger.error(error.message, error);
  }

  @Traceable('repository.createEvent')
  async createEvent(dto: CreateEventDto): Promise<Event> {
    const startTime = Date.now();
    try {
      return await this.db.transaction(async (tx) => {
        const [createdEvent] = await tx
          .insert(events)
          .values({ name: dto.name })
          .returning();
        await tx
          .insert(eventDates)
          .values(
            dto.dates.map((date) => ({ eventId: createdEvent.id, date })),
          );
        this.recordQuery('INSERT', 'events', startTime);
        return createdEvent;
      });
    } catch (error) {
      this.recordQuery('INSERT', 'events', startTime, error);
      throw new DatabaseException('Failed to create event', error);
    }
  }

  @Traceable('repository.findAllEvents')
  async findAllEvents(): Promise<Event[]> {
    const startTime = Date.now();
    try {
      this.recordQuery('SELECT', 'events', startTime);
      return await this.db.select().from(events).orderBy(events.id);
    } catch (error) {
      this.recordQuery('SELECT', 'events', startTime, error);
      throw new DatabaseException('Failed to fetch events', error);
    }
  }

  @Traceable('repository.findEventById')
  async findEventById(id: string): Promise<Event | null> {
    const startTime = Date.now();
    try {
      this.recordQuery('SELECT', 'events', startTime);
      const [event] = await this.db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      return event || null;
    } catch (error) {
      this.recordQuery('SELECT', 'events', startTime, error);
      throw new DatabaseException('Failed to find event', error);
    }
  }

  @Traceable('repository.findEventDates')
  async findEventDates(eventId: string): Promise<EventDate[]> {
    const startTime = Date.now();
    try {
      this.recordQuery('SELECT', 'event_dates', startTime);
      return await this.db
        .select()
        .from(eventDates)
        .where(eq(eventDates.eventId, eventId))
        .orderBy(eventDates.date);
    } catch (error) {
      this.recordQuery('SELECT', 'event_dates', startTime, error);
      throw new DatabaseException('Failed to find event dates', error);
    }
  }

  @Traceable('repository.findEventVotes')
  async findEventVotes(eventId: string): Promise<EventVote[]> {
    const startTime = Date.now();
    try {
      this.recordQuery('SELECT', 'event_votes', startTime);
      return await this.db
        .select()
        .from(eventVotes)
        .where(eq(eventVotes.eventId, eventId))
        .orderBy(eventVotes.date, eventVotes.voterName);
    } catch (error) {
      this.recordQuery('SELECT', 'event_votes', startTime, error);
      throw new DatabaseException('Failed to find event votes', error);
    }
  }

  @Traceable('repository.deleteVotesForUser')
  async deleteVotesForUser(eventId: string, voterName: string): Promise<void> {
    const startTime = Date.now();
    try {
      this.recordQuery('DELETE', 'event_votes', startTime);
      await this.db
        .delete(eventVotes)
        .where(
          and(
            eq(eventVotes.eventId, eventId),
            eq(eventVotes.voterName, voterName),
          ),
        );
    } catch (error) {
      this.recordQuery('DELETE', 'event_votes', startTime, error);
      throw new DatabaseException('Failed to delete votes', error);
    }
  }

  @Traceable('repository.insertVotes')
  async insertVotes(voteValues: NewEventVote[]): Promise<void> {
    if (!voteValues.length) return;
    const startTime = Date.now();
    try {
      this.recordQuery('INSERT', 'event_votes', startTime);
      await this.db.insert(eventVotes).values(voteValues);
    } catch (error) {
      this.recordQuery('INSERT', 'event_votes', startTime, error);
      throw new DatabaseException('Failed to insert votes', error);
    }
  }
}
