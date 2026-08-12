import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { NextRequest, NextResponse } from 'next/server';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'majaay_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return process.env.MAJAAY_AUTH_SECRET || process.env.MAJAAY_ADMIN_SETUP_TOKEN || 'majaay-auth-secret-change-in-production';
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded?.startsWith('scrypt:')) return false;
  const [, salt, expectedHex] = encoded.split(':');
  if (!salt || !expectedHex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSessionUserId(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value || '';
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) && typeof data.sub === 'string' ? data.sub : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

export function passwordIsValid(password: string) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}
