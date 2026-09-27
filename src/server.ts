import { createApp } from './app';
import { AuthService } from './auth/auth-service';
import { PrismaUserRepository } from './auth/user-repository';
import { config } from './config';
import { prisma } from './lib/prisma';

const auth = new AuthService(new PrismaUserRepository(prisma));
const app = createApp(auth);

const server = app.listen(config.port, () => {
  console.log(`NexusDesk API listening on port ${config.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
