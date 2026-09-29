"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaNotificationRepository = void 0;
class PrismaNotificationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(input) {
        return this.prisma.notification.create({ data: input });
    }
    findByUser(userId, unreadOnly = false) {
        return this.prisma.notification.findMany({
            where: { userId, ...(unreadOnly && { read: false }) },
            orderBy: { createdAt: 'desc' },
            take: 50, // cap at 50 most recent
        });
    }
    async markRead(id, userId) {
        // Ensure the notification belongs to the requesting user
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });
        if (!notification)
            return null;
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }
    countUnread(userId) {
        return this.prisma.notification.count({ where: { userId, read: false } });
    }
}
exports.PrismaNotificationRepository = PrismaNotificationRepository;
