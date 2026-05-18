import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateAppVersionDto {
  @ApiProperty({ example: '1.2.0 发布', description: '版本标题。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: '优化设备状态同步。', description: '版本说明。' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '1.2.0', description: 'Android 版本名。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  androidVersionName!: string;

  @ApiProperty({ example: '1.2.0', description: 'iOS 版本名。' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  iosVersionName!: string;

  @ApiProperty({
    example: 'https://example.com/android.apk',
    description: 'Android 下载地址。',
  })
  @IsUrl({ require_tld: false })
  androidDownloadUrl!: string;

  @ApiProperty({
    example: 'https://apps.apple.com/app/id0000000000',
    description: 'iOS 下载地址。',
  })
  @IsUrl({ require_tld: false })
  iosDownloadUrl!: string;

  @ApiProperty({ example: false, description: '是否强制更新。' })
  @IsBoolean()
  forceUpdate!: boolean;
}
