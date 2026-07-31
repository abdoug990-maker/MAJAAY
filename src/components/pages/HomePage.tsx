'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Zap, ChevronRight, Plus, TrendingUp, Shield, Sparkles, Crown } from 'lucide-react';
import { CategoryIcon } from '@/lib/category-icons';

const SUBSCRIPTION_BADGE: Record<string, { label: string; className: string }> = {
  premium_plus: { label: 'Premium+', className: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm' },
  premium: { label: 'Premium', className: 'bg-terracotta text-white shadow-sm' },
  standard: { label: 'Standard', className: 'bg-accent text-accent-foreground shadow-sm' },
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
      const [catRes, listRes] = await Promise.all([fetch('/api/categories'), fetch('/api/listings?limit=10')]);
      const cats = await catRes.json();
      const listData = await listRes.json();
      setCategories(cats);
      setListings(listData.listings || []);
      setFeaturedListings((listData.listings || []).filter((l: any) => l.featured || l.isBoosted));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    if (search.trim()) navigate('search', { q: search.trim() });
  };

  const getTierBadge = (tier: string) => SUBSCRIPTION_BADGE[tier] || SUBSCRIPTION_BADGE.free;

  const renderListingCard = (listing: any, idx: number) => {
    const hasImages = listing.images && listing.images !== '[]';
    const firstImage = hasImages ? JSON.parse(listing.images)[0] : null;
    const tierBadge = getTierBadge(listing.seller?.subscriptionTier || 'free');
    return (
      <Card key={listing.id}
        className="cursor-pointer overflow-hidden group shadow-sm hover:shadow-card-hover transition-all duration-300 border-0"
        style={{ animationDelay: `${idx * 50}ms` }}
        onClick={() => navigate('listing-detail', { id: listing.id })}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {firstImage ? (
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <CategoryIcon slug={listing.category?.slug || 'alimentation'} size={32} />
            </div>
          )}
          {listing.isBoosted && (
            <div className="absolute top-2.5 left-2.5">
              <Badge className="bg-amber-500/95 backdrop-blur text-white text-[10px] font-medium badge-boosted flex items-center gap-1 px-2 py-0.5 rounded-md">
                <Zap className="w-3 h-3 fill-current" /> Sponsorise
              </Badge>
            </div>
          )}
          {listing.featured && !listing.isBoosted && (
            <div className="absolute top-2.5 left-2.5">
              <Badge className="bg-foreground/80 backdrop-blur text-white text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Vedette
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Badge className={`${tierBadge.className} text-[9px] font-medium px-1.5 py-0 rounded`}>{tierBadge.label}</Badge>
          </div>
        </div>
        <CardContent className="p-3 pt-2.5">
          <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 mb-1.5 text-foreground/90">{listing.title}</h3>
          <p className="text-terracotta font-bold text-[15px] tracking-tight mb-1.5">{formatPrice(listing.price)}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {listing.seller?.isVerifiedSeller && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
              <span className="text-[11px] text-muted-foreground truncate">{listing.seller?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{listing.city}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="gradient-hero text-white px-5 pt-12 pb-10 -mx-4 -mt-4 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/[0.04] rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/[0.03] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-[22px] font-extrabold tracking-tight">Ma Jaay</h1>
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <p className="text-white/60 text-[13px] font-medium">Le marketplace du Senegal</p>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <button onClick={() => navigate('profile')} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-sm font-bold ring-1 ring-white/20 hover:bg-white/25 transition-colors">
                  {user.name?.[0] || 'U'}
                </button>
              ) : (
                <Button size="sm" variant="ghost" className="text-white/90 hover:bg-white/15 font-semibold text-sm h-9 px-4" onClick={() => navigate('login')}>
                  Connexion
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60" />
            <Input placeholder="Rechercher une annonce..." className="pl-11 pr-12 h-[50px] rounded-2xl bg-white/[0.97] text-foreground shadow-premium border-0 text-[15px] placeholder:text-muted-foreground/50" value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl gradient-majaay shadow-sm hover:opacity-90" onClick={handleSearch}>
              <Search className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-7">
        {/* Quick Actions */}
        <div className="flex gap-2.5 mb-8 overflow-x-auto no-scrollbar -mx-1 px-1">
          {[
            { icon: Plus, label: 'Publier', page: 'create-listing', needsAuth: true, color: 'text-terracotta bg-terracotta/8' },
            { icon: TrendingUp, label: 'Tendances', page: 'search', needsAuth: false, color: 'text-gold bg-gold/10' },
            { icon: Crown, label: 'Premium', page: 'plans', needsAuth: true, color: 'text-accent bg-accent/8' },
          ].map((a) => (
            <button key={a.page} onClick={() => (!a.needsAuth || user) ? navigate(a.page) : navigate('login')}
              className={`flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-2xl font-medium text-[13px] shadow-sm border border-border/60 hover:shadow-card-hover transition-all duration-200 whitespace-nowrap ${a.color}`}>
              <a.icon className="w-[18px] h-[18px]" strokeWidth={2} />{a.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold tracking-tight">Explorer par categorie</h2>
            <Button variant="ghost" size="sm" className="text-terracotta text-[13px] font-medium h-8" onClick={() => navigate('search')}>
              Tout voir <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-[60px] h-[60px] rounded-2xl" />
                  <Skeleton className="w-14 h-3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {categories.map((cat: any) => (
                <button key={cat.id} className="flex flex-col items-center gap-1.5 group animate-fade-up"
                  style={{ animationDelay: `${categories.indexOf(cat) * 40}ms` }}
                  onClick={() => navigate('search', { categoryId: cat.id, categoryName: cat.name })}>
                  <CategoryIcon slug={cat.slug} size={26} className="group-hover:scale-105 transition-transform" />
                  <span className="text-[11px] text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Featured / Boosted */}
        {featuredListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
              </div>
              <h2 className="text-[16px] font-bold tracking-tight">Annonces en vedette</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {featuredListings.map((l: any) => {
                const hasImg = l.images && l.images !== '[]';
                const img = hasImg ? JSON.parse(l.images)[0] : null;
                return (
                  <Card key={l.id} className="min-w-[240px] max-w-[240px] cursor-pointer shadow-sm hover:shadow-card-hover transition-all duration-300 overflow-hidden flex-shrink-0 border-0 group"
                    onClick={() => navigate('listing-detail', { id: l.id })}>
                    <div className="relative h-[140px] bg-muted overflow-hidden">
                      {img ? (
                        <img src={img} alt={l.title} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                          <CategoryIcon slug={l.category?.slug || 'alimentation'} size={28} />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur text-white text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-md">
                        <Zap className="w-2.5 h-2.5 fill-current" /> Boostee
                      </Badge>
                    </div>
                    <CardContent className="p-3 pt-2.5">
                      <h3 className="font-semibold text-[13px] line-clamp-1 mb-1">{l.title}</h3>
                      <p className="text-terracotta font-bold text-sm">{formatPrice(l.price)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold tracking-tight">Dernieres annonces</h2>
            <Button variant="ghost" size="sm" className="text-terracotta text-[13px] font-medium h-8" onClick={() => navigate('search')}>
              Tout voir <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-0"><Skeleton className="aspect-[4/3]" /><div className="p-3"><Skeleton className="h-3.5 mb-2 rounded" /><Skeleton className="h-5 w-24 rounded" /></div></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map((l, i) => renderListingCard(l, i))}
            </div>
          )}
        </div>

        {/* Trust Banner */}
        <Card className="border-0 shadow-premium overflow-hidden mb-6">
          <div className="gradient-majaay-dark p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] mb-1 text-white">Transactions securisees</h3>
                <p className="text-[12px] text-white/60 leading-relaxed">Vendeurs verifies CNI/NINEA. Paiement mobile money : Wave, Orange Money, Free Money.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Prix sur demande';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}
