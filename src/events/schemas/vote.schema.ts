import { z } from 'zod';
import { dateString } from './date.schema';

export const CreateVoteSchema = z.object({
  name: z
    .string()
    .min(1, 'Participant name cannot be empty')
    .max(255, 'Participant name cannot exceed 255 characters')
    .trim(),
  votes: z.array(dateString).min(1, 'Must vote for at least one date'),
});

export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;
