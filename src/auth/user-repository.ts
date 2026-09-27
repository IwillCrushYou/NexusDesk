import { PrismaClient, User, UserRole } from '@prisma/client';

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(input: CreateUserInput) {
    return this.prisma.user.create({ data: input });
  }
}
