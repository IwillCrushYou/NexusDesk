"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_service_1 = require("./auth/auth-service");
const auth_middleware_1 = require("./auth/auth-middleware");
const credentialsSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).optional(),
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().min(8),
});
function createApp(auth) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get('/health', (_request, response) => response.json({ status: 'ok' }));
    app.post('/api/auth/signup', async (request, response) => {
        const parsed = credentialsSchema.safeParse(request.body);
        if (!parsed.success || !parsed.data.name) {
            return response.status(400).json({ error: 'Name, valid email, and password of at least 8 characters are required' });
        }
        try {
            return response.status(201).json(await auth.signup(parsed.data));
        }
        catch (error) {
            if (error instanceof auth_service_1.AuthError && error.code === 'EMAIL_EXISTS') {
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
        }
        catch (error) {
            if (error instanceof auth_service_1.AuthError && error.code === 'INVALID_CREDENTIALS') {
                return response.status(401).json({ error: 'Invalid email or password' });
            }
            return response.status(500).json({ error: 'Unable to log in' });
        }
    });
    app.get('/api/me', (0, auth_middleware_1.requireAuth)(auth), async (request, response) => {
        return response.json({ user: request.user });
    });
    return app;
}
