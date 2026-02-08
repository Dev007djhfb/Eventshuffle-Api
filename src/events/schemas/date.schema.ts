import { z } from 'zod';

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const isValidDate = (dateStr: string): boolean => {
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isPastDate = (dateStr: string): boolean => {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
};

export const dateString = z
  .string()
  .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  .refine(isValidDate, 'Invalid date')
  .refine((date) => !isPastDate(date), 'Date cannot be in the past');

export const uuidString = z.string().uuid('Invalid UUID format');
