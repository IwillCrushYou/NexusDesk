import { Router } from 'express';
import { z } from 'zod';
import { AuthError, AuthService } from '../auth/auth-service';

const credentialsSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export function createAuthRouter(auth: AuthService): Router {
  const router = Router();

  router.post('/signup', async (request, response) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success || !parsed.data.name) {
      return response.status(400).json({ error: 'Name, valid email, and password of at least 8 characters are required' });
    }

    try {
      return response.status(201).json(await auth.signup(parsed.data as { name: string; email: string; password: string }));
    } catch (error) {
      if (error instanceof AuthError && error.code === 'EMAIL_EXISTS') {
        return response.status(409).json({ error: 'Email is already registered' });
      }
      return response.status(500).json({ error: 'Unable to create account' });
    }
  });

  router.post('/login', async (request, response) => {
    const parsed = credentialsSchema.omit({ name: true }).safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: 'Valid email and password are required' });
    }

    try {
      return response.json(await auth.login(parsed.data));
    } catch (error) {
      if (error instanceof AuthError && error.code === 'INVALID_CREDENTIALS') {
        return response.status(401).json({ error: 'Invalid email or password' });
      }
      return response.status(500).json({ error: 'Unable to log in' });
    }
  });

  return router;
}
