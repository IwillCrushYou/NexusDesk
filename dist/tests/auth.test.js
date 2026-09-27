"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supertest_1 = __importDefault(require("supertest"));
const client_1 = require("@prisma/client");
const app_1 = require("../src/app");
const auth_service_1 = require("../src/auth/auth-service");
class InMemoryUsers {
    users = [];
    async findByEmail(email) {
        return this.users.find((user) => user.email === email) ?? null;
    }
    async findById(id) {
        return this.users.find((user) => user.id === id) ?? null;
    }
    async create(input) {
        const now = new Date();
        const user = {
            id: `user-${this.users.length + 1}`,
            name: input.name,
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role ?? client_1.UserRole.EMPLOYEE,
            createdAt: now,
            updatedAt: now,
        };
        this.users.push(user);
        return user;
    }
}
describe('authentication', () => {
    const users = new InMemoryUsers();
    const app = (0, app_1.createApp)(new auth_service_1.AuthService(users));
    it('registers a user and returns a JWT', async () => {
        const response = await (0, supertest_1.default)(app).post('/api/auth/signup').send({
            name: 'Ada Lovelace',
            email: 'ADA@example.com',
            password: 'correct-horse',
        });
        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe('ada@example.com');
        expect(response.body.user).not.toHaveProperty('passwordHash');
        expect(response.body.token).toEqual(expect.any(String));
    });
    it('rejects duplicate email and invalid credentials', async () => {
        const duplicate = await (0, supertest_1.default)(app).post('/api/auth/signup').send({
            name: 'Another Ada',
            email: 'ada@example.com',
            password: 'correct-horse',
        });
        const invalid = await (0, supertest_1.default)(app).post('/api/auth/login').send({
            email: 'ada@example.com',
            password: 'wrong-password',
        });
        expect(duplicate.status).toBe(409);
        expect(invalid.status).toBe(401);
    });
    it('protects the current-user endpoint', async () => {
        const unauthenticated = await (0, supertest_1.default)(app).get('/api/me');
        const login = await (0, supertest_1.default)(app).post('/api/auth/login').send({
            email: 'ada@example.com',
            password: 'correct-horse',
        });
        const authenticated = await (0, supertest_1.default)(app)
            .get('/api/me')
            .set('Authorization', `Bearer ${login.body.token}`);
        expect(unauthenticated.status).toBe(401);
        expect(authenticated.status).toBe(200);
        expect(authenticated.body.user.role).toBe('EMPLOYEE');
    });
});
void bcryptjs_1.default;
