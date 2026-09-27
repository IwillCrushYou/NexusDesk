"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.AuthError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = require("../config");
class AuthError extends Error {
    code;
    constructor(code) {
        super(code);
        this.code = code;
    }
}
exports.AuthError = AuthError;
class AuthService {
    users;
    constructor(users) {
        this.users = users;
    }
    async signup(input) {
        const email = input.email.trim().toLowerCase();
        if (await this.users.findByEmail(email)) {
            throw new AuthError('EMAIL_EXISTS');
        }
        const data = {
            name: input.name.trim(),
            email,
            passwordHash: await bcryptjs_1.default.hash(input.password, 12),
            role: client_1.UserRole.EMPLOYEE,
        };
        const user = await this.users.create(data);
        return { user: toPublicUser(user), token: issueToken(user) };
    }
    async login(input) {
        const user = await this.users.findByEmail(input.email.trim().toLowerCase());
        if (!user || !(await bcryptjs_1.default.compare(input.password, user.passwordHash))) {
            throw new AuthError('INVALID_CREDENTIALS');
        }
        return { user: toPublicUser(user), token: issueToken(user) };
    }
    async getUser(id) {
        const user = await this.users.findById(id);
        return user ? toPublicUser(user) : null;
    }
}
exports.AuthService = AuthService;
function toPublicUser(user) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
}
function issueToken(user) {
    return jsonwebtoken_1.default.sign({ role: user.role, email: user.email }, config_1.config.jwtSecret, {
        subject: user.id,
        expiresIn: '1h',
    });
}
