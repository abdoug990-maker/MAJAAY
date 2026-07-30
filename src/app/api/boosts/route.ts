import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/boosts - Purchase a boost
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, userId, durationHours = 48, amount = 1000 } = body;

    if (!listingId || !userId) {
      return NextResponse.json({ error: 'Annonce et utilisateur requis' }, { status: 400 });
    }

    const listing = await db.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // In production: integrate PayDunya/Wave/Orange Money here
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const boost = await db.boostPurchase.create({
      data: {
        listingId,
        userId,
        durationHours,
        amount,
        startsAt: new Date(),
        expiresAt,
        paymentRef: `DEMO-${Date.now()}`,
      },
    });

    await db.listing.update({
      where: { id: listingId },
      data: { isBoosted: true, boostExpiresAt: expiresAt },
    });

    return NextResponse.json({ boost, message: 'Annonce boostée avec succès !' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
