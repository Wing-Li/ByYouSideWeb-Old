import { Announcement } from '@prisma/client';
import { AnnouncementDto } from './dto/announcement.dto';

export function toAnnouncementDto(announcement: Announcement): AnnouncementDto {
  return {
    id: announcement.id.toString(),
    authorId: announcement.authorId.toString(),
    title: announcement.title,
    authorName: announcement.authorName,
    content: announcement.content,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  };
}
