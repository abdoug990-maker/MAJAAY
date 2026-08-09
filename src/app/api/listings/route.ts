import { NextRequest, NextResponse } from 'next/server';
import { getListings, createListing, getListingWithDetails, updateListing, deleteListing, incrementViews } from '@/lib/api';
import { getAuthenticatedAppUser, unauthorized } from '@/lib/auth-server';

// GET /api/listings - Fetch listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getListings({
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      city: searchParams.get('city') || undefined,
      condition: searchParams.get('condition') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      boosted: searchParams.get('boosted') === 'true',
      sortBy: searchParams.get('sortBy') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/listings - Create listing
export async function POST(request: NextRequest) {
  try {
    const appUser = await getAuthenticatedAppUser(request);
    if (!appUser) return unauthorized();
    const body = await request.json();
    if (!body.title || !body.categoryId) {
      return NextResponse.json({ error: 'Titre et catégorie requis' }, { status: 400 });
    }
    const listing = await createListing({ ...body, sellerId: appUser.id });
    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    const message = error.message || 'Erreur de publication.';
    return NextResponse.json({ error: message }, { status: /abonnement|autorisé|Utilisateur introuvable/.test(message) ? 403 : 500 });
  }
}

// PUT /api/listings - Update listing
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id || !body.userId) {
      return NextResponse.json({ error: 'ID et utilisateur requis' }, { status: 400 });
    }
    const { id, userId, ...data } = body;
    const listing = await updateListing(id, userId, data);
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('autorisé') ? 403 : 500 });
  }
}

// DELETE /api/listings?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    if (!id || !userId) {
      return NextResponse.json({ error: 'ID et utilisateur requis' }, { status: 400 });
    }
    await deleteListing(id, userId);
    return NextResponse.json({ message: 'Annonce supprimée' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('autorisé') ? 403 : 500 });
  }
}
