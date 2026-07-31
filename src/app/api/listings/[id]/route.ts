import { NextRequest, NextResponse } from 'next/server';
import { getListingWithDetails, incrementViews } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingWithDetails(id);
    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }
    await incrementViews(id);
    const updatedListing = { ...listing, views: listing.views + 1 };
    return NextResponse.json(updatedListing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
