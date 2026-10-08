import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Clean existing data ──────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticketEvent.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data.\n');

  // ── Helper: hash password ────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 12);
  const PASSWORD = 'Demo@123';

  // ── Seed Users ───────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexusdesk.demo' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@nexusdesk.demo',
      passwordHash: hash(PASSWORD),
      role: 'ADMIN',
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@nexusdesk.demo' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@nexusdesk.demo',
      passwordHash: hash(PASSWORD),
      role: 'AGENT',
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@nexusdesk.demo' },
    update: {},
    create: {
      name: 'Marcus Johnson',
      email: 'marcus@nexusdesk.demo',
      passwordHash: hash(PASSWORD),
      role: 'AGENT',
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: 'alex@nexusdesk.demo' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex@nexusdesk.demo',
      passwordHash: hash(PASSWORD),
      role: 'EMPLOYEE',
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@nexusdesk.demo' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya@nexusdesk.demo',
      passwordHash: hash(PASSWORD),
      role: 'EMPLOYEE',
    },
  });

  console.log('👤 Seeded 5 users.');

  // ── Helper: stagger dates over the past 5 days ──────────────────────
  const now = new Date();
  const daysAgo = (d: number, hoursOffset = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(date.getHours() + hoursOffset);
    return date;
  };

  // ── Helper: SLA deadline based on priority ───────────────────────────
  const slaHours: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 24,
    MEDIUM: 48,
    LOW: 72,
  };

  const slaDeadline = (createdAt: Date, priority: string) => {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + (slaHours[priority] ?? 48));
    return deadline;
  };

  // ── Ticket definitions ───────────────────────────────────────────────
  interface TicketDef {
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdById: string;
    assignedToId?: string;
    resolvedAt?: Date;
    slaBreached?: boolean;
    createdAt: Date;
    comments: { body: string; authorId: string }[];
  }

  const ticketDefs: TicketDef[] = [
    {
      title: 'VPN connection dropping intermittently',
      description:
        'VPN disconnects every 15-20 minutes during active use. Tried reinstalling the client and switching networks — issue persists. Affecting ability to access internal tools remotely.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      createdById: alex.id,
      assignedToId: sarah.id,
      createdAt: daysAgo(4, 2),
      comments: [
        {
          body: `I've reproduced the issue. Looks like the tunnel MTU is misconfigured after last Friday's firewall update. Working on a fix now.`,
          authorId: sarah.id,
        },
        {
          body: `Thanks Sarah — in the meantime I'm using the web portal as a workaround but it's quite slow.`,
          authorId: alex.id,
        },
      ],
    },
    {
      title: 'Request new monitor for workstation',
      description:
        'My current 22" monitor is showing colour banding and the USB-C port no longer works. Requesting a replacement — preferably a 27" 4K display for design work.',
      status: 'OPEN',
      priority: 'LOW',
      createdById: priya.id,
      createdAt: daysAgo(3, 5),
      comments: [],
    },
    {
      title: 'Cannot access shared drive S:',
      description:
        'Getting "Access Denied" when trying to open \\\\fileserver\\shared. Was working fine yesterday. Other team members can still access it. Tried remapping the drive — same error.',
      status: 'RESOLVED',
      priority: 'HIGH',
      createdById: alex.id,
      assignedToId: marcus.id,
      resolvedAt: daysAgo(2, 3),
      createdAt: daysAgo(4, 8),
      comments: [
        {
          body: `Your AD group membership was accidentally removed during last night's directory sync. I've re-added you — please log out and back in.`,
          authorId: marcus.id,
        },
        {
          body: 'That fixed it, thanks Marcus!',
          authorId: alex.id,
        },
      ],
    },
    {
      title: 'Outlook calendar sync not working',
      description:
        'Calendar events created on my phone are not syncing to Outlook desktop and vice versa. Exchange account shows as connected. Tried removing and re-adding the account on mobile.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdById: priya.id,
      assignedToId: sarah.id,
      createdAt: daysAgo(2, 1),
      comments: [
        {
          body: `I can see a sync conflict in your Exchange mailbox. Clearing the sync state on the mobile device should resolve this — I'll send you the steps.`,
          authorId: sarah.id,
        },
      ],
    },
    {
      title: 'Software license renewal - Adobe Creative Suite',
      description:
        'My Adobe Creative Suite license expires next week. Need renewal for Photoshop, Illustrator, and InDesign. Current license key is on the asset management portal.',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdById: alex.id,
      createdAt: daysAgo(1, 3),
      comments: [],
    },
    {
      title: 'Laptop overheating and shutting down',
      description:
        'Dell Latitude 5540 shuts down unexpectedly after 30-40 minutes of use. Bottom of the laptop is extremely hot. Fan sounds louder than normal. Asset tag: DL-5540-0892.',
      status: 'RESOLVED',
      priority: 'CRITICAL',
      createdById: priya.id,
      assignedToId: marcus.id,
      resolvedAt: daysAgo(0, -2),
      slaBreached: true,
      createdAt: daysAgo(3, 7),
      comments: [
        {
          body: 'Opened the unit — thermal paste was completely dried out and the fan intake was clogged with dust. Cleaned and re-pasted. Running stress test now.',
          authorId: marcus.id,
        },
        {
          body: 'Stress test passed. Laptop is running at normal temps. Took longer than expected due to parts availability — apologies for the delay.',
          authorId: marcus.id,
        },
      ],
    },
    {
      title: 'Password reset for legacy CRM system',
      description:
        'Locked out of the legacy Siebel CRM system. The "forgot password" link sends a reset email that never arrives. Need manual reset from an admin.',
      status: 'CLOSED',
      priority: 'HIGH',
      createdById: alex.id,
      assignedToId: sarah.id,
      resolvedAt: daysAgo(1, 6),
      createdAt: daysAgo(2, 4),
      comments: [
        {
          body: `Password has been reset. I've also updated the SMTP relay config for that system so the self-service emails should work going forward.`,
          authorId: sarah.id,
        },
      ],
    },
    {
      title: 'Set up new employee workstation - Engineering',
      description:
        'New engineer joining the Platform team on Monday. Need full workstation setup: dual monitors, docking station, standard engineering software stack (VS Code, Docker Desktop, Postman, Node.js LTS). Manager: David Kim.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdById: priya.id,
      assignedToId: marcus.id,
      createdAt: daysAgo(1, 7),
      comments: [
        {
          body: 'Hardware has been allocated from inventory. Starting software installation and domain join now. Should be ready by end of day Thursday.',
          authorId: marcus.id,
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
          actorId: admin.id,
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
          actorId: def.assignedToId ?? admin.id,
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
            timestamp: def.resolvedAt!,
            ticketId: ticket.id,
            actorId: def.assignedToId ?? admin.id,
          },
        });
        eventCount++;
      }

      // Transition to CLOSED
      if (def.status === 'CLOSED') {
        const closedAt = new Date(def.resolvedAt!);
        closedAt.setHours(closedAt.getHours() + 1);

        await prisma.ticketEvent.create({
          data: {
            action: 'STATUS_CHANGED',
            oldValue: 'RESOLVED',
            newValue: 'CLOSED',
            timestamp: closedAt,
            ticketId: ticket.id,
            actorId: admin.id,
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
  console.log('\n────────────────────────────────────────────');
  console.log('  🚀 NexusDesk Demo Accounts');
  console.log('────────────────────────────────────────────');
  console.log('  Role      | Email                    | Password');
  console.log('  --------- | ------------------------ | --------');
  console.log('  Admin     | admin@nexusdesk.demo     | Demo@123');
  console.log('  Agent     | sarah@nexusdesk.demo     | Demo@123');
  console.log('  Agent     | marcus@nexusdesk.demo    | Demo@123');
  console.log('  Employee  | alex@nexusdesk.demo      | Demo@123');
  console.log('  Employee  | priya@nexusdesk.demo     | Demo@123');
  console.log('────────────────────────────────────────────\n');
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
