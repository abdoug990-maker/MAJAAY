import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

// POST /api/auth - Login or Register with phone
export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    const body = await request.json();
    const { phone, name, action } = body;

    if (!phone || !phone.match(/^\+221[0-9]{9}$/)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide. Format: +221XXXXXXXXX' }, { status: 400 });
    }

    if (action === 'register') {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: 'Le nom est requis (min. 2 caractères)' }, { status: 400 });
      }
      const existing = await db.user.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json({ error: 'Ce numéro est déjà inscrit. Connectez-vous.' }, { status: 409 });
      }
      // In production: send OTP via SMS. Here we simulate with code 1234
      return NextResponse.json({ message: 'Code OTP envoyé (démo: 1234)', otp: '1234' });
    }

    if (action === 'login') {
      const user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: 'Numéro non trouvé. Inscrivez-vous d\'abord.' }, { status: 404 });
      }
      // In production: send OTP via SMS
      return NextResponse.json({ message: 'Code OTP envoyé (démo: 1234)', otp: '1234', hasAccount: true });
    }

    if (action === 'verify-otp') {
      const { otp, name: regName } = body;
      if (otp !== '1234') {
        return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
      }

      let user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        // Create new user
        user = await db.user.create({
          data: { phone, name: regName || null, isVerified: true },
        });
      } else {
        user = await db.user.update({ where: { phone }, data: { isVerified: true } });
      }

      const { ...safeUser } = user;
      return NextResponse.json({ user: safeUser, token: 'demo-session-' + user.id });
    }

    if (action === 'check') {
      const userId = body.userId;
      if (!userId) return NextResponse.json({ user: null });
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ user: null });
      const { ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
