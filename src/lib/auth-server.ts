import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { readSessionUserId } from '@/lib/password-auth';

export async function getAuthenticatedAppUser(request: NextRequest) {
  const userId = readSessionUserId(request);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
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
