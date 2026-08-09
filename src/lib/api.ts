import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getListingWithDetails(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      category: true,
      seller: {
        select: { id: true, name: true, avatar: true, phone: true, isVerifiedSeller: true, subscriptionTier: true, location: true, bio: true },
      },
    },
  });
}

export async function getListings(filters: {
  search?: string;
  categoryId?: string;
  city?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  boosted?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.ListingWhereInput = { status: 'active' };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.city) where.city = filters.city;
  if (filters.condition) where.condition = filters.condition;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  // Remove empty OR to avoid 1=0 in Prisma query
  if (where.OR && (where.OR as any[]).length === 0) {
    delete (where as any).OR;
  }

  if (filters.boosted) {
    where.isBoosted = true;
    where.boostExpiresAt = { gte: new Date() };
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
  if (filters.sortBy === 'price-asc') orderBy = { price: 'asc' };
  else if (filters.sortBy === 'price-desc') orderBy = { price: 'desc' };
  else if (filters.sortBy === 'popular') orderBy = { views: 'desc' };
  else if (filters.sortBy === 'recent') orderBy = { createdAt: 'desc' };

  const page = filters.page || 1;
  const limit = filters.limit || 20;

  // Get boosted first, then regular
  const [boosted, regular, total] = await Promise.all([
    db.listing.findMany({
      where: { ...where, isBoosted: true, boostExpiresAt: { gte: new Date() } },
      include: { category: true, seller: { select: { id: true, name: true, avatar: true, isVerifiedSeller: true, subscriptionTier: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.listing.findMany({
      where: { ...where, isBoosted: false },
      include: { category: true, seller: { select: { id: true, name: true, avatar: true, isVerifiedSeller: true, subscriptionTier: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.listing.count({ where }),
  ]);

  return { listings: [...boosted, ...regular], total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserListings(userId: string) {
  return db.listing.findMany({
    where: { sellerId: userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createListing(data: {
  title: string;
  description: string;
  price: number | null;
  negotiable: boolean;
  condition: string;
  categoryId: string;
  city: string;
  location: string | null;
  sellerId: string;
  images?: string;
}) {
  const user = await db.user.findUnique({ where: { id: data.sellerId } });
  if (!user) throw new Error('Utilisateur introuvable.');
  const hasActivePaidSubscription = user.subscriptionTier !== 'free'
    && Boolean(user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date());
  if (!hasActivePaidSubscription) {
    throw new Error('Un abonnement payant approuvé est requis pour publier une annonce.');
  }

  return db.listing.create({
    data: {
      ...data,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function updateListing(id: string, userId: string, data: Prisma.ListingUpdateInput) {
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== userId) throw new Error('Non autorisé');
  return db.listing.update({ where: { id }, data });
}

export async function deleteListing(id: string, userId: string) {
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== userId) throw new Error('Non autorisé');
  return db.listing.update({ where: { id }, data: { status: 'expired' } });
}

export async function incrementViews(id: string) {
  return db.listing.update({ where: { id }, data: { views: { increment: 1 } } });
}

export async function incrementContactCount(id: string) {
  return db.listing.update({ where: { id }, data: { contactCount: { increment: 1 } } });
}

// Stats
export async function getAdminStats() {
  const [users, listings, messages, revenue] = await Promise.all([
    db.user.count(),
    db.listing.count({ where: { status: 'active' } }),
    db.message.count(),
    db.subscription.aggregate({ _sum: { amount: true } }),
    db.boostPurchase.aggregate({ _sum: { amount: true } }),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newUsers = await db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
  const newListings = await db.listing.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
  const pendingReports = await db.report.count({ where: { status: 'pending' } });

  return {
    users,
    listings,
    messages,
    newUsers,
    newListings,
    pendingReports,
    totalRevenue: (revenue[0]?._sum?.amount || 0) + (revenue[1]?._sum?.amount || 0),
  };
}
