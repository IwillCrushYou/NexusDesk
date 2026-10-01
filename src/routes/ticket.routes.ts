import { Router } from 'express';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/auth-middleware';
import { AuthService } from '../auth/auth-service';
import { TicketError, TicketService } from '../tickets/ticket-service';
import { Response } from 'express';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createTicketSchema = z.object({
  title:       z.string().trim().min(3).max(200),
  description: z.string().trim().min(10),
  priority:    z.nativeEnum(TicketPriority).optional(),
  slaDeadline: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
  autoAssign:  z.boolean().optional().default(false),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

const assignSchema = z.object({
  assigneeId: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Error → HTTP response helper
// ---------------------------------------------------------------------------

function handleTicketError(error: unknown, response: Response) {
  if (error instanceof TicketError) {
    const STATUS: Record<TicketError['code'], number> = {
      NOT_FOUND:          404,
      FORBIDDEN:          403,
      INVALID_TRANSITION: 422,
      NO_AGENTS:          409,
    };
    return response.status(STATUS[error.code]).json({ error: error.code });
  }
  console.error(error);
  return response.status(500).json({ error: 'Internal server error' });
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createTicketRouter(auth: AuthService, ticketService: TicketService): Router {
  const router = Router();

  // All ticket routes require a valid JWT
  router.use(requireAuth(auth));

  // POST /api/tickets — any authenticated user can open a ticket
  router.post('/', async (request, response) => {
    const parsed = createTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const { autoAssign, ...ticketInput } = parsed.data;
      const ticket = await ticketService.createTicket(
        request.user!,
        ticketInput,
        autoAssign,
      );
      return response.status(201).json({ ticket });
    } catch (error) {
      return handleTicketError(error, response);
    }
  });

  // GET /api/tickets?status=&priority= — scoped by role
  router.get('/', async (request, response) => {
    const status   = request.query.status   as TicketStatus   | undefined;
    const priority = request.query.priority as TicketPriority | undefined;
    try {
      const tickets = await ticketService.listTickets(request.user!, { status, priority });
      return response.json({ tickets });
    } catch (error) {
      return handleTicketError(error, response);
    }
  });

  // GET /api/tickets/:id — scoped (employees only see their own)
  router.get('/:id', async (request, response) => {
    try {
      const ticket = await ticketService.getTicket(request.user!, request.params.id);
      return response.json({ ticket });
    } catch (error) {
      return handleTicketError(error, response);
    }
  });

  // PATCH /api/tickets/:id/status — agents + admins only, state machine enforced
  router.patch(
    '/:id/status',
    requireRole(UserRole.AGENT, UserRole.ADMIN),
    async (request, response) => {
      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(400).json({ error: parsed.error.flatten() });
      }
      try {
        const ticket = await ticketService.updateStatus(
          request.user!,
          request.params.id as string,
          parsed.data.status,
        );
        return response.json({ ticket });
      } catch (error) {
        return handleTicketError(error, response);
      }
    },
  );

  // PATCH /api/tickets/:id/assign — manual assign by agents/admins
  router.patch(
    '/:id/assign',
    requireRole(UserRole.AGENT, UserRole.ADMIN),
    async (request, response) => {
      const parsed = assignSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(400).json({ error: parsed.error.flatten() });
      }
      try {
        const ticket = await ticketService.assignTicket(
          request.user!,
          request.params.id as string,
          parsed.data.assigneeId,
        );
        return response.json({ ticket });
      } catch (error) {
        return handleTicketError(error, response);
      }
    },
  );

  // PATCH /api/tickets/:id/auto-assign — assign to least-loaded agent
  router.patch(
    '/:id/auto-assign',
    requireRole(UserRole.AGENT, UserRole.ADMIN),
    async (request, response) => {
      try {
        const ticket = await ticketService.autoAssign(request.user!, request.params.id as string);
        return response.json({ ticket });
      } catch (error) {
        return handleTicketError(error, response);
      }
    },
  );

  return router;
}
