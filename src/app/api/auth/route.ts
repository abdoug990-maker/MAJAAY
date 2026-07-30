import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-server';

// POST /api/auth - Authentification par téléphone + OTP
export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    const body = await request.json();
    const { phone, name, action } = body;

    if (!phone || !phone.match(/^\+221[0-9]{9}$/)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide. Format: +221XXXXXXXXX' }, { status: 400 });
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

      // --- Supabase SMS OTP ---
      if (isSupabaseConfigured && supabaseAdmin) {
        const { error } = await supabaseAdmin.auth.signInWithOtp({
          phone,
          channel: 'sms',
        });
        if (error) {
          // Si l'utilisateur existe déjà dans Supabase, signInWithOtp marche quand même
          // L'erreur la plus courante c'est la config SMS provider
          console.error('Supabase SMS error:', error.message);
          return NextResponse.json({ error: `Erreur d'envoi SMS : ${error.message}. Vérifiez la config du provider SMS dans Supabase.` }, { status: 500 });
        }
        return NextResponse.json({
          message: 'Code OTP envoyé par SMS',
          mode: 'supabase',
        });
      }

      // --- Fallback démo (pas de Supabase configuré) ---
      return NextResponse.json({
        message: 'Code OTP envoyé (démo : 1234)',
        otp: '1234',
        mode: 'demo',
      });
    }

    // ===== VÉRIFICATION OTP =====
    if (action === 'verify-otp') {
      const { otp, name: regName } = body;

      // --- Supabase verify ---
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data: authData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });

        if (verifyError || !authData.user) {
          return NextResponse.json({ error: 'Code OTP invalide ou expiré' }, { status: 400 });
        }

        const supabaseUserId = authData.user.id;
        const accessToken = authData.session?.access_token || '';

        // Synchroniser avec notre base locale Prisma
        let user = await db.user.findUnique({ where: { phone } });
        if (!user) {
          user = await db.user.create({
            data: {
              phone,
              name: regName || authData.user.user_metadata?.name || null,
              isVerified: true,
              supabaseUserId,
            },
          });
        } else {
          user = await db.user.update({
            where: { phone },
            data: { isVerified: true, supabaseUserId },
          });
        }

        const { ...safeUser } = user;
        return NextResponse.json({
          user: safeUser,
          token: accessToken,
          mode: 'supabase',
        });
      }

      // --- Fallback démo ---
      if (otp !== '1234') {
        return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
      }

      let user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: { phone, name: regName || null, isVerified: true },
        });
      } else {
        user = await db.user.update({ where: { phone }, data: { isVerified: true } });
      }

      const { ...safeUser } = user;
      return NextResponse.json({
        user: safeUser,
        token: 'demo-session-' + user.id,
        mode: 'demo',
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
