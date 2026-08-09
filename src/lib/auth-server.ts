import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supabaseServer } from '@/lib/supabase-server';

export async function getAuthenticatedAppUser(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  if (!accessToken || !supabaseServer) return null;

  const { data, error } = await supabaseServer.auth.getUser(accessToken);
  if (error || !data.user?.email) return null;

  return db.user.findFirst({
    where: {
      OR: [
        { supabaseUserId: data.user.id },
        { email: data.user.email.toLowerCase() },
      ],
    },
  });
}

export function isAdminUser(user: { role?: string | null; email?: string | null } | null) {
  return Boolean(user && (user.role === 'admin' || user.email?.toLowerCase() === 'abdoug660@gmail.com'));
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Authentification requise.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function forbidden() {
  return new Response(JSON.stringify({ error: 'Accès administrateur requis.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
