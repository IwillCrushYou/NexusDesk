"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
}
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    // ── Clean existing data ──────────────────────────────────────────────
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.ticketEvent.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️  Cleared existing data.\n');
    // ── Helper: hash password ────────────────────────────────────────────
    const hash = (pw) => bcryptjs_1.default.hashSync(pw, 12);
    const PASSWORD = 'Password123!'; // Consistent password for all accounts
    // ── Seed Users ───────────────────────────────────────────────────────
    // Primary Showcase Personas (Featured on Landing Page & 1-Click Demo)
    const diana = await prisma.user.upsert({
        where: { email: 'diana.admin@nexusdesk.local' },
        update: {},
        create: {
            name: 'Diana Prince',
            email: 'diana.admin@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'ADMIN',
        },
    });
    const charlie = await prisma.user.upsert({
        where: { email: 'charlie.agent@nexusdesk.local' },
        update: {},
        create: {
            name: 'Charlie Agent',
            email: 'charlie.agent@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'AGENT',
        },
    });
    const alice = await prisma.user.upsert({
        where: { email: 'alice.emp@nexusdesk.local' },
        update: {},
        create: {
            name: 'Alice Martin',
            email: 'alice.emp@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'EMPLOYEE',
        },
    });
    // Supporting Team Members (For Multi-agent Distribution & Reports)
    const sarah = await prisma.user.upsert({
        where: { email: 'sarah.agent@nexusdesk.local' },
        update: {},
        create: {
            name: 'Sarah Chen',
            email: 'sarah.agent@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'AGENT',
        },
    });
    const marcus = await prisma.user.upsert({
        where: { email: 'marcus.agent@nexusdesk.local' },
        update: {},
        create: {
            name: 'Marcus Johnson',
            email: 'marcus.agent@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'AGENT',
        },
    });
    const alex = await prisma.user.upsert({
        where: { email: 'alex.emp@nexusdesk.local' },
        update: {},
        create: {
            name: 'Alex Rivera',
            email: 'alex.emp@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'EMPLOYEE',
        },
    });
    const priya = await prisma.user.upsert({
        where: { email: 'priya.emp@nexusdesk.local' },
        update: {},
        create: {
            name: 'Priya Sharma',
            email: 'priya.emp@nexusdesk.local',
            passwordHash: hash(PASSWORD),
            role: 'EMPLOYEE',
        },
    });
    console.log('👤 Seeded 7 consistent users (Diana, Charlie, Alice, Sarah, Marcus, Alex, Priya).');
    // ── Helper: stagger dates over the past 5 days ──────────────────────
    const now = new Date();
    const daysAgo = (d, hoursOffset = 0) => {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(date.getHours() + hoursOffset);
        return date;
    };
    // ── Helper: SLA deadline based on priority ───────────────────────────
    const slaHours = {
        CRITICAL: 4,
        HIGH: 24,
        MEDIUM: 48,
        LOW: 72,
    };
    const slaDeadline = (createdAt, priority) => {
        const deadline = new Date(createdAt);
        deadline.setHours(deadline.getHours() + (slaHours[priority] ?? 48));
        return deadline;
    };
    const ticketDefs = [
        // 1. Matches Landing Page Row 1 (Alice & Charlie)
        {
            title: 'VPN Gateway authentication error across EU-West',
            description: 'VPN disconnects every 15-20 minutes during active use. Client logs show handshake timeouts against eu-west gateway. Affecting remote access to deployment tools.',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            createdById: alice.id,
            assignedToId: charlie.id,
            createdAt: daysAgo(1, 2),
            comments: [
                {
                    body: `Reproduced the issue on the cluster firewall. The tunnel MTU configuration is mismatched after last night's gateway firmware update. Working on an updated routing profile now.`,
                    authorId: charlie.id,
                },
                {
                    body: `Thanks Charlie! In the meantime I'm routing non-critical traffic through the temporary staging tunnel.`,
                    authorId: alice.id,
                },
            ],
        },
        // 2. Matches Landing Page Row 2 (Alex, Unassigned)
        {
            title: 'Provision Docker & Kubernetes access for data science',
            description: 'Need cluster RBAC roles and container registry pull secrets for the new customer churn ML pipeline. Project repository is already approved in GitLab.',
            status: 'OPEN',
            priority: 'HIGH',
            createdById: alex.id,
            createdAt: daysAgo(0, 3),
            comments: [],
        },
        // 3. Matches Landing Page Row 3 (Alice & Charlie, Resolved)
        {
            title: 'Hardware security key (Yubikey 5C) replacement',
            description: 'USB-C connector on existing Yubikey is bent and fails intermittent FIDO2 challenge prompts on Okta. Requesting a replacement key.',
            status: 'RESOLVED',
            priority: 'MEDIUM',
            createdById: alice.id,
            assignedToId: charlie.id,
            resolvedAt: daysAgo(1, 8),
            createdAt: daysAgo(2, 4),
            comments: [
                {
                    body: `New Yubikey 5C NFC has been enrolled in the security vault. It is ready for pickup at IT Dispatch Desk B, or can be dispatched via internal mail.`,
                    authorId: charlie.id,
                },
                {
                    body: `Picked it up and registered my secondary security keys. Working perfectly, thanks!`,
                    authorId: alice.id,
                },
            ],
        },
        // 4. Laptop overheating (Priya & Marcus, SLA Breached demonstration)
        {
            title: 'Laptop overheating and shutting down during builds',
            description: 'Dell Latitude 5540 shuts down unexpectedly after 30-40 minutes of heavy compile workloads. Fan runs continuously at max RPM. Asset Tag: DL-5540-0892.',
            status: 'RESOLVED',
            priority: 'CRITICAL',
            createdById: priya.id,
            assignedToId: marcus.id,
            resolvedAt: daysAgo(0, -2),
            slaBreached: true,
            createdAt: daysAgo(3, 7),
            comments: [
                {
                    body: 'Opened unit: thermal paste was completely degraded and intake vents were obstructed. Cleaned vents, reapplied Noctua paste, and ran thermal stress benchmark.',
                    authorId: marcus.id,
                },
                {
                    body: 'Stress benchmark completed with max temps under 78C. Took longer than normal due to awaiting heatsink replacement parts from Dell logistics.',
                    authorId: marcus.id,
                },
            ],
        },
        // 5. Shared drive permission error (Alex & Marcus)
        {
            title: 'Cannot access shared drive S:\\',
            description: 'Receiving "Access Denied" when attempting to open \\\\nas-prod01\\engineering. Was working normally yesterday. Permissions seem removed.',
            status: 'RESOLVED',
            priority: 'HIGH',
            createdById: alex.id,
            assignedToId: marcus.id,
            resolvedAt: daysAgo(2, 3),
            createdAt: daysAgo(3, 8),
            comments: [
                {
                    body: `Active Directory synchronization job dropped temporary project group memberships last night. I've restored the group mapping. Please log out and reconnect.`,
                    authorId: marcus.id,
                },
                {
                    body: 'Drive remapped and accessible. Appreciate the fast turnaround Marcus!',
                    authorId: alex.id,
                },
            ],
        },
        // 6. Mobile Exchange calendar sync (Priya & Sarah)
        {
            title: 'Outlook calendar sync not updating on iOS',
            description: 'Calendar entries created on mobile do not sync to macOS Outlook app and vice versa. Exchange account shows connected status but changes stall in queue.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            createdById: priya.id,
            assignedToId: sarah.id,
            createdAt: daysAgo(1, 5),
            comments: [
                {
                    body: `Identified a corrupt partnership sync token in Exchange ActiveSync profile. Resetting the device sync partnership on the Exchange server now.`,
                    authorId: sarah.id,
                },
            ],
        },
        // 7. Monitor request (Alice, Unassigned in Open queue)
        {
            title: 'Request secondary 27" 4K monitor for workstation',
            description: 'Current 22" 1080p display has dead pixel clusters and lacks USB-C Power Delivery. Requesting standard engineering display upgrade for multi-window development.',
            status: 'OPEN',
            priority: 'LOW',
            createdById: alice.id,
            createdAt: daysAgo(2, 1),
            comments: [],
        },
        // 8. New employee onboard setup (Priya & Sarah)
        {
            title: 'Set up new employee workstation - Platform Engineering',
            description: 'New Site Reliability Engineer joining next week. Standard equipment: M3 Pro MacBook, dual 4K monitors, Yubikey, and base engineering profiles.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            createdById: priya.id,
            assignedToId: sarah.id,
            createdAt: daysAgo(0, 6),
            comments: [
                {
                    body: 'Hardware assigned from inventory. MDM enrollment profile pushed with baseline developer tooling and security agents.',
                    authorId: sarah.id,
                },
            ],
        },
        // 9. Figma license renewal (Alex, Unassigned)
        {
            title: 'Software license renewal - Figma Enterprise seat',
            description: 'Annual license for Figma Organization seat expires at the end of the month. Manager approval PO already attached.',
            status: 'OPEN',
            priority: 'LOW',
            createdById: alex.id,
            createdAt: daysAgo(0, 8),
            comments: [],
        },
        // 10. Legacy CRM password reset (Alice & Charlie, Closed)
        {
            title: 'Password reset for legacy CRM billing portal',
            description: 'Self-service password reset email for billing portal is blocked by corporate spam filter. Need manual admin credential reset.',
            status: 'CLOSED',
            priority: 'HIGH',
            createdById: alice.id,
            assignedToId: charlie.id,
            resolvedAt: daysAgo(2, 6),
            createdAt: daysAgo(3, 2),
            comments: [
                {
                    body: `Temporary credential generated and sent via encrypted keybase message. I have also added the billing portal SMTP relay IP to our spam filter whitelist.`,
                    authorId: charlie.id,
                },
            ],
        },
    ];
    // ── Create tickets, events, comments, and notifications ──────────────
    let ticketCount = 0;
    let eventCount = 0;
    let commentCount = 0;
    let notificationCount = 0;
    for (const def of ticketDefs) {
        const createdAt = def.createdAt;
        const deadline = slaDeadline(createdAt, def.priority);
        const ticket = await prisma.ticket.create({
            data: {
                title: def.title,
                description: def.description,
                status: def.status,
                priority: def.priority,
                slaDeadline: deadline,
                slaBreached: def.slaBreached ?? false,
                resolvedAt: def.resolvedAt ?? null,
                createdAt,
                updatedAt: def.resolvedAt ?? createdAt,
                createdById: def.createdById,
                assignedToId: def.assignedToId ?? null,
            },
        });
        ticketCount++;
        // ── CREATED event ──────────────────────────────────────────────
        await prisma.ticketEvent.create({
            data: {
                action: 'CREATED',
                oldValue: null,
                newValue: def.status,
                timestamp: createdAt,
                ticketId: ticket.id,
                actorId: def.createdById,
            },
        });
        eventCount++;
        // ── ASSIGNED event ─────────────────────────────────────────────
        if (def.assignedToId) {
            const assignedAt = new Date(createdAt);
            assignedAt.setMinutes(assignedAt.getMinutes() + 15);
            await prisma.ticketEvent.create({
                data: {
                    action: 'ASSIGNED',
                    oldValue: null,
                    newValue: def.assignedToId,
                    timestamp: assignedAt,
                    ticketId: ticket.id,
                    actorId: diana.id,
                },
            });
            eventCount++;
        }
        // ── STATUS_CHANGED events ──────────────────────────────────────
        if (def.status !== 'OPEN') {
            // Transition to IN_PROGRESS
            const inProgressAt = new Date(createdAt);
            inProgressAt.setMinutes(inProgressAt.getMinutes() + 30);
            await prisma.ticketEvent.create({
                data: {
                    action: 'STATUS_CHANGED',
                    oldValue: 'OPEN',
                    newValue: 'IN_PROGRESS',
                    timestamp: inProgressAt,
                    ticketId: ticket.id,
                    actorId: def.assignedToId ?? diana.id,
                },
            });
            eventCount++;
            // Transition to RESOLVED
            if (def.status === 'RESOLVED' || def.status === 'CLOSED') {
                await prisma.ticketEvent.create({
                    data: {
                        action: 'STATUS_CHANGED',
                        oldValue: 'IN_PROGRESS',
                        newValue: 'RESOLVED',
                        timestamp: def.resolvedAt,
                        ticketId: ticket.id,
                        actorId: def.assignedToId ?? diana.id,
                    },
                });
                eventCount++;
            }
            // Transition to CLOSED
            if (def.status === 'CLOSED') {
                const closedAt = new Date(def.resolvedAt);
                closedAt.setHours(closedAt.getHours() + 1);
                await prisma.ticketEvent.create({
                    data: {
                        action: 'STATUS_CHANGED',
                        oldValue: 'RESOLVED',
                        newValue: 'CLOSED',
                        timestamp: closedAt,
                        ticketId: ticket.id,
                        actorId: diana.id,
                    },
                });
                eventCount++;
            }
        }
        // ── Comments ───────────────────────────────────────────────────
        for (let i = 0; i < def.comments.length; i++) {
            const c = def.comments[i];
            const commentAt = new Date(createdAt);
            commentAt.setHours(commentAt.getHours() + (i + 1) * 2);
            await prisma.comment.create({
                data: {
                    body: c.body,
                    createdAt: commentAt,
                    updatedAt: commentAt,
                    ticketId: ticket.id,
                    authorId: c.authorId,
                },
            });
            commentCount++;
        }
        // ── Notification for ticket creator ────────────────────────────
        await prisma.notification.create({
            data: {
                message: `Your ticket "${def.title}" has been received.`,
                read: def.status !== 'OPEN',
                createdAt,
                userId: def.createdById,
                ticketId: ticket.id,
            },
        });
        notificationCount++;
        if (def.assignedToId) {
            const notifAt = new Date(createdAt);
            notifAt.setMinutes(notifAt.getMinutes() + 15);
            await prisma.notification.create({
                data: {
                    message: `Your ticket "${def.title}" has been assigned to an agent.`,
                    read: def.status !== 'IN_PROGRESS',
                    createdAt: notifAt,
                    userId: def.createdById,
                    ticketId: ticket.id,
                },
            });
            notificationCount++;
        }
    }
    // ── Summary ──────────────────────────────────────────────────────────
    console.log(`🎫 Seeded ${ticketCount} tickets.`);
    console.log(`📋 Seeded ${eventCount} ticket events.`);
    console.log(`💬 Seeded ${commentCount} comments.`);
    console.log(`🔔 Seeded ${notificationCount} notifications.`);
    console.log('\n──────────────────────────────────────────────────────────────');
    console.log('  🚀 NexusDesk Consistent Accounts');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Role      | Name             | Email                          | Password');
    console.log('  --------- | ---------------- | ------------------------------ | --------');
    console.log(`  Admin     | Diana Prince     | diana.admin@nexusdesk.local    | ${PASSWORD}`);
    console.log(`  Agent     | Charlie Agent    | charlie.agent@nexusdesk.local  | ${PASSWORD}`);
    console.log(`  Employee  | Alice Martin     | alice.emp@nexusdesk.local      | ${PASSWORD}`);
    console.log(`  Agent     | Sarah Chen       | sarah.agent@nexusdesk.local    | ${PASSWORD}`);
    console.log(`  Agent     | Marcus Johnson   | marcus.agent@nexusdesk.local   | ${PASSWORD}`);
    console.log(`  Employee  | Alex Rivera      | alex.emp@nexusdesk.local       | ${PASSWORD}`);
    console.log(`  Employee  | Priya Sharma     | priya.emp@nexusdesk.local      | ${PASSWORD}`);
    console.log('──────────────────────────────────────────────────────────────\n');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
