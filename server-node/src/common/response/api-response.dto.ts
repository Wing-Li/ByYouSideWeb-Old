import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<TData = unknown> {
  @ApiProperty({ example: 200, description: '业务响应码。' })
  code!: number;

  @ApiProperty({ example: 'success', description: '响应消息。' })
  message!: string;

  @ApiProperty({ nullable: true, description: '响应数据。' })
  data!: TData;
}

export class PaginationDto {
  @ApiProperty({ example: 1, description: '当前页码。' })
  page!: number;

  @ApiProperty({ example: 20, description: '每页数量。' })
  pageSize!: number;

  @ApiProperty({ example: 100, description: '总记录数。' })
  total!: number;

  @ApiProperty({ example: 5, description: '总页数。' })
  totalPages!: number;

  @ApiProperty({ example: false, description: '是否为最后一页。' })
  isLast!: boolean;
}

export class PaginatedApiResponseDto<
  TData = unknown[],
> extends ApiResponseDto<TData> {
  @ApiProperty({ type: PaginationDto })
  pagination!: PaginationDto;
}
