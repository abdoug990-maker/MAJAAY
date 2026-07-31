import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { createAndSendOtp, verifyOtp, isSmsConfigured } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    const body = await request.json();
    const { phone, name, action } = body;

    if (!phone || !phone.match(/^\+221[0-9]{9}$/)) {
      return NextResponse.json({ error: 'Numéro invalide. Format: +221XXXXXXXXX' }, { status: 400 });
    }

    // ===== ENVOI OTP =====
    if (action === 'register' || action === 'login') {
      if (action === 'register' && (!name || name.trim().length < 2)) {
        return NextResponse.json({ error: 'Le nom est requis (min. 2 caractères)' }, { status: 400 });
      }

      if (action === 'register') {
        const existing = await db.user.findUnique({ where: { phone } });
        if (existing) {
          return NextResponse.json({ error: 'Ce numéro est déjà inscrit. Connectez-vous.' }, { status: 409 });
        }
      }

      if (action === 'login') {
        const user = await db.user.findUnique({ where: { phone } });
        if (!user) {
          return NextResponse.json({ error: 'Numéro non trouvé. Inscrivez-vous d\'abord.' }, { status: 404 });
        }
      }

      // Générer + envoyer l'OTP
      const otpResult = await createAndSendOtp(phone);

      if (!otpResult.sent) {
        return NextResponse.json({ error: `Erreur d'envoi : ${otpResult.error}` }, { status: 500 });
      }

      return NextResponse.json({
        message: isSmsConfigured
          ? 'Code OTP envoyé par SMS'
          : 'Code OTP envoyé',
        devCode: otpResult.devCode, // null si SMS réel, le code si mode démo
        mode: isSmsConfigured ? 'sms' : 'demo',
      });
    }

    // ===== VÉRIFICATION OTP =====
    if (action === 'verify-otp') {
      const { otp, name: regName } = body;

      const result = await verifyOtp(phone, otp);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Créer ou mettre à jour l'utilisateur
      let user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: { phone, name: regName || null, isVerified: true },
        });
      } else {
        user = await db.user.update({
          where: { phone },
          data: { isVerified: true },
        });
      }

      const { ...safeUser } = user;
      return NextResponse.json({
        user: safeUser,
        token: 'session-' + user.id,
        mode: isSmsConfigured ? 'sms' : 'demo',
      });
    }

    // ===== CHECK SESSION =====
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
