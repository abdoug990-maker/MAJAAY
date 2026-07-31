import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PLANS = {
  standard: { amount: 2200, days: 30 },
  premium: { amount: 3600, days: 30 },
  premium_plus: { amount: 7000, days: 30 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tier } = body;

    if (!userId || !tier || !PLANS[tier as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Utilisateur et formule valides requis' }, { status: 400 });
    }

    const plan = PLANS[tier as keyof typeof PLANS];
    const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);

    // In production: integrate mobile money payment here
    const subscription = await db.subscription.create({
      data: {
        userId,
        tier,
        amount: plan.amount,
        expiresAt,
        paymentRef: `DEMO-SUB-${Date.now()}`,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier, subscriptionExpiresAt: expiresAt },
    });

    return NextResponse.json({ subscription, message: `Abonnement ${tier} activé !` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ plans: Object.entries(PLANS).map(([k, v]) => ({ tier: k, ...v })) });
    const subs = await db.subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ subscriptions: subs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
