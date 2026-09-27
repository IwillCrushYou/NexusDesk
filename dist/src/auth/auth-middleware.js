"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function requireAuth(auth) {
    return async (request, response, next) => {
        const header = request.header('authorization');
        const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
        if (!token) {
            return response.status(401).json({ error: 'Authentication required' });
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            if (typeof payload === 'string' || !payload.sub || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
                return response.status(401).json({ error: 'Invalid token' });
            }
            const user = await auth.getUser(payload.sub);
            if (!user) {
                return response.status(401).json({ error: 'User no longer exists' });
            }
            request.user = { id: user.id, role: user.role, email: user.email };
            return next();
        }
        catch {
            return response.status(401).json({ error: 'Invalid token' });
        }
    };
}
function requireRole(...roles) {
    return (request, response, next) => {
        if (!request.user || !roles.includes(request.user.role)) {
            return response.status(403).json({ error: 'Insufficient permissions' });
        }
        return next();
    };
}
