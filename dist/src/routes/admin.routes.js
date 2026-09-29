"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRouter = createAdminRouter;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/auth-middleware");
function createAdminRouter(auth, prisma, analytics) {
    const router = (0, express_1.Router)();
    // All admin routes require authentication + ADMIN role
    router.use((0, auth_middleware_1.requireAuth)(auth), (0, auth_middleware_1.requireRole)(client_1.UserRole.ADMIN));
    // GET /api/admin/users — list all users
    router.get('/users', async (_request, response) => {
        try {
            const users = await prisma.user.findMany({
                select: { id: true, name: true, email: true, role: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            });
            return response.json({ users });
        }
        catch {
            return response.status(500).json({ error: 'Unable to fetch users' });
        }
    });
    // GET /api/admin/analytics — aggregated dashboard stats (cached 60 s)
    router.get('/analytics', async (_request, response) => {
        try {
            const stats = await analytics.getDashboard();
            return response.json({ analytics: stats });
        }
        catch {
            return response.status(500).json({ error: 'Unable to compute analytics' });
        }
    });
    return router;
}
