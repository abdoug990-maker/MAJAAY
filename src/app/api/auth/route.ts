import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase-server';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseServer) {
      return errorResponse('L’authentification e-mail n’est pas configurée sur le serveur.', 503);
    }

    const body = await request.json();
    const action = body?.action;
    const email = normalizeEmail(body?.email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Adresse e-mail invalide.');
    }

    if (action === 'send-email-otp') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const isLogin = body.mode === 'login';
      const existing = await db.user.findUnique({ where: { email } });

      if (isLogin && !existing) {
        return errorResponse('Aucun compte associé à cette adresse e-mail. Inscrivez-vous d’abord.', 404);
      }
      if (!isLogin && (!name || name.length < 2)) {
        return errorResponse('Le nom est requis (minimum 2 caractères).');
      }
      if (!isLogin && existing) {
        return errorResponse('Cette adresse e-mail est déjà inscrite. Connectez-vous.', 409);
      }

      const origin = new URL(request.url).origin;
      const { error } = await supabaseServer.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: !isLogin,
          emailRedirectTo: origin,
          data: name ? { full_name: name } : undefined,
        },
      });

      if (error) {
        console.error('Supabase OTP send error:', error);
        return errorResponse(error.message || 'Impossible d’envoyer le code e-mail.', 502);
      }

      return NextResponse.json({ message: 'Lien de connexion envoyé par e-mail.' });
    }

    if (action === 'sync-session') {
      const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
      if (!accessToken) return errorResponse('Session e-mail manquante.', 401);

      const { data, error } = await supabaseServer.auth.getUser(accessToken);
      if (error || !data.user?.email) {
        return errorResponse(error?.message || 'Session e-mail invalide ou expirée.', 401);
      }

      const sessionEmail = data.user.email.toLowerCase();
      const isConfiguredAdmin = sessionEmail === 'abdoug660@gmail.com';
      const metadataName = typeof data.user.user_metadata?.full_name === 'string'
        ? data.user.user_metadata.full_name.trim()
        : '';
      const user = await db.user.upsert({
        where: { email: sessionEmail },
        update: {
          isVerified: true,
          supabaseUserId: data.user.id,
          name: metadataName || undefined,
          ...(isConfiguredAdmin ? { role: 'admin' } : {}),
        },
        create: {
          email: sessionEmail,
          phone: null,
          name: metadataName || sessionEmail.split('@')[0],
          isVerified: true,
          supabaseUserId: data.user.id,
          role: isConfiguredAdmin ? 'admin' : 'user',
        },
      });

      return NextResponse.json({ user, token: accessToken });
    }

    if (action === 'verify-email-otp') {
      const token = typeof body.otp === 'string' ? body.otp.trim() : '';
      if (!/^\d{6}$/.test(token)) return errorResponse('Le code doit contenir 6 chiffres.');

      const { data, error } = await supabaseServer.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error || !data.user) {
        return errorResponse(error?.message || 'Code invalide ou expiré.', 401);
      }

      const nameFromMetadata = typeof data.user.user_metadata?.full_name === 'string'
        ? data.user.user_metadata.full_name
        : null;
      const requestedName = typeof body.name === 'string' ? body.name.trim() : '';

      const user = await db.user.upsert({
        where: { email },
        update: {
          isVerified: true,
          name: requestedName || nameFromMetadata || undefined,
          supabaseUserId: data.user.id,
        },
        create: {
          email,
          phone: null,
          name: requestedName || nameFromMetadata,
          isVerified: true,
          supabaseUserId: data.user.id,
        },
      });

      return NextResponse.json({
        user,
        token: data.session?.access_token || `supabase-${data.user.id}`,
      });
    }

    if (action === 'check') {
      const userId = typeof body.userId === 'string' ? body.userId : '';
      if (!userId) return NextResponse.json({ user: null });
      const user = await db.user.findUnique({ where: { id: userId } });
      return NextResponse.json({ user: user || null });
    }

    return errorResponse('Action invalide.');
  } catch (error: any) {
    console.error('Auth error:', error);
    return errorResponse(error?.message || 'Erreur serveur pendant l’authentification.', 500);
  }
}
