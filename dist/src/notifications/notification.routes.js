"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRouter = createNotificationRouter;
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth-middleware");
function createNotificationRouter(auth, notifications) {
    const router = (0, express_1.Router)();
    router.use((0, auth_middleware_1.requireAuth)(auth));
    // GET /api/notifications?unread=true
    router.get('/', async (request, response) => {
        const unreadOnly = request.query.unread === 'true';
        try {
            const [items, unreadCount] = await Promise.all([
                notifications.findByUser(request.user.id, unreadOnly),
                notifications.countUnread(request.user.id),
            ]);
            return response.json({ notifications: items, unreadCount });
        }
        catch {
            return response.status(500).json({ error: 'Unable to fetch notifications' });
        }
    });
    // PATCH /api/notifications/:id/read
    router.patch('/:id/read', async (request, response) => {
        try {
            const notification = await notifications.markRead(request.params.id, request.user.id);
            if (!notification) {
                return response.status(404).json({ error: 'Notification not found' });
            }
            return response.json({ notification });
        }
        catch {
            return response.status(500).json({ error: 'Unable to update notification' });
        }
    });
    return router;
}
