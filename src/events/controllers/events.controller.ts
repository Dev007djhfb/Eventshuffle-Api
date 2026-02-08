import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import {
  CreateEventDto,
  CreateVoteDto,
  EventListResponseDto,
  EventDetailResponseDto,
  EventResultsResponseDto,
  CreateEventResponseDto,
} from '../dto';
import { EventsService } from '../services/events.service';

@ApiTags('events')
@Controller('event')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Version('1')
  @Get('list')
  @ApiOperation({ summary: 'List all events' })
  @ApiResponse({
    status: 200,
    description: 'List of all events',
    type: EventListResponseDto,
  })
  async listEvents(): Promise<EventListResponseDto> {
    return this.eventsService.getAllEvents();
  }

  @Version('1')
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: CreateEventResponseDto,
  })
  async createEvent(
    @Body() dto: CreateEventDto,
  ): Promise<CreateEventResponseDto> {
    return this.eventsService.createEvent(dto);
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Show an event' })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    type: EventDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'string' })
  async getEvent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventDetailResponseDto> {
    return this.eventsService.getEvent(id);
  }

  @Version('1')
  @Post(':id/vote')
  @ApiOperation({ summary: 'Add votes to an event' })
  @ApiResponse({
    status: 200,
    description: 'Votes added successfully',
    type: EventDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'string' })
  async addVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVoteDto,
  ): Promise<EventDetailResponseDto> {
    return this.eventsService.addVote(id, dto);
  }

  @Version('1')
  @Get(':id/results')
  @ApiOperation({ summary: 'Show the results of an event' })
  @ApiResponse({
    status: 200,
    description: 'Event results',
    type: EventResultsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'string' })
  async getEventResults(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResultsResponseDto> {
    return this.eventsService.getEventResults(id);
  }
}
