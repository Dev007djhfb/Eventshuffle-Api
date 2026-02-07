import { z } from 'zod';

// Date validation helpers (reused from event schema)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (dateStr: string): boolean => {
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

const isPastDate = (dateStr: string): boolean => {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
  return inputDate < today;
};

// Custom Zod date validator
const dateString = z
  .string()
  .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  .refine(isValidDate, 'Invalid date')
  .refine((date) => !isPastDate(date), 'Date cannot be in the past');

// Vote Schemas
export const CreateVoteSchema = z.object({
  name: z
    .string()
    .min(1, 'Participant name cannot be empty')
    .max(255, 'Participant name cannot exceed 255 characters')
    .trim(),
  votes: z.array(dateString).min(1, 'Must vote for at least one date'),
});

// Type inference from schemas
export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;
