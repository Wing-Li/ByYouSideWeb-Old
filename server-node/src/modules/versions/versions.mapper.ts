import { AppVersion } from '@prisma/client';
import { AppVersionDto } from './dto/app-version.dto';

export function toAppVersionDto(version: AppVersion): AppVersionDto {
  return {
    id: version.id.toString(),
    title: version.title,
    description: version.description,
    androidVersionName: version.androidVersionName,
    iosVersionName: version.iosVersionName,
    androidDownloadUrl: version.androidDownloadUrl,
    iosDownloadUrl: version.iosDownloadUrl,
    forceUpdate: version.forceUpdate,
    releasedAt: version.releasedAt.toISOString(),
  };
}
