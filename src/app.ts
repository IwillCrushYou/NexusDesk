import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth/auth-service';
import { requireAuth } from './auth/auth-middleware';
import { TicketService } from './tickets/ticket-service';
import { NotificationRepository } from './notifications/notification-repository';
import { AnalyticsService } from './analytics/analytics.service';
import { createAuthRouter } from './routes/auth.routes';
import { createAdminRouter } from './routes/admin.routes';
import { createTicketRouter } from './routes/ticket.routes';
import { createNotificationRouter } from './notifications/notification.routes';

export function createApp(
  auth: AuthService,
  prisma: PrismaClient,
  ticketService: TicketService,
  notifications: NotificationRepository,
  analytics: AnalyticsService,
) {
  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // Health check
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  // Current user (any authenticated role)
  app.get('/api/me', requireAuth(auth), (request, response) => {
    return response.json({ user: request.user });
  });

  // Routers
  app.use('/api/auth',          createAuthRouter(auth));
  app.use('/api/admin',         createAdminRouter(auth, prisma, analytics));
  app.use('/api/tickets',       createTicketRouter(auth, ticketService));
  app.use('/api/notifications', createNotificationRouter(auth, notifications));

  return app;
}
