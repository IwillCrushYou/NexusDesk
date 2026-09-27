"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const app_1 = require("./app");
const auth_service_1 = require("./auth/auth-service");
const user_repository_1 = require("./auth/user-repository");
const config_1 = require("./config");
const prisma = new client_1.PrismaClient();
const auth = new auth_service_1.AuthService(new user_repository_1.PrismaUserRepository(prisma));
const app = (0, app_1.createApp)(auth);
const server = app.listen(config_1.config.port, () => {
    console.log(`NexusDesk API listening on port ${config_1.config.port}`);
});
async function shutdown() {
    server.close();
    await prisma.$disconnect();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
