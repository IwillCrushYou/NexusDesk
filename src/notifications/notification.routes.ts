import { Router } from 'express';
import { requireAuth } from '../auth/auth-middleware';
import { AuthService } from '../auth/auth-service';
import { NotificationRepository } from './notification-repository';

export function createNotificationRouter(
  auth: AuthService,
  notifications: NotificationRepository,
): Router {
  const router = Router();
  router.use(requireAuth(auth));

  // GET /api/notifications?unread=true
  router.get('/', async (request, response) => {
    const unreadOnly = request.query.unread === 'true';
    try {
      const [items, unreadCount] = await Promise.all([
        notifications.findByUser(request.user!.id, unreadOnly),
        notifications.countUnread(request.user!.id),
      ]);
      return response.json({ notifications: items, unreadCount });
    } catch {
      return response.status(500).json({ error: 'Unable to fetch notifications' });
    }
  });

  // PATCH /api/notifications/:id/read
  router.patch('/:id/read', async (request, response) => {
    try {
      const notification = await notifications.markRead(
        request.params.id as string,
        request.user!.id,
      );
      if (!notification) {
        return response.status(404).json({ error: 'Notification not found' });
      }
      return response.json({ notification });
    } catch {
      return response.status(500).json({ error: 'Unable to update notification' });
    }
  });

  return router;
}
