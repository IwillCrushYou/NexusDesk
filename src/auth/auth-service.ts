import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { config } from '../config';
import { CreateUserInput, UserRepository } from './user-repository';

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export class AuthError extends Error {
  constructor(public readonly code: 'INVALID_CREDENTIALS' | 'EMAIL_EXISTS') {
    super(code);
  }
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async signup(input: { name: string; email: string; password: string }): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new AuthError('EMAIL_EXISTS');
    }

    const data: CreateUserInput = {
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: UserRole.EMPLOYEE,
    };
    const user = await this.users.create(data);
    return { user: toPublicUser(user), token: issueToken(user) };
  }

  async login(input: { email: string; password: string }): Promise<{ user: PublicUser; token: string }> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AuthError('INVALID_CREDENTIALS');
    }
    return { user: toPublicUser(user), token: issueToken(user) };
  }

  async getUser(id: string): Promise<PublicUser | null> {
    const user = await this.users.findById(id);
    return user ? toPublicUser(user) : null;
  }
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueToken(user: User): string {
  return jwt.sign({ role: user.role, email: user.email }, config.jwtSecret, {
    subject: user.id,
    expiresIn: '1h',
  });
}
