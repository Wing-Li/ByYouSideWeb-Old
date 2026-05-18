import { Feedback } from '@prisma/client';
import { FeedbackDto } from './dto/feedback.dto';

export function toFeedbackDto(feedback: Feedback): FeedbackDto {
  return {
    id: feedback.id.toString(),
    userId: feedback.userId.toString(),
    content: feedback.content,
    createdAt: feedback.createdAt.toISOString(),
  };
}
