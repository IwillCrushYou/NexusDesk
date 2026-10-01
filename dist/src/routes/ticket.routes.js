"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicketRouter = createTicketRouter;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const auth_middleware_1 = require("../auth/auth-middleware");
const ticket_service_1 = require("../tickets/ticket-service");
// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const createTicketSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(200),
    description: zod_1.z.string().trim().min(10),
    priority: zod_1.z.nativeEnum(client_1.TicketPriority).optional(),
    slaDeadline: zod_1.z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
    autoAssign: zod_1.z.boolean().optional().default(false),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TicketStatus),
});
const assignSchema = zod_1.z.object({
    assigneeId: zod_1.z.string().nullable(),
});
// ---------------------------------------------------------------------------
// Error → HTTP response helper
// ---------------------------------------------------------------------------
function handleTicketError(error, response) {
    if (error instanceof ticket_service_1.TicketError) {
        const STATUS = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
            INVALID_TRANSITION: 422,
            NO_AGENTS: 409,
        };
        return response.status(STATUS[error.code]).json({ error: error.code });
    }
    console.error(error);
    return response.status(500).json({ error: 'Internal server error' });
}
// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------
function createTicketRouter(auth, ticketService) {
    const router = (0, express_1.Router)();
    // All ticket routes require a valid JWT
    router.use((0, auth_middleware_1.requireAuth)(auth));
    // POST /api/tickets — any authenticated user can open a ticket
    router.post('/', async (request, response) => {
        const parsed = createTicketSchema.safeParse(request.body);
        if (!parsed.success) {
            return response.status(400).json({ error: parsed.error.flatten() });
        }
        try {
            const { autoAssign, ...ticketInput } = parsed.data;
            const ticket = await ticketService.createTicket(request.user, ticketInput, autoAssign);
            return response.status(201).json({ ticket });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    // GET /api/tickets?status=&priority= — scoped by role
    router.get('/', async (request, response) => {
        const status = request.query.status;
        const priority = request.query.priority;
        try {
            const tickets = await ticketService.listTickets(request.user, { status, priority });
            return response.json({ tickets });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    // GET /api/tickets/:id — scoped (employees only see their own)
    router.get('/:id', async (request, response) => {
        try {
            const ticket = await ticketService.getTicket(request.user, request.params.id);
            return response.json({ ticket });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    // PATCH /api/tickets/:id/status — agents + admins only, state machine enforced
    router.patch('/:id/status', (0, auth_middleware_1.requireRole)(client_1.UserRole.AGENT, client_1.UserRole.ADMIN), async (request, response) => {
        const parsed = updateStatusSchema.safeParse(request.body);
        if (!parsed.success) {
            return response.status(400).json({ error: parsed.error.flatten() });
        }
        try {
            const ticket = await ticketService.updateStatus(request.user, request.params.id, parsed.data.status);
            return response.json({ ticket });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    // PATCH /api/tickets/:id/assign — manual assign by agents/admins
    router.patch('/:id/assign', (0, auth_middleware_1.requireRole)(client_1.UserRole.AGENT, client_1.UserRole.ADMIN), async (request, response) => {
        const parsed = assignSchema.safeParse(request.body);
        if (!parsed.success) {
            return response.status(400).json({ error: parsed.error.flatten() });
        }
        try {
            const ticket = await ticketService.assignTicket(request.user, request.params.id, parsed.data.assigneeId);
            return response.json({ ticket });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    // PATCH /api/tickets/:id/auto-assign — assign to least-loaded agent
    router.patch('/:id/auto-assign', (0, auth_middleware_1.requireRole)(client_1.UserRole.AGENT, client_1.UserRole.ADMIN), async (request, response) => {
        try {
            const ticket = await ticketService.autoAssign(request.user, request.params.id);
            return response.json({ ticket });
        }
        catch (error) {
            return handleTicketError(error, response);
        }
    });
    return router;
}
