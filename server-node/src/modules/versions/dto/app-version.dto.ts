import { ApiProperty } from '@nestjs/swagger';

export class AppVersionDto {
  @ApiProperty({ example: '1', description: '版本 ID。' })
  id!: string;

  @ApiProperty({ example: '1.2.0 发布', description: '版本标题。' })
  title!: string;

  @ApiProperty({ example: '优化设备状态同步。', description: '版本说明。' })
  description!: string;

  @ApiProperty({ example: '1.2.0', description: 'Android 版本名。' })
  androidVersionName!: string;

  @ApiProperty({ example: '1.2.0', description: 'iOS 版本名。' })
  iosVersionName!: string;

  @ApiProperty({
    example: 'https://example.com/android.apk',
    description: 'Android 下载地址。',
  })
  androidDownloadUrl!: string;

  @ApiProperty({
    example: 'https://apps.apple.com/app/id0000000000',
    description: 'iOS 下载地址。',
  })
  iosDownloadUrl!: string;

  @ApiProperty({ example: false, description: '是否强制更新。' })
  forceUpdate!: boolean;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '发布时间。',
  })
  releasedAt!: string;
}
