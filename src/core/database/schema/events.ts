import {
  pgTable,
  serial,
  varchar,
  timestamp,
  date,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const events = pgTable('events', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const eventDates = pgTable('event_dates', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventVotes = pgTable('event_votes', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  voterName: varchar('voter_name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  dates: many(eventDates),
  votes: many(eventVotes),
}));

export const eventDatesRelations = relations(eventDates, ({ one }) => ({
  event: one(events, {
    fields: [eventDates.eventId],
    references: [events.id],
  }),
}));

export const eventVotesRelations = relations(eventVotes, ({ one }) => ({
  event: one(events, {
    fields: [eventVotes.eventId],
    references: [events.id],
  }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventDate = typeof eventDates.$inferSelect;
export type NewEventDate = typeof eventDates.$inferInsert;
export type EventVote = typeof eventVotes.$inferSelect;
export type NewEventVote = typeof eventVotes.$inferInsert;
