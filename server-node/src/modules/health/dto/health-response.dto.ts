import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'byyouside-api' })
  service!: string;

  @ApiProperty({ example: '2026-05-16T15:00:00.000Z' })
  timestamp!: string;
}
