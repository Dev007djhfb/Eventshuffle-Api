import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({ example: 'Dick' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['2014-01-01', '2014-01-05'],
    type: [String],
    description: 'Array of dates the person can attend',
  })
  @IsArray()
  @IsDateString({}, { each: true })
  votes: string[];
}
