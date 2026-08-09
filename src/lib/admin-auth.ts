import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';

const ADMIN_USERNAME = 'abdoug660@gmail.com';
const ADMIN_COOKIE = 'majaay-admin-session';
const ADMIN_SETUP_TOKEN = process.env.MAJAAY_ADMIN_SETUP_TOKEN || '';
const JWT_SECRET = new TextEncoder().encode(
  process.env.MAJAAY_ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'change-this-admin-secret',
);

export function getAdminUsername() { return ADMIN_USERNAME; }
export function getAdminCookieName() { return ADMIN_COOKIE; }
export function getAdminSetupToken() { return ADMIN_SETUP_TOKEN; }

export async function getSetting(key: string) {
  const setting = await db.appSetting.findUnique({ where: { key } });
  return setting?.value || null;
}

export async function setSetting(key: string, value: string) {
  return db.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, expected] = encoded.split(':');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

export async function createAdminToken() {
  return new SignJWT({ admin: true, username: ADMIN_USERNAME })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(ADMIN_USERNAME)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.admin === true && payload.sub === ADMIN_USERNAME;
  } catch {
    return false;
  }
}
