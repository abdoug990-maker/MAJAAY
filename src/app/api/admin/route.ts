import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin - Dashboard stats
export async function GET() {
  try {
    const [users, activeListings, messages, subs, boosts, reports, thirtyDaysAgo] = [
      await db.user.count(),
      await db.listing.count({ where: { status: 'active' } }),
      await db.message.count(),
      await db.subscription.aggregate({ _sum: { amount: true } }),
      await db.boostPurchase.aggregate({ _sum: { amount: true } }),
      await db.report.count({ where: { status: 'pending' } }),
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ];

    const newUsers = await db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const newListings = await db.listing.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const totalRevenue = (subs._sum.amount || 0) + (boosts._sum.amount || 0);

    return NextResponse.json({
      stats: { users, activeListings, messages, pendingReports: reports, newUsers, newListings, totalRevenue },
    });
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
