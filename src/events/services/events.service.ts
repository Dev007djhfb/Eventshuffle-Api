import { Injectable, Logger } from '@nestjs/common';
import {
  CreateEventDto,
  CreateVoteDto,
  EventListResponseDto,
  EventDetailResponseDto,
  EventResultsResponseDto,
  CreateEventResponseDto,
} from '../dto';
import { EventsRepository } from '../repository/events.repository';
import {
  ResourceNotFoundException,
  ValidationException,
  BusinessLogicException,
} from '../../core/errors/custom-exceptions';
import { EventsValidationService } from './events-validation.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventsValidationService: EventsValidationService,
  ) {}

  async createEvent(dto: CreateEventDto): Promise<CreateEventResponseDto> {
    try {
      // Use Zod for comprehensive validation
      const validatedData =
        this.eventsValidationService.validateCreateEvent(dto);

      // Additional business logic validation
      this.eventsValidationService.validateEventDatesLogic(validatedData.dates);

      const event = await this.eventsRepository.createEvent({
        ...validatedData,
        name: validatedData.name.trim(),
      });

      const response = { id: event.id };

      // Validate response before returning
      this.eventsValidationService.validateCreateEventResponse(response);

      this.logger.log(`Created event: ${event.id} - ${event.name}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to create event: ${dto.name}`, error);
      throw error; // Re-throw to be handled by global filter
    }
  }

  async listEvents(): Promise<EventListResponseDto> {
    try {
      const events = await this.eventsRepository.findAllEvents();
      const response = {
        events: events.map((event) => ({
          id: event.id,
          name: event.name,
        })),
      };

      // Validate response structure
      this.eventsValidationService.validateEventListResponse(response);

      return response;
    } catch (error) {
      this.logger.error('Failed to list events', error);
      throw error;
    }
  }

  async getEvent(id: string): Promise<EventDetailResponseDto> {
    try {
      const eventData = await this.eventsRepository.getEventWithVotes(id);
      if (!eventData) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Validate response structure
      this.eventsValidationService.validateEventDetailResponse(eventData);

      return eventData;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get event ${id}`, error);
      throw error;
    }
  }

  async addVote(
    eventId: string,
    dto: CreateVoteDto,
  ): Promise<EventDetailResponseDto> {
    try {
      // Validate vote data with Zod
      const validatedVote =
        this.eventsValidationService.validateCreateVote(dto);

      // Check if event exists and get its dates
      const existingEventWithDates =
        await this.eventsRepository.getEventWithVotes(eventId);
      if (!existingEventWithDates) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Validate vote against event dates
      this.eventsValidationService.validateVoteAgainstEvent(validatedVote, {
        dates: existingEventWithDates.dates,
      });

      await this.eventsRepository.addVotes(eventId, validatedVote);

      this.logger.log(
        `Added votes for event ${eventId} by ${validatedVote.name}`,
      );

      // Return updated event details
      const response = await this.getEvent(eventId);

      // Validate response
      this.eventsValidationService.validateEventDetailResponse(response);

      return response;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      this.logger.error(`Failed to add vote for event ${eventId}`, error);
      throw error;
    }
  }

  async getEventResults(id: string): Promise<EventResultsResponseDto> {
    try {
      const results = await this.eventsRepository.getEventResults(id);
      if (!results) {
        throw new ResourceNotFoundException('Event', id);
      }

      // Validate response structure
      this.eventsValidationService.validateEventResultsResponse(results);

      return results;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get event results ${id}`, error);
      throw error;
    }
  }

  // Private validation methods for testing
  private validateDates(dates: string[]): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const invalidDates = dates.filter((date) => !dateRegex.test(date));

    if (invalidDates.length > 0) {
      throw new ValidationException(
        `Invalid date format: ${invalidDates.join(', ')}. Use YYYY-MM-DD format.`,
      );
    }
  }

  private validateNotPastDates(dates: string[]): void {
    const today = new Date().toISOString().split('T')[0];
    const pastDates = dates.filter((date) => date < today);

    if (pastDates.length > 0) {
      throw new BusinessLogicException(
        `Cannot create event with past dates: ${pastDates.join(', ')}`,
      );
    }
  }

  private validateNoDuplicates(dates: string[]): void {
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length !== dates.length) {
      throw new BusinessLogicException('Event dates must be unique');
    }
  }
}
