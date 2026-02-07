import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: "Jake's secret party" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['2014-01-01', '2014-01-05', '2014-01-12'],
    type: [String],
    description: 'Array of dates in YYYY-MM-DD format',
  })
  @IsArray()
  @IsDateString({}, { each: true })
  dates: string[];
}

export class CreateEventResponseDto {
  @ApiProperty()
  id: string;
}

export class EventSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class EventListResponseDto {
  @ApiProperty()
  events: EventSummaryDto[];
}

export class VoteGroupDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [String] })
  people: string[];
}

export class EventDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  dates: string[];

  @ApiProperty({ type: [VoteGroupDto] })
  votes: VoteGroupDto[];
}

export class EventResultsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [VoteGroupDto] })
  suitableDates: VoteGroupDto[];
}
