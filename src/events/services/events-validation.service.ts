import { Injectable } from '@nestjs/common';
import {
  CreateEventSchema,
  CreateVoteSchema,
  EventDetailResponseSchema,
  EventResultsResponseSchema,
  EventListResponseSchema,
  CreateEventResponseSchema,
} from '../schemas';
import { ZodError } from 'zod';
import {
  ValidationException,
  BusinessLogicException,
} from '../../core/errors/custom-exceptions';

@Injectable()
export class EventsValidationService {
  /**
   * Validates event creation data using Zod
   * Provides better error messages than class-validator
   */
  validateCreateEvent(data: unknown) {
    try {
      return CreateEventSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const message = firstError.message;

        // Map Zod errors to your custom exceptions
        if (firstError.path.includes('name') || firstError.path.length === 0) {
          throw new ValidationException(message);
        }
        if (firstError.path.includes('dates')) {
          if (message.includes('10 date options')) {
            throw new BusinessLogicException(message);
          }
          throw new ValidationException(message);
        }
        throw new ValidationException(message);
      }
      throw new ValidationException('Invalid event data');
    }
  }

  /**
   * Validates vote data
   */
  validateCreateVote(data: unknown) {
    try {
      return CreateVoteSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw new ValidationException(firstError.message);
      }
      throw new ValidationException('Invalid vote data');
    }
  }

  /**
   * Validates response data before sending to client
   * Ensures API consistency
   */
  validateEventListResponse(data: unknown) {
    try {
      return EventListResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid event list response format:', error);
      throw new Error('Internal response validation failed');
    }
  }

  validateCreateEventResponse(data: unknown) {
    try {
      return CreateEventResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid create event response format:', error);
      throw new Error('Internal response validation failed');
    }
  }

  validateEventDetailResponse(data: unknown) {
    try {
      return EventDetailResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid event detail response format:', error);
      throw new Error('Internal response validation failed');
    }
  }

  validateEventResultsResponse(data: unknown) {
    try {
      return EventResultsResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid event results response format:', error);
      throw new Error('Internal response validation failed');
    }
  }

  /**
   * Business logic validation that goes beyond basic type checking
   */
  validateVoteAgainstEvent(
    voteData: { votes: string[] },
    eventData: { dates: string[] },
  ) {
    const invalidVotes = voteData.votes.filter(
      (vote) => !eventData.dates.includes(vote),
    );

    if (invalidVotes.length > 0) {
      throw new ValidationException(
        `Invalid vote dates: ${invalidVotes.join(', ')}. Must be one of the event dates.`,
      );
    }
  }

  /**
   * Cross-field validation that's difficult with decorators
   */
  validateEventDatesLogic(dates: string[]) {
    // Check for weekend bias (business logic example)
    const weekendCount = dates.filter((date) => {
      const dayOfWeek = new Date(date).getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }).length;

    if (weekendCount === dates.length && dates.length > 1) {
      console.warn(
        'Event has only weekend dates - this might affect participation',
      );
    }

    // Check for date spread (business logic example)
    if (dates.length > 1) {
      const sortedDates = dates.map((d) => new Date(d)).sort();
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      const daysDiff =
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 365) {
        throw new BusinessLogicException(
          'Event dates cannot span more than one year',
        );
      }
    }
  }
}
