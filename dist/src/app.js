"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const auth_middleware_1 = require("./auth/auth-middleware");
const auth_routes_1 = require("./routes/auth.routes");
const admin_routes_1 = require("./routes/admin.routes");
const ticket_routes_1 = require("./routes/ticket.routes");
const notification_routes_1 = require("./notifications/notification.routes");
function createApp(auth, prisma, ticketService, notifications, analytics) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    }));
    app.use((0, morgan_1.default)('dev'));
    app.use(express_1.default.json());
    // Health check
    app.get('/health', (_request, response) => response.json({ status: 'ok' }));
    // Current user (any authenticated role)
    app.get('/api/me', (0, auth_middleware_1.requireAuth)(auth), (request, response) => {
        return response.json({ user: request.user });
    });
    // Routers
    app.use('/api/auth', (0, auth_routes_1.createAuthRouter)(auth));
    app.use('/api/admin', (0, admin_routes_1.createAdminRouter)(auth, prisma, analytics));
    app.use('/api/tickets', (0, ticket_routes_1.createTicketRouter)(auth, ticketService));
    app.use('/api/notifications', (0, notification_routes_1.createNotificationRouter)(auth, notifications));
    return app;
}
