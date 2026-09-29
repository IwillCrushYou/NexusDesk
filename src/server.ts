import { createApp } from './app';
import { AuthService } from './auth/auth-service';
import { PrismaUserRepository } from './auth/user-repository';
import { PrismaTicketRepository } from './tickets/ticket-repository';
import { TicketService } from './tickets/ticket-service';
import { PrismaNotificationRepository } from './notifications/notification-repository';
import { AnalyticsService } from './analytics/analytics.service';
import { SlaCheckerJob } from './jobs/sla-checker.job';
import { config } from './config';
import { prisma } from './lib/prisma';

const auth          = new AuthService(new PrismaUserRepository(prisma));
const ticketService = new TicketService(new PrismaTicketRepository(prisma));
const notifications = new PrismaNotificationRepository(prisma);
const analytics     = new AnalyticsService(prisma);
const slaChecker    = new SlaCheckerJob(prisma);

const app = createApp(auth, prisma, ticketService, notifications, analytics);

const server = app.listen(config.port, () => {
  console.log(`NexusDesk API listening on port ${config.port}`);
  slaChecker.start();
});

async function shutdown() {
  slaChecker.stop();
  server.close();
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
