'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Zap, ChevronRight, Plus, TrendingUp, Shield, Smartphone } from 'lucide-react';

const SUBSCRIPTION_BADGE: Record<string, { label: string; className: string }> = {
  premium_plus: { label: 'Premium+', className: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  premium: { label: 'Premium', className: 'bg-terracotta text-white' },
  standard: { label: 'Standard', className: 'bg-accent text-accent-foreground' },
  free: { label: 'Gratuit', className: 'bg-muted text-muted-foreground' },
};

export function HomePage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, listRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/listings?limit=10'),
      ]);
      const cats = await catRes.json();
      const listData = await listRes.json();
      setCategories(cats);
      setListings(listData.listings || []);
      setFeaturedListings((listData.listings || []).filter((l: any) => l.featured || l.isBoosted));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    if (search.trim()) {
      navigate('search', { q: search.trim() });
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Prix sur demande';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getTierBadge = (tier: string) => SUBSCRIPTION_BADGE[tier] || SUBSCRIPTION_BADGE.free;

  const renderListingCard = (listing: any) => {
    const hasImages = listing.images && listing.images !== '[]';
    const firstImage = hasImages ? JSON.parse(listing.images)[0] : null;
    const tierBadge = getTierBadge(listing.seller?.subscriptionTier || 'free');

    return (
      <Card
        key={listing.id}
        className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden group"
        onClick={() => navigate('listing-detail', { id: listing.id })}
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {firstImage ? (
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center gradient-majaay">
              <span className="text-white/60 text-4xl font-bold">MJ</span>
            </div>
          )}
          {listing.isBoosted && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white badge-boosted flex items-center gap-1">
              <Zap className="w-3 h-3" /> Sponsorisé
            </Badge>
          )}
          {listing.featured && !listing.isBoosted && (
            <Badge className="absolute top-2 left-2 gradient-majaay text-white flex items-center gap-1">
              <Star className="w-3 h-3" /> Vedette
            </Badge>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge className={`${tierBadge.className} text-[10px]`}>{tierBadge.label}</Badge>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{listing.title}</h3>
          <p className="text-primary font-bold text-base mb-1">{formatPrice(listing.price)}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{listing.city}{listing.location ? ` · ${listing.location}` : ''}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {listing.seller?.isVerifiedSeller && <Shield className="w-3.5 h-3.5 text-accent" />}
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{listing.seller?.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{listing.views} vues</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="gradient-majaay text-white px-4 pt-12 pb-8 -mx-4 -mt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ma Jaay</h1>
            <p className="text-white/80 text-sm">Achète & Vends près de chez toi</p>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('profile')}>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {user.name?.[0] || 'U'}
                </div>
              </Button>
            ) : (
              <Button size="sm" variant="secondary" className="text-terracotta font-semibold" onClick={() => navigate('login')}>
                Se connecter
              </Button>
            )}
          </div>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher sur Ma Jaay..."
            className="pl-10 pr-12 h-12 rounded-xl bg-white text-foreground shadow-lg border-0 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-terracotta hover:bg-terracotta/90"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow p-3 text-center" onClick={() => user ? navigate('create-listing') : navigate('login')}>
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-terracotta/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-terracotta" />
            </div>
            <span className="text-xs font-medium">Publier</span>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow p-3 text-center" onClick={() => navigate('search')}>
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gold/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <span className="text-xs font-medium">Tendances</span>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow p-3 text-center" onClick={() => user ? navigate('plans') : navigate('login')}>
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs font-medium">Premium</span>
          </Card>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Catégories</h2>
            <Button variant="ghost" size="sm" className="text-terracotta" onClick={() => navigate('search')}>
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <Skeleton className="w-14 h-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  onClick={() => navigate('search', { categoryId: cat.id, categoryName: cat.name })}
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-terracotta/10 transition-colors">
                    <span className="text-2xl">{getCategoryEmoji(cat.slug)}</span>
                  </div>
                  <span className="text-[11px] text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured / Boosted Listings */}
        {featuredListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold">Annonces mises en avant</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {featuredListings.map((l: any) => (
                <Card key={l.id} className="min-w-[260px] max-w-[260px] cursor-pointer hover:shadow-lg transition-shadow overflow-hidden flex-shrink-0"
                  onClick={() => navigate('listing-detail', { id: l.id })}>
                  <div className="relative h-36 bg-muted overflow-hidden">
                    {l.images && l.images !== '[]' ? (
                      <img src={JSON.parse(l.images)[0]} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center gradient-majaay"><span className="text-white/60 text-2xl font-bold">MJ</span></div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] flex items-center gap-1"><Zap className="w-3 h-3" /> Boostée</Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{l.title}</h3>
                    <p className="text-terracotta font-bold text-sm mt-1">{formatPrice(l.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Annonces récentes</h2>
            <Button variant="ghost" size="sm" className="text-terracotta" onClick={() => navigate('search')}>
              Tout voir <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden"><Skeleton className="aspect-[4/3]" /><div className="p-3"><Skeleton className="h-4 mb-2" /><Skeleton className="h-5 w-24" /></div></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map(renderListingCard)}
            </div>
          )}
        </div>

        {/* Trust Banner */}
        <Card className="gradient-majaay-dark text-white p-5 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-8 h-8 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1">Achetez en confiance</h3>
              <p className="text-sm text-white/80">Vendeurs Premium vérifiés (CNI/NINEA). Paiement mobile money sécurisé : Wave, Orange Money, Free Money.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    'vehicules': '🚗', 'immobilier': '🏠', 'electronique': '📱', 'mode-beaute': '👗',
    'maison-jardin': '🏡', 'emploi-services': '💼', 'loisirs-sport': '⚽', 'alimentation': '🛒',
  };
  return map[slug] || '📦';
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Prix sur demande';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}
