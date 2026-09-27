"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
exports.config = {
    port: Number(process.env.PORT ?? 4000),
    jwtSecret: process.env.JWT_SECRET ?? 'development-only-secret',
};
