import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../auth/auth-middleware';
import { AuthService } from '../auth/auth-service';
import { AnalyticsService } from '../analytics/analytics.service';

export function createAdminRouter(
  auth: AuthService,
  prisma: PrismaClient,
  analytics: AnalyticsService,
): Router {
  const router = Router();

  // All admin routes require authentication + ADMIN role
  router.use(requireAuth(auth), requireRole(UserRole.ADMIN));

  // GET /api/admin/users — list all users
  router.get('/users', async (_request, response) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return response.json({ users });
    } catch {
      return response.status(500).json({ error: 'Unable to fetch users' });
    }
  });

  // GET /api/admin/analytics — aggregated dashboard stats (cached 60 s)
  router.get('/analytics', async (_request, response) => {
    try {
      const stats = await analytics.getDashboard();
      return response.json({ analytics: stats });
    } catch {
      return response.status(500).json({ error: 'Unable to compute analytics' });
    }
  });

  return router;
}
