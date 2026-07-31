import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin?type=stats|users|subscriptions|reports
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({
        stats: { users, activeListings, messages, pendingReports: reports, newUsers, newListings, totalRevenue, sellers, tierCounts },
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
        include: { user: { select: { id: true, name: true, phone: true } } },
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
    const body = await request.json();
    const { type, userId, ...data } = body;

    if (type === 'update-user' && userId) {
      const updateData: any = {};
      if (data.role) updateData.role = data.role;
      if (data.subscriptionTier) updateData.subscriptionTier = data.subscriptionTier;
      if (data.isVerifiedSeller !== undefined) updateData.isVerifiedSeller = data.isVerifiedSeller;
      if (data.name) updateData.name = data.name;
      if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

      const user = await db.user.update({ where: { id: userId }, data: updateData });
      const { ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    if (type === 'update-subscription' && body.subscriptionId) {
      const sub = await db.subscription.update({
        where: { id: body.subscriptionId },
        data: { status: data.status || 'cancelled' },
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