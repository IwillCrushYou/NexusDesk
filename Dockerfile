# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://localhost:5432/nexusdesk

# Copy package and lock file
COPY package*.json ./

# Install all dependencies (including dev deps for TS/Prisma)
RUN npm ci

# Copy source code and Prisma schema
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma client and build TS code
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled output and prisma schema from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Prisma client gets generated into node_modules, we need to generate it again for the prod env,
# OR copy node_modules. It's safer to just run generate again if we have the schema.
# Since we didn't install prisma CLI in prod dependencies, copying the generated client is better.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose API port
EXPOSE 4000

# Start command
CMD ["npm", "start"]
