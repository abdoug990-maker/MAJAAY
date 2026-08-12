import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clearSessionCookie, hashPassword, passwordIsValid, readSessionUserId, setSessionCookie, verifyPassword } from '@/lib/password-auth';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function publicUser(user: any) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'register') {
      const email = normalizeEmail(body.email);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse('Adresse e-mail invalide.');
      if (name.length < 2) return errorResponse('Le nom est requis (minimum 2 caractères).');
      if (!passwordIsValid(password)) return errorResponse('Le mot de passe doit contenir au moins 8 caractères.');
      const existing = await db.user.findUnique({ where: { email } });
      if (existing?.passwordHash) return errorResponse('Cette adresse e-mail est déjà inscrite. Connectez-vous.', 409);
      const user = existing
        ? await db.user.update({
            where: { id: existing.id },
            data: { name, passwordHash: await hashPassword(password), isVerified: true },
          })
        : await db.user.create({
            data: {
              email,
              name,
              passwordHash: await hashPassword(password),
              isVerified: true,
              role: email === 'abdoug660@gmail.com' ? 'admin' : 'user',
            },
          });
      const response = NextResponse.json({ user: publicUser(user) });
      setSessionCookie(response, user.id);
      return response;
    }

    if (action === 'login') {
      const email = normalizeEmail(body.email);
      const password = typeof body.password === 'string' ? body.password : '';
      if (!email || !password) return errorResponse('Saisissez votre e-mail et votre mot de passe.');
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.passwordHash))) return errorResponse('E-mail ou mot de passe incorrect.', 401);
      const response = NextResponse.json({ user: publicUser(user) });
      setSessionCookie(response, user.id);
      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ ok: true });
      clearSessionCookie(response);
      return response;
    }

    if (action === 'check') {
      const userId = readSessionUserId(request);
      if (!userId) return NextResponse.json({ user: null });
      const user = await db.user.findUnique({ where: { id: userId } });
      return NextResponse.json({ user: user ? publicUser(user) : null });
    }

    return errorResponse('Action invalide.');
  } catch (error: any) {
    console.error('Auth error:', error);
    return errorResponse(error?.message || 'Erreur serveur pendant l’authentification.', 500);
  }
}
