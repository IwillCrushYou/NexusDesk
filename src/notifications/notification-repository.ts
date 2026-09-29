import { Notification, PrismaClient } from '@prisma/client';

export type CreateNotificationInput = {
  userId: string;
  ticketId?: string;
  message: string;
};

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  findByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  countUnread(userId: string): Promise<number>;
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateNotificationInput) {
    return this.prisma.notification.create({ data: input });
  }

  findByUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { read: false }) },
      orderBy: { createdAt: 'desc' },
      take: 50, // cap at 50 most recent
    });
  }

  async markRead(id: string, userId: string) {
    // Ensure the notification belongs to the requesting user
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
