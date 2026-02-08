import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../../src/events/services/events.service';
import { EventsRepository } from '../../src/events/repository/events.repository';
import { MetricsService } from '../../src/core/telemetry/metrics.service';
import { DATABASE_CONNECTION } from '../../src/core/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/core/database/schema';

describe('Events Integration Tests', () => {
  let service: EventsService;
  let repository: EventsRepository;
  let module: TestingModule;
  let testDb: ReturnType<typeof drizzle>;
  let connection: postgres.Sql;

  beforeAll(async () => {
    const testConnectionString =
      process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

    if (!testConnectionString) {
      throw new Error(
        'TEST_DATABASE_URL or DATABASE_URL environment variable must be set',
      );
    }

    connection = postgres(testConnectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: false,
    });

    testDb = drizzle(connection, { schema });

    module = await Test.createTestingModule({
      providers: [
        EventsService,
        EventsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: testDb,
        },
        {
          provide: MetricsService,
          useValue: {
            recordDatabaseQuery: jest.fn(),
            incrementCounter: jest.fn(),
          },
        },
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<EventsService>(EventsService);
    repository = module.get<EventsRepository>(EventsRepository);
  });

  beforeEach(async () => {
    // Clean before each test to ensure isolation
    await testDb.delete(schema.eventVotes);
    await testDb.delete(schema.eventDates);
    await testDb.delete(schema.events);
  });

  afterAll(async () => {
    await module.close();
    if (connection) {
      await connection.end();
    }
  });

  it('should create event with UUID and verify through service layer', async () => {
    const result = await service.createEvent({
      name: 'Test Event',
      dates: ['2026-03-01', '2026-03-02'],
    });

    // Verify UUID format
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);

    // Verify through service layer (not raw SQL)
    const retrievedEvent = await service.getEvent(result.id);
    expect(retrievedEvent.id).toBe(result.id);
    expect(retrievedEvent.name).toBe('Test Event');
    expect(retrievedEvent.dates).toHaveLength(2);
  });

  it('should handle complete voting workflow through service layer', async () => {
    const event = await service.createEvent({
      name: 'Meeting',
      dates: ['2026-04-01', '2026-04-02'],
    });

    await service.addVote(event.id, {
      name: 'Alice',
      votes: ['2026-04-01'],
    });

    await service.addVote(event.id, {
      name: 'Bob',
      votes: ['2026-04-01', '2026-04-02'],
    });

    // Test through service API, not raw queries
    const results = await service.getEventResults(event.id);
    expect(results.suitableDates).toHaveLength(1); // Only 2026-04-01 has 2 votes

    const topDate = results.suitableDates.find((d) => d.date === '2026-04-01');
    expect(topDate?.people).toEqual(['Alice', 'Bob']);
  });

  it('should handle error scenarios gracefully', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440999';

    // Test service-level error handling
    await expect(service.getEvent(fakeId)).rejects.toThrow();
    await expect(service.getEventResults(fakeId)).rejects.toThrow();
    await expect(
      service.addVote(fakeId, {
        name: 'Test',
        votes: ['2026-01-01'],
      }),
    ).rejects.toThrow();
  });
});
