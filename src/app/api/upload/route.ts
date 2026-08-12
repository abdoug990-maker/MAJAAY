import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAppUser, unauthorized } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const BUCKET = 'listing-images';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/csv']);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Le stockage des images n’est pas configuré.' }, { status: 503 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucune image reçue.' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Format non pris en charge. Utilisez JPG, PNG, WebP, GIF, PDF ou TXT.' }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_SIZE) return NextResponse.json({ error: 'Chaque fichier doit peser au maximum 10 Mo.' }, { status: 400 });

    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'application/pdf' ? 'pdf' : file.type === 'text/plain' ? 'txt' : file.type === 'text/csv' ? 'csv' : file.type.split('/')[1];
    const path = `${user.id}/${Date.now()}-${randomUUID()}.${extension}`;
    const bucketResult = await supabaseAdmin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE, allowedMimeTypes: Array.from(ALLOWED_TYPES) });
    if (bucketResult.error && !/already exists/i.test(bucketResult.error.message)) {
      return NextResponse.json({ error: `Impossible d’initialiser le stockage : ${bucketResult.error.message}` }, { status: 500 });
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) return NextResponse.json({ error: `Échec de l’upload : ${error.message}` }, { status: 500 });

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur pendant l’upload.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    if (!supabaseAdmin) return NextResponse.json({ error: 'Le stockage des images n’est pas configuré.' }, { status: 503 });
    const { path } = await request.json();
    if (typeof path !== 'string' || !path.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Image invalide.' }, { status: 400 });
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur pendant la suppression.' }, { status: 500 });
  }
}
