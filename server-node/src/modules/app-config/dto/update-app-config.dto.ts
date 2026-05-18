import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppConfigDto {
  @ApiPropertyOptional({ example: '伴你左右', description: 'App 名称。' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  appName?: string;

  @ApiPropertyOptional({
    example: true,
    description: '审核模式开关。false 表示审核模式，true 表示正常模式。',
  })
  @IsOptional()
  @IsBoolean()
  unCheckMode?: boolean;
}
