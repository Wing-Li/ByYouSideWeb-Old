import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ example: '希望增加夜间模式。', description: '反馈内容。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
