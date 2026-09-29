"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_service_1 = require("../auth/auth-service");
const credentialsSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).optional(),
    email: zod_1.z.string().trim().email(),
    password: zod_1.z.string().min(8),
});
function createAuthRouter(auth) {
    const router = (0, express_1.Router)();
    router.post('/signup', async (request, response) => {
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
    router.post('/login', async (request, response) => {
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
    return router;
}
