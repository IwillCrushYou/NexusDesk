# NexusDesk

NexusDesk is a full-stack IT support ticketing application for managing internal support requests, agent workflows, SLA tracking, and operational analytics. It combines a React frontend with an Express API, Prisma ORM, and PostgreSQL persistence.

## Features

- Employee support ticket creation and tracking
- Agent assignment and status transitions
- Admin analytics dashboard with throughput and SLA metrics
- SLA deadline handling and breach tracking
- Ticket comments and event audit history
- Role-based authorization for employees, agents, and admins
- Notification support for ticket updates and SLA-related events
- Docker-based local environment for the app and database

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM
- Authentication: JWT + bcrypt
- Testing: Vitest + Supertest
- Local orchestration: Docker Compose

## Project Structure

```text
NexusDesk/
├── client/                  # React client app
├── prisma/                  # Prisma schema, migrations, and seed data
├── src/                     # Express API and business logic
├── tests/                   # API and workflow tests
├── .env.example             # Environment variable template
├── docker-compose.yml       # Local Docker setup
├── Dockerfile               # API container build
├── package.json             # Root app scripts and dependencies
├── render.yaml              # Platform deployment config
├── tsconfig.json            # TypeScript config
├── vitest.config.ts         # Test config
└── README.md
```

## Roles and Workflow

NexusDesk supports three roles:

- Employee: create support tickets and view their own requests
- Agent: manage assigned tickets, update status, and respond in comments
- Admin: view all tickets, manage users, and inspect analytics dashboards

The app includes a ticket lifecycle state machine and SLA configuration based on priority.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose (recommended for database and full-stack local run)
- PostgreSQL (optional if you manage the DB manually)

### 1) Install dependencies

```bash
npm install
npm --prefix client install
```

### 2) Configure environment variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Example values:

```env
DATABASE_URL=postgresql://nexusdesk_app:localpassword@localhost:5432/nexusdesk
JWT_SECRET=super-secret-key
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

If you are using the Docker Compose stack, the default values are already set in the compose file.

### 3) Start PostgreSQL

Using Docker:

```bash
docker compose up -d db
```

Then apply the Prisma schema:

```bash
npx prisma migrate dev
```

Optionally seed demo users and sample tickets:

```bash
npm run prisma:seed
```

### 4) Start the app

Start the API:

```bash
npm run dev
```

Start the frontend in another terminal:

```bash
npm --prefix client run dev
```

For the full Dockerized stack:

```bash
docker compose up --build
```

The frontend is served on port 5173 by Vite, and the API listens on port 4000 by default.

## Demo Accounts

The seed script creates sample users for testing:

- Admin: admin@nexusdesk.demo / Demo@123
- Agent: sarah@nexusdesk.demo / Demo@123
- Agent: marcus@nexusdesk.demo / Demo@123
- Employee: alex@nexusdesk.demo / Demo@123
- Employee: priya@nexusdesk.demo / Demo@123

## Available Scripts

From the root project:

```bash
npm run dev              # Start backend in watch mode
npm run build            # Generate Prisma client and compile TypeScript
npm start                # Run built server
npm test                 # Run Vitest suite
npm run prisma:generate  # Generate Prisma client
npm run prisma:seed      # Seed demo data
npm run client:dev       # Start React dev server
npm run client:build     # Build the frontend
```

## API Overview

The Express app exposes endpoints under `/api` including:

- `/api/auth/signup` — create a user account
- `/api/auth/login` — authenticate and receive a JWT
- `/api/me` — fetch the current authenticated user
- `/api/tickets` — create/list/update ticket data
- `/api/admin/users` — list application users
- `/api/admin/analytics` — fetch dashboard metrics
- `/api/notifications` — read and manage notifications

## Database and Prisma

The Prisma schema defines the core domain models:

- `User`
- `Ticket`
- `TicketEvent`
- `Comment`
- `Notification`

Common Prisma commands:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Deployment

This repository includes deployment config for Render in [render.yaml](render.yaml). The app is designed to run with PostgreSQL and environment variables set for `DATABASE_URL`, `JWT_SECRET`, and HTTP port configuration.

## Testing

Run the automated tests with:

```bash
npm test
```

Included coverage focuses on authentication flows, SLA logic, and ticket-state machine behavior.

## Notes

- The API uses CORS configuration from `CORS_ORIGIN` when defined.
- An in-memory cache is used for admin analytics to reduce repetitive expensive queries.
- The SLA checker job runs automatically when the server starts and monitors ticket deadlines.

## License

This project is licensed under the ISC license.
