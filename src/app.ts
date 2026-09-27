import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { z } from 'zod';
import { AuthError, AuthService } from './auth/auth-service';
import { requireAuth } from './auth/auth-middleware';

const credentialsSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export function createApp(auth: AuthService) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/auth/signup', async (request, response) => {
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

  app.post('/api/auth/login', async (request, response) => {
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

  app.get('/api/me', requireAuth(auth), async (request, response) => {
    return response.json({ user: request.user });
  });

  return app;
}
