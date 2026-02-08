import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../../src/events/services/events.service';
import { EventsRepository } from '../../src/events/repository/events.repository';

describe('Events Unit Tests', () => {
  let service: EventsService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventsRepository,
          useValue: {
            createEvent: jest.fn(),
            findEventById: jest.fn(),
            findEventDates: jest.fn(),
            findEventVotes: jest.fn(),
            deleteVotesForUser: jest.fn(),
            insertVotes: jest.fn(),
            findAllEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get<EventsRepository>(EventsRepository);
  });

  it('should create event with valid data', async () => {
    const createEventDto = {
      name: 'Team Meeting',
      dates: ['2026-03-01', '2026-03-02'],
    };

    const mockEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Team Meeting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(repository, 'createEvent').mockResolvedValue(mockEvent);
    const result = await service.createEvent(createEventDto);

    expect(repository.createEvent).toHaveBeenCalledWith({
      name: 'Team Meeting',
      dates: ['2026-03-01', '2026-03-02'],
    });
    expect(result).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('should reject empty event name', async () => {
    const createEventDto = {
      name: '',
      dates: ['2026-03-01'],
    };

    await expect(service.createEvent(createEventDto)).rejects.toThrow(
      'Event name cannot be empty',
    );
  });

  it('should reject events with no dates', async () => {
    const createEventDto = {
      name: 'Test Event',
      dates: [],
    };

    await expect(service.createEvent(createEventDto)).rejects.toThrow(
      'Event must have at least one date option',
    );
  });

  it('should reject events with too many dates', async () => {
    const createEventDto = {
      name: 'Test Event',
      dates: Array.from(
        { length: 11 },
        (_, i) => `2026-03-${String(i + 1).padStart(2, '0')}`,
      ),
    };

    await expect(service.createEvent(createEventDto)).rejects.toThrow(
      'Event cannot have more than 10 date options',
    );
  });

  it('should add vote successfully', async () => {
    const eventId = '550e8400-e29b-41d4-a716-446655440000';
    const voteDto = {
      name: 'Alice',
      votes: ['2026-03-01'],
    };

    const mockEvent = {
      id: eventId,
      name: 'Test Event',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDates = [
      {
        id: '1',
        eventId,
        date: '2026-03-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        eventId,
        date: '2026-03-02',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockVotes = [];

    jest.spyOn(repository, 'findEventById').mockResolvedValue(mockEvent);
    jest.spyOn(repository, 'findEventDates').mockResolvedValue(mockDates);
    jest.spyOn(repository, 'findEventVotes').mockResolvedValue(mockVotes);
    jest.spyOn(repository, 'deleteVotesForUser').mockResolvedValue(undefined);
    jest.spyOn(repository, 'insertVotes').mockResolvedValue(undefined);

    await service.addVote(eventId, voteDto);

    expect(repository.findEventById).toHaveBeenCalledWith(eventId);
    expect(repository.findEventDates).toHaveBeenCalledWith(eventId);
    expect(repository.deleteVotesForUser).toHaveBeenCalledWith(
      eventId,
      'Alice',
    );
    expect(repository.insertVotes).toHaveBeenCalled();
  });

  it('should reject voting on non-existent events', async () => {
    const eventId = '550e8400-e29b-41d4-a716-446655440000';
    const voteDto = {
      name: 'Alice',
      votes: ['2026-03-01'],
    };

    jest.spyOn(repository, 'findEventById').mockResolvedValue(null);

    await expect(service.addVote(eventId, voteDto)).rejects.toThrow();
  });
});
