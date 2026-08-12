import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedAppUser, unauthorized } from '@/lib/auth-server';
import { getAdminCookieName, verifyAdminToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

async function isAdminRequest(request: NextRequest) {
  const user = await getAuthenticatedAppUser(request);
  const adminSession = await verifyAdminToken(request.cookies.get(getAdminCookieName())?.value);
  return { user, isAdmin: user?.role === 'admin' || adminSession };
}

function parseImageList(images: string | null | undefined) {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return images.split(',').map((x) => x.trim()).filter(Boolean); }
}

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await isAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === '1';
    const admin = searchParams.get('admin') === '1';
    if (mine && !user) return unauthorized();
    if (admin && !isAdmin) return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
    const where = admin ? {} : mine ? { advertiserId: user!.id } : { status: 'active', placement: 'home', startsAt: { lte: new Date() }, endsAt: { gt: new Date() } };
    const campaigns = await db.adCampaign.findMany({ where, include: { advertiser: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: admin ? 100 : 12 });
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible de charger les campagnes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : null;
    const amount = Number(body.amount);
    if (!title || title.length > 100 || !imageUrl || !Number.isInteger(amount) || amount < 5000) return NextResponse.json({ error: 'Titre, visuel et budget minimum de 5 000 FCFA requis.' }, { status: 400 });
    const campaign = await db.adCampaign.create({ data: { advertiserId: user.id, title, description, imageUrl, targetUrl, amount, status: 'pending' } });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible de créer la demande publicitaire.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await isAdminRequest(request);
    if (!isAdmin) return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const action = typeof body.action === 'string' ? body.action : '';
    const campaign = await db.adCampaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable.' }, { status: 404 });
    if (action === 'approve') {
      return NextResponse.json({ campaign: await db.adCampaign.update({ where: { id }, data: { status: 'payment_pending' } }) });
    }
    if (action === 'reject') {
      return NextResponse.json({ campaign: await db.adCampaign.update({ where: { id }, data: { status: 'rejected' } }) });
    }
    if (action === 'activate') {
      const paymentRef = typeof body.paymentRef === 'string' ? body.paymentRef.trim() : campaign.paymentRef;
      const days = Number(body.days);
      if (!paymentRef || !Number.isInteger(days) || days < 1 || days > 365) return NextResponse.json({ error: 'Référence de paiement et durée valide de 1 à 365 jours requises.' }, { status: 400 });
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);
      return NextResponse.json({ campaign: await db.adCampaign.update({ where: { id }, data: { status: 'active', startsAt, endsAt, paymentRef } }) });
    }
    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible de modifier la campagne.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const paymentRef = typeof body.paymentRef === 'string' ? body.paymentRef.trim() : '';
    const campaign = await db.adCampaign.findFirst({ where: { id, advertiserId: user.id, status: 'payment_pending' } });
    if (!campaign || !paymentRef || paymentRef.length < 4 || paymentRef.length > 120) return NextResponse.json({ error: 'Campagne ou référence de paiement invalide.' }, { status: 400 });
    const updated = await db.adCampaign.update({ where: { id }, data: { status: 'payment_submitted', paymentRef } });
    return NextResponse.json({ campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible d’enregistrer le paiement.' }, { status: 500 });
  }
}
