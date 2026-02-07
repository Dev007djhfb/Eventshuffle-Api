import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { Database } from '../../core/database/database';
import { DATABASE_CONNECTION } from '../../core/database/database.module';
import {
  events,
  eventDates,
  eventVotes,
  Event,
  NewEvent,
  EventDate,
  NewEventDate,
  EventVote,
  NewEventVote,
} from '../../core/database/schema';
import type { CreateEventDto, CreateVoteDto } from '../dto';
import {
  DatabaseException,
  ValidationException,
} from '../../core/errors/custom-exceptions';
import { Traceable } from '../../core/telemetry/tracing.decorator';
import { MetricsService } from '../../core/telemetry/metrics.service';

@Injectable()
export class EventsRepository {
  private readonly logger = new Logger(EventsRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly metricsService: MetricsService,
  ) {}

  @Traceable('repository.createEvent')
  async createEvent(dto: CreateEventDto): Promise<Event> {
    const startTime = Date.now();
    try {
      // Validate dates are not in the past
      const today = new Date().toISOString().split('T')[0];
      const pastDates = dto.dates.filter((date) => date < today);
      if (pastDates.length > 0) {
        throw new ValidationException(
          `Cannot create event with past dates: ${pastDates.join(', ')}`,
        );
      }

      // Validate dates are unique
      const uniqueDates = [...new Set(dto.dates)];
      if (uniqueDates.length !== dto.dates.length) {
        throw new ValidationException('Event dates must be unique');
      }

      const [createdEvent] = await this.db
        .insert(events)
        .values({ name: dto.name })
        .returning();

      // Insert event dates
      const eventDateValues: NewEventDate[] = dto.dates.map((date) => ({
        eventId: createdEvent.id,
        date: date,
      }));

      await this.db.insert(eventDates).values(eventDateValues);

      this.metricsService.recordDatabaseQuery(
        'INSERT',
        'events',
        Date.now() - startTime,
      );
      return createdEvent;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'INSERT',
        'events',
        Date.now() - startTime,
      );
      if (error instanceof ValidationException) {
        throw error;
      }
      this.logger.error('Failed to create event:', error);
      throw new DatabaseException('Failed to create event', error as Error);
    }
  }

  @Traceable('repository.findAllEvents')
  async findAllEvents(): Promise<Event[]> {
    const startTime = Date.now();
    try {
      const result = await this.db.select().from(events).orderBy(events.id);
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'events',
        Date.now() - startTime,
      );
      return result;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'events',
        Date.now() - startTime,
      );
      this.logger.error('Failed to fetch events:', error);
      throw new DatabaseException('Failed to fetch events', error as Error);
    }
  }

  @Traceable('repository.findEventById')
  async findEventById(id: string): Promise<Event | null> {
    const startTime = Date.now();
    try {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new ValidationException('Event ID must be a valid UUID string');
      }

      // Validate UUID format (basic check for UUID v4 format)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new ValidationException('Event ID must be a valid UUID format');
      }

      const [event] = await this.db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'events',
        Date.now() - startTime,
      );
      return event || null;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'events',
        Date.now() - startTime,
      );
      if (error instanceof ValidationException) {
        throw error;
      }
      this.logger.error(`Failed to find event ${id}:`, error);
      throw new DatabaseException('Failed to find event', error as Error);
    }
  }

  @Traceable('repository.findEventDates')
  async findEventDates(eventId: string): Promise<EventDate[]> {
    const startTime = Date.now();
    try {
      const result = await this.db
        .select()
        .from(eventDates)
        .where(eq(eventDates.eventId, eventId))
        .orderBy(eventDates.date);
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'event_dates',
        Date.now() - startTime,
      );
      return result;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'event_dates',
        Date.now() - startTime,
      );
      this.logger.error(`Failed to find dates for event ${eventId}:`, error);
      throw new DatabaseException('Failed to find event dates', error as Error);
    }
  }

  @Traceable('repository.findEventVotes')
  async findEventVotes(eventId: string): Promise<EventVote[]> {
    const startTime = Date.now();
    try {
      const result = await this.db
        .select()
        .from(eventVotes)
        .where(eq(eventVotes.eventId, eventId))
        .orderBy(eventVotes.date, eventVotes.voterName);
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'event_votes',
        Date.now() - startTime,
      );
      return result;
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'SELECT',
        'event_votes',
        Date.now() - startTime,
      );
      this.logger.error(`Failed to find votes for event ${eventId}:`, error);
      throw new DatabaseException('Failed to find event votes', error as Error);
    }
  }

  @Traceable('repository.addVotes')
  async addVotes(eventId: string, dto: CreateVoteDto): Promise<void> {
    const startTime = Date.now();
    try {
      // Validate event exists first
      const event = await this.findEventById(eventId);
      if (!event) {
        throw new ValidationException(
          `Event with ID ${eventId} does not exist`,
        );
      }

      // Get valid dates for this event
      const validDates = await this.findEventDates(eventId);
      const validDateStrings = validDates.map((d) => d.date);

      // Validate all voted dates are valid for this event
      const invalidDates = dto.votes.filter(
        (date) => !validDateStrings.includes(date),
      );
      if (invalidDates.length > 0) {
        throw new ValidationException(
          `Invalid dates for this event: ${invalidDates.join(', ')}. Valid dates are: ${validDateStrings.join(', ')}`,
        );
      }

      // Validate voter name
      if (!dto.name.trim()) {
        throw new ValidationException('Voter name cannot be empty');
      }

      // Remove existing votes for this person and event
      await this.db
        .delete(eventVotes)
        .where(
          and(
            eq(eventVotes.eventId, eventId),
            eq(eventVotes.voterName, dto.name.trim()),
          ),
        );

      // Insert new votes
      const voteValues: NewEventVote[] = dto.votes.map((date) => ({
        eventId: eventId,
        voterName: dto.name.trim(),
        date: date,
      }));

      if (voteValues.length > 0) {
        await this.db.insert(eventVotes).values(voteValues);
      }

      this.metricsService.recordDatabaseQuery(
        'INSERT',
        'event_votes',
        Date.now() - startTime,
      );
    } catch (error) {
      this.metricsService.recordDatabaseQuery(
        'INSERT',
        'event_votes',
        Date.now() - startTime,
      );
      if (error instanceof ValidationException) {
        throw error;
      }
      this.logger.error(`Failed to add votes for event ${eventId}:`, error);
      throw new DatabaseException('Failed to add votes', error as Error);
    }
  }

  @Traceable('repository.getEventWithVotes')
  async getEventWithVotes(eventId: string): Promise<any | null> {
    try {
      const event = await this.findEventById(eventId);
      if (!event) return null;

      const dates = await this.findEventDates(eventId);
      const votes = await this.findEventVotes(eventId);

      // Group votes by date
      const votesByDate = votes.reduce(
        (acc, vote) => {
          if (!acc[vote.date]) {
            acc[vote.date] = [];
          }
          acc[vote.date].push(vote.voterName);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const formattedVotes = Object.entries(votesByDate).map(
        ([date, people]) => ({
          date,
          people: [...new Set(people)], // Remove duplicates
        }),
      );

      return {
        id: event.id,
        name: event.name,
        dates: dates.map((d) => d.date),
        votes: formattedVotes,
      };
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.logger.error(`Failed to get event with votes ${eventId}:`, error);
      throw new DatabaseException(
        'Failed to get event details',
        error as Error,
      );
    }
  }

  @Traceable('repository.getEventResults')
  async getEventResults(eventId: string): Promise<any | null> {
    try {
      const event = await this.findEventById(eventId);
      if (!event) return null;

      const votes = await this.findEventVotes(eventId);

      // Count votes per date
      const voteCount = votes.reduce(
        (acc, vote) => {
          if (!acc[vote.date]) {
            acc[vote.date] = new Set();
          }
          acc[vote.date].add(vote.voterName);
          return acc;
        },
        {} as Record<string, Set<string>>,
      );

      // Find maximum vote count
      const maxVotes = Math.max(
        ...Object.values(voteCount).map((set) => set.size),
        0,
      );

      // Get dates with maximum votes (suitable for all)
      const suitableDates = Object.entries(voteCount)
        .filter(([_, peopleSet]) => peopleSet.size === maxVotes && maxVotes > 0)
        .map(([date, peopleSet]) => ({
          date,
          people: Array.from(peopleSet),
        }));

      return {
        id: event.id,
        name: event.name,
        suitableDates,
      };
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.logger.error(`Failed to get event results ${eventId}:`, error);
      throw new DatabaseException(
        'Failed to get event results',
        error as Error,
      );
    }
  }

  // Test helper methods
  async clearAllEvents(): Promise<void> {
    const startTime = Date.now();
    try {
      await this.db.delete(eventVotes);
      await this.db.delete(eventDates);
      await this.db.delete(events);

      this.metricsService.recordDatabaseQuery(
        'DELETE',
        'events',
        Date.now() - startTime,
      );
    } catch (error) {
      this.logger.error('Failed to clear all events:', error);
      throw new DatabaseException('Failed to clear events', error as Error);
    }
  }

  async findEventWithVotes(eventId: string): Promise<any> {
    return this.getEventWithVotes(eventId);
  }
}
