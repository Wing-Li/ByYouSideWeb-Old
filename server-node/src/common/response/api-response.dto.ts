import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<TData = unknown> {
  @ApiProperty({ example: 200, description: 'Business response code.' })
  code!: number;

  @ApiProperty({ example: 'success', description: 'Response message.' })
  message!: string;

  @ApiProperty({ nullable: true, description: 'Response payload.' })
  data!: TData;
}

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: false })
  isLast!: boolean;
}

export class PaginatedApiResponseDto<
  TData = unknown[],
> extends ApiResponseDto<TData> {
  @ApiProperty({ type: PaginationDto })
  pagination!: PaginationDto;
}
