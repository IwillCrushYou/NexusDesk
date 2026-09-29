"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const auth_service_1 = require("./auth/auth-service");
const user_repository_1 = require("./auth/user-repository");
const ticket_repository_1 = require("./tickets/ticket-repository");
const ticket_service_1 = require("./tickets/ticket-service");
const notification_repository_1 = require("./notifications/notification-repository");
const analytics_service_1 = require("./analytics/analytics.service");
const sla_checker_job_1 = require("./jobs/sla-checker.job");
const config_1 = require("./config");
const prisma_1 = require("./lib/prisma");
const auth = new auth_service_1.AuthService(new user_repository_1.PrismaUserRepository(prisma_1.prisma));
const ticketService = new ticket_service_1.TicketService(new ticket_repository_1.PrismaTicketRepository(prisma_1.prisma));
const notifications = new notification_repository_1.PrismaNotificationRepository(prisma_1.prisma);
const analytics = new analytics_service_1.AnalyticsService(prisma_1.prisma);
const slaChecker = new sla_checker_job_1.SlaCheckerJob(prisma_1.prisma);
const app = (0, app_1.createApp)(auth, prisma_1.prisma, ticketService, notifications, analytics);
const server = app.listen(config_1.config.port, () => {
    console.log(`NexusDesk API listening on port ${config_1.config.port}`);
    slaChecker.start();
});
async function shutdown() {
    slaChecker.stop();
    server.close();
    await prisma_1.prisma.$disconnect();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
