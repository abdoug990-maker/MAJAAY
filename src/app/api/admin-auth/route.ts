import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminToken,
  getAdminCookieName,
  getAdminSetupToken,
  getAdminUsername,
  getSetting,
  hashPassword,
  setSetting,
  verifyAdminToken,
  verifyPassword,
} from '@/lib/admin-auth';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function GET(request: NextRequest) {
  const valid = await verifyAdminToken(request.cookies.get(getAdminCookieName())?.value);
  const configured = Boolean(await getSetting('majaay_admin_password_hash'));
  return NextResponse.json({ authenticated: valid, configured, setupAvailable: Boolean(getAdminSetupToken()), username: valid ? getAdminUsername() : null });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action;
    const username = String(body?.username || '').trim().toLowerCase();

    if (action === 'setup') {
      const setupToken = String(body?.setupToken || '');
      const password = String(body?.password || '');
      if (!getAdminSetupToken() || setupToken !== getAdminSetupToken()) {
        return NextResponse.json({ error: 'Secret de première configuration invalide.' }, { status: 403 });
      }
      if (await getSetting('majaay_admin_password_hash')) {
        return NextResponse.json({ error: 'Le mot de passe admin est déjà configuré.' }, { status: 409 });
      }
      if (username !== getAdminUsername() || password.length < 10) {
        return NextResponse.json({ error: 'Identifiant invalide ou mot de passe trop court (10 caractères minimum).' }, { status: 400 });
      }
      await setSetting('majaay_admin_username', getAdminUsername());
      await setSetting('majaay_admin_password_hash', hashPassword(password));
      return NextResponse.json({ ok: true, message: 'Mot de passe admin créé. Vous pouvez maintenant vous connecter.' });
    }

    if (action === 'login') {
      const passwordHash = await getSetting('majaay_admin_password_hash');
      if (!passwordHash || username !== getAdminUsername() || !verifyPassword(String(body?.password || ''), passwordHash)) {
        return NextResponse.json({ error: 'Identifiant ou mot de passe incorrect.' }, { status: 401 });
      }
      const response = NextResponse.json({ ok: true, username: getAdminUsername() });
      response.cookies.set(getAdminCookieName(), await createAdminToken(), cookieOptions);
      return response;
    }

    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur de connexion admin.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), '', { ...cookieOptions, maxAge: 0 });
  return response;
}
