import { z } from 'zod';
import { dateString, uuidString } from './date.schema';

export const CreateEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Event name cannot be empty')
    .max(255, 'Event name cannot exceed 255 characters'),
  dates: z
    .array(dateString)
    .min(1, 'Event must have at least one date option')
    .max(10, 'Event cannot have more than 10 date options')
    .refine(
      (dates) => new Set(dates).size === dates.length,
      'Duplicate dates are not allowed',
    ),
});

export const EventSummarySchema = z.object({
  id: uuidString,
  name: z.string(),
});

export const EventListResponseSchema = z.object({
  events: z.array(EventSummarySchema),
});

export const CreateEventResponseSchema = z.object({
  id: uuidString,
});

export const VoteGroupSchema = z.object({
  date: z.string(),
  people: z.array(z.string()),
});

export const EventDetailResponseSchema = z.object({
  id: uuidString,
  name: z.string(),
  dates: z.array(z.string()),
  votes: z.array(VoteGroupSchema),
});

export const EventResultsResponseSchema = z.object({
  id: uuidString,
  name: z.string(),
  suitableDates: z.array(VoteGroupSchema),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;
export type EventListResponse = z.infer<typeof EventListResponseSchema>;
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>;
export type VoteGroup = z.infer<typeof VoteGroupSchema>;
export type EventDetailResponse = z.infer<typeof EventDetailResponseSchema>;
export type EventResultsResponse = z.infer<typeof EventResultsResponseSchema>;
