import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedAppUser, unauthorized } from '@/lib/auth-server';

const PLANS = {
  standard: { amount: 2200, days: 30 },
  premium: { amount: 3600, days: 30 },
  premium_plus: { amount: 7000, days: 30 },
} as const;

const WAVE_BASE_URL = 'https://pay.wave.com/m/M_sn_nMXTyMN2aAMQ?amount=';

export async function POST(request: NextRequest) {
  try {
    const appUser = await getAuthenticatedAppUser(request);
    if (!appUser) return unauthorized();

    const body = await request.json();
    const tier = body?.tier as keyof typeof PLANS;
    if (!tier || !PLANS[tier]) {
      return NextResponse.json({ error: 'Formule valide requise.' }, { status: 400 });
    }

    const plan = PLANS[tier];
    const waveUrl = `${WAVE_BASE_URL}${plan.amount}`;
    const existingPending = await db.subscription.findFirst({
      where: { userId: appUser.id, tier, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (existingPending) {
      return NextResponse.json({ subscription: existingPending, waveUrl, message: 'Une demande est déjà en attente de validation.' });
    }

    const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);
    const subscription = await db.subscription.create({
      data: {
        userId: appUser.id,
        tier,
        amount: plan.amount,
        status: 'pending',
        expiresAt,
        paymentRef: typeof body.paymentRef === 'string' ? body.paymentRef.trim() || null : null,
      },
    });

    return NextResponse.json({ subscription, waveUrl, message: 'Demande créée. Effectuez le paiement Wave puis attendez la validation administrateur.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Impossible de créer la demande.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const appUser = await getAuthenticatedAppUser(request);
    if (!appUser) return unauthorized();
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && requestedUserId !== appUser.id) {
      return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
    }
    const subs = await db.subscription.findMany({ where: { userId: appUser.id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ subscriptions: subs, plans: Object.entries(PLANS).map(([tier, value]) => ({ tier, ...value })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Impossible de charger les abonnements.' }, { status: 500 });
  }
}
