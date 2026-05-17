import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: '服务运行状态。' })
  status!: string;

  @ApiProperty({ example: 'byyouside-api', description: '服务标识。' })
  service!: string;

  @ApiProperty({
    example: '2026-05-16T15:00:00.000Z',
    description: '服务生成响应时的 ISO 时间戳。',
  })
  timestamp!: string;
}
