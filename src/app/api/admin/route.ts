import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { unauthorized } from '@/lib/auth-server';
import { getAdminCookieName, verifyAdminToken } from '@/lib/admin-auth';

// GET /api/admin?type=stats|users|subscriptions|reports
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.cookies.get(getAdminCookieName())?.value);
    if (!isAdmin) return unauthorized();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';

    if (type === 'stats') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [users, activeListings, messages, subs, boosts, reports, newUsers, newListings, sellers] = await Promise.all([
        db.user.count(),
        db.listing.count({ where: { status: 'active' } }),
        db.message.count(),
        db.subscription.aggregate({ _sum: { amount: true } }),
        db.boostPurchase.aggregate({ _sum: { amount: true } }),
        db.report.count({ where: { status: 'pending' } }),
        db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.listing.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.user.count({ where: { isVerifiedSeller: true } }),
      ]);
      const totalRevenue = (subs._sum.amount || 0) + (boosts._sum.amount || 0);
      const tierCounts = await db.user.groupBy({ by: ['subscriptionTier'], _count: true });
      const activity = await db.$queryRaw<Array<{ day: Date; users: bigint; listings: bigint; messages: bigint; revenue: bigint }>>(Prisma.sql`SELECT d.day, COALESCE(u.users, 0) AS users, COALESCE(l.listings, 0) AS listings, COALESCE(m.messages, 0) AS messages, COALESCE(r.revenue, 0) AS revenue FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d(day) LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS users FROM "User" GROUP BY 1) u ON u.day = d.day LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS listings FROM "Listing" GROUP BY 1) l ON l.day = d.day LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS messages FROM "Message" GROUP BY 1) m ON m.day = d.day LEFT JOIN (SELECT DATE_TRUNC('day', "createdAt") AS day, SUM("amount")::bigint AS revenue FROM "Subscription" WHERE "status" = 'active' GROUP BY 1) r ON r.day = d.day ORDER BY d.day ASC`);
      const safeActivity = activity.map((row) => ({ day: row.day, users: Number(row.users), listings: Number(row.listings), messages: Number(row.messages), revenue: Number(row.revenue) }));
      return NextResponse.json({
        stats: { users, activeListings, messages, pendingReports: reports, newUsers, newListings, totalRevenue, sellers, tierCounts, activity: safeActivity },
      });
    }

    if (type === 'users') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const tier = searchParams.get('tier') || '';
      const where: any = {};
      if (search) where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
      if (tier) where.subscriptionTier = tier;
      const [users, total] = await Promise.all([
        db.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
        db.user.count({ where }),
      ]);
      return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
    }

    if (type === 'subscriptions') {
      const subs = await db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      });
      return NextResponse.json({ subscriptions: subs });
    }

    if (type === 'reports') {
      const reports = await db.report.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          reporter: { select: { id: true, name: true, phone: true } },
          listing: { select: { id: true, title: true, status: true } },
        },
      });
      return NextResponse.json({ reports });
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin - Update user/subscription
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.cookies.get(getAdminCookieName())?.value);
    if (!isAdmin) return unauthorized();
    const body = await request.json();
    const { type, userId, ...data } = body;

    if (type === 'update-user' && userId) {
      const updateData: any = {};
      if (data.role) updateData.role = data.role;
      if (data.subscriptionTier) {
        updateData.subscriptionTier = data.subscriptionTier;
        if (data.subscriptionTier === 'free') updateData.subscriptionExpiresAt = null;
        else updateData.subscriptionExpiresAt = data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      if (data.isVerifiedSeller !== undefined) updateData.isVerifiedSeller = data.isVerifiedSeller;
      if (data.name) updateData.name = data.name;
      if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

      const user = await db.user.update({ where: { id: userId }, data: updateData });
      const { ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    if (type === 'update-subscription' && body.subscriptionId) {
      const current = await db.subscription.findUnique({ where: { id: body.subscriptionId } });
      if (!current) return NextResponse.json({ error: 'Abonnement introuvable.' }, { status: 404 });
      const nextStatus = data.status || 'cancelled';
      const sub = await db.$transaction(async (tx) => {
        const updated = await tx.subscription.update({
          where: { id: body.subscriptionId },
          data: { status: nextStatus, paymentRef: typeof data.paymentRef === 'string' ? data.paymentRef : current.paymentRef },
        });
        if (nextStatus === 'active') {
          await tx.user.update({
            where: { id: current.userId },
            data: { subscriptionTier: current.tier, subscriptionExpiresAt: current.expiresAt },
          });
        }
        if (nextStatus === 'cancelled') {
          const active = await tx.subscription.findFirst({ where: { userId: current.userId, status: 'active', id: { not: current.id } }, orderBy: { expiresAt: 'desc' } });
          await tx.user.update({
            where: { id: current.userId },
            data: active ? { subscriptionTier: active.tier, subscriptionExpiresAt: active.expiresAt } : { subscriptionTier: 'free', subscriptionExpiresAt: null },
          });
        }
        return updated;
      });
      return NextResponse.json({ subscription: sub });
    }

    return NextResponse.json({ error: 'Type ou ID manquant' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin - Moderate listing or report
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request.cookies.get(getAdminCookieName())?.value);
    if (!isAdmin) return unauthorized();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (type === 'listing' && id) {
      await db.listing.update({ where: { id }, data: { status: 'moderated' } });
      return NextResponse.json({ message: 'Annonce modérée' });
    }
    if (type === 'report' && id) {
      await db.report.update({ where: { id }, data: { status: 'resolved' } });
      return NextResponse.json({ message: 'Signalement traité' });
    }
    return NextResponse.json({ error: 'Type ou ID manquant' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}