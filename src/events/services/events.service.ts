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
} from '../../core/errors/custom-exceptions';
import { CreateEventSchema, CreateVoteSchema } from '../schemas';
import { ZodError } from 'zod';
import {
  hasPastDates,
  hasUniqueDates,
  groupVotesByDate,
  countVotesByDate,
  getSuitableDates,
  validateUUIDOrThrow,
  getValidatedEvent,
  handleZodError,
  validateVoterName,
  validateVoteDates,
  prepareVoteValues,
  validateVoteSubmission,
  validateEventCreation,
} from './event.utils';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly eventsRepository: EventsRepository) {}

  async createEvent(dto: CreateEventDto): Promise<CreateEventResponseDto> {
    try {
      const validatedData = validateEventCreation(dto);
      const event = await this.eventsRepository.createEvent({
        ...validatedData,
        name: validatedData.name.trim(),
      });
      this.logger.log(`Created event: ${event.id} - ${event.name}`);
      return { id: event.id };
    } catch (error) {
      handleZodError(error);
      this.logger.error('Failed to create event', error);
      throw error;
    }
  }

  async getAllEvents(): Promise<EventListResponseDto> {
    try {
      const events = await this.eventsRepository.findAllEvents();
      return { events };
    } catch (error) {
      this.logger.error('Failed to get all events', error);
      throw error;
    }
  }

  async getEvent(id: string): Promise<EventDetailResponseDto> {
    try {
      const event = await getValidatedEvent(this.eventsRepository, id);
      const dates = await this.eventsRepository.findEventDates(id);
      const votes = await this.eventsRepository.findEventVotes(id);
      return {
        id: event.id,
        name: event.name,
        dates: dates.map((d) => d.date),
        votes: groupVotesByDate(votes),
      };
    } catch (error) {
      this.logger.error(`Failed to get event ${id}`, error);
      throw error;
    }
  }

  async addVote(
    eventId: string,
    dto: CreateVoteDto,
  ): Promise<EventDetailResponseDto> {
    try {
      const { validatedVote } = await validateVoteSubmission(
        this.eventsRepository,
        eventId,
        dto,
      );
      await this.eventsRepository.deleteVotesForUser(
        eventId,
        validatedVote.name.trim(),
      );
      const voteValues = prepareVoteValues(eventId, validatedVote);
      if (voteValues.length > 0) {
        await this.eventsRepository.insertVotes(voteValues);
      }
      this.logger.log(
        `Added votes for event ${eventId} by ${validatedVote.name}`,
      );
      return await this.getEvent(eventId);
    } catch (error) {
      handleZodError(error);
      this.logger.error(`Failed to add vote for event ${eventId}`, error);
      throw error;
    }
  }

  async getEventResults(id: string): Promise<EventResultsResponseDto> {
    try {
      const event = await getValidatedEvent(this.eventsRepository, id);
      const votes = await this.eventsRepository.findEventVotes(id);
      const voteCount = countVotesByDate(votes);
      const suitableDates = getSuitableDates(voteCount);
      return {
        id: event.id,
        name: event.name,
        suitableDates,
      };
    } catch (error) {
      this.logger.error(`Failed to get event results ${id}`, error);
      throw error;
    }
  }
}
