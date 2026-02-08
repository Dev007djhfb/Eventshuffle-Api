import {
  ValidationException,
  ResourceNotFoundException,
} from '../../core/errors/custom-exceptions';
import { ZodError } from 'zod';
import { CreateVoteSchema, CreateEventSchema } from '../schemas';

export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
}

export function validateUUIDOrThrow(id: string) {
  if (!isValidUUID(id))
    throw new ValidationException('Event ID must be a valid UUID format');
}

export async function getValidatedEvent(repo: any, id: string) {
  validateUUIDOrThrow(id);
  const event = await repo.findEventById(id);
  if (!event) throw new ResourceNotFoundException('Event', id);
  return event;
}

export function handleZodError(error: unknown) {
  if (error instanceof ZodError)
    throw new ValidationException(error.issues[0].message);
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function hasPastDates(dates: string[]): string[] {
  const today = getTodayISO();
  return dates.filter((date) => date < today);
}

export function hasUniqueDates(dates: string[]): boolean {
  return new Set(dates).size === dates.length;
}

export function groupVotesByDate(
  votes: { date: string; voterName: string }[],
): { date: string; people: string[] }[] {
  const votesByDate: Record<string, string[]> = {};
  for (const vote of votes) {
    if (!votesByDate[vote.date]) votesByDate[vote.date] = [];
    votesByDate[vote.date].push(vote.voterName);
  }
  return Object.entries(votesByDate).map(([date, people]) => ({
    date,
    people: [...new Set(people)],
  }));
}

export function countVotesByDate(
  votes: { date: string; voterName: string }[],
): Record<string, Set<string>> {
  const voteCount: Record<string, Set<string>> = {};
  for (const vote of votes) {
    if (!voteCount[vote.date]) voteCount[vote.date] = new Set();
    voteCount[vote.date].add(vote.voterName);
  }
  return voteCount;
}

export function getSuitableDates(
  voteCount: Record<string, Set<string>>,
): { date: string; people: string[] }[] {
  const maxVotes = Math.max(
    ...Object.values(voteCount).map((set) => set.size),
    0,
  );
  return Object.entries(voteCount)
    .filter(([_, peopleSet]) => peopleSet.size === maxVotes && maxVotes > 0)
    .map(([date, peopleSet]) => ({ date, people: Array.from(peopleSet) }));
}

export function validateVoterName(name: string) {
  if (!name.trim()) {
    throw new ValidationException('Voter name cannot be empty');
  }
}

export function validateVoteDates(votes: string[], validDates: string[]) {
  const invalidDates = votes.filter(
    (voteDate) => !validDates.includes(voteDate),
  );
  if (invalidDates.length > 0) {
    throw new ValidationException(
      `Invalid vote dates: ${invalidDates.join(', ')}. Must vote on event dates only.`,
    );
  }
}

export function prepareVoteValues(
  eventId: string,
  vote: { name: string; votes: string[] },
) {
  return vote.votes.map((date) => ({
    eventId,
    voterName: vote.name.trim(),
    date,
  }));
}

export async function validateVoteSubmission(
  repo: any,
  eventId: string,
  dto: any,
) {
  validateUUIDOrThrow(eventId);
  const validatedVote = CreateVoteSchema.parse(dto);
  validateVoterName(validatedVote.name);
  const event = await getValidatedEvent(repo, eventId);
  const eventDates = await repo.findEventDates(eventId);
  validateVoteDates(
    validatedVote.votes,
    eventDates.map((d) => d.date),
  );
  return { event, validatedVote, eventDates };
}

export function validateEventCreation(dto: any) {
  const validatedData = CreateEventSchema.parse(dto);
  const pastDates = hasPastDates(validatedData.dates);
  if (pastDates.length > 0) {
    throw new ValidationException(
      `Cannot create event with past dates: ${pastDates.join(', ')}`,
    );
  }
  if (!hasUniqueDates(validatedData.dates)) {
    throw new ValidationException('Event dates must be unique');
  }
  return validatedData;
}
