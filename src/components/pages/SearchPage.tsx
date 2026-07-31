'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, X, MapPin, Shield, Zap, ArrowLeft, SearchX, Car, Building2, Smartphone, Shirt, Home, Briefcase, Dumbbell, ShoppingBasket, Package } from 'lucide-react';
import { formatPrice } from './HomePage';

const ICON_MAP: Record<string, React.FC<any>> = { vehicules: Car, immobilier: Building2, electronique: Smartphone, 'mode-beaute': Shirt, 'maison-jardin': Home, 'emploi-services': Briefcase, 'loisirs-sport': Dumbbell, alimentation: ShoppingBasket };

export function SearchPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { params } = useRouterStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.q || '');
  const [selectedCategory, setSelectedCategory] = useState(params.categoryId || '');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories').then((r) => r.json()).then((d) => { if (!cancelled) setCategories(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (search) sp.set('search', search);
        if (selectedCategory) sp.set('categoryId', selectedCategory);
        if (selectedCity) sp.set('city', selectedCity);
        if (selectedCondition) sp.set('condition', selectedCondition);
        if (sortBy) sp.set('sortBy', sortBy);
        sp.set('limit', '50');
        const res = await fetch(`/api/listings?${sp}`);
        const data = await res.json();
        if (!cancelled) { setListings(data.listings || []); setTotal(data.total || 0); }
      } catch { /* */ }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [search, selectedCategory, selectedCity, selectedCondition, sortBy]);

  const clearFilters = () => { setSearch(''); setSelectedCategory(''); setSelectedCity(''); setSelectedCondition(''); setSortBy('recent'); };
  const hasFilters = search || selectedCategory || selectedCity || selectedCondition;

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="sticky top-0 z-20 glass border-b border-border/50 py-3 -mx-4 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input placeholder="Rechercher..." className="pl-9 pr-9 h-10 rounded-xl" value={search}
              onChange={(e) => setSearch(e.target.value)} />
            {search && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setSearch('')} />}
          </div>
          <Button variant="outline" size="icon" className={`flex-shrink-0 h-9 w-9 rounded-xl ${showFilters ? 'bg-terracotta text-white border-terracotta' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-3 p-4 bg-card rounded-2xl shadow-premium border-0 space-y-4">
          <div>
            <p className="text-[13px] font-semibold mb-2">Catégorie</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: any) => {
                return (
                  <Badge key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    className={`cursor-pointer flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[12px] ${selectedCategory === cat.id ? 'bg-terracotta' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}>
                    {(ICON_MAP[cat.slug] || Package)({ size: 12, strokeWidth: 1.5 })} {cat.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold mb-2">Ville</p>
            <div className="flex flex-wrap gap-2">
              {['Dakar', 'Pikine', 'Thiès', 'Rufisque', 'Saint-Louis', 'Ziguinchor'].map((city) => (
                <Badge key={city} variant={selectedCity === city ? 'default' : 'outline'}
                  className={`cursor-pointer py-1 px-2.5 rounded-lg text-[12px] ${selectedCity === city ? 'bg-terracotta' : ''}`}
                  onClick={() => setSelectedCity(selectedCity === city ? '' : city)}>{city}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold mb-2">État</p>
            <div className="flex gap-2">
              {[{ v: 'neuf', l: 'Neuf' }, { v: 'usage', l: 'Usage' }, { v: 'reconditionne', l: 'Reconditionné' }].map((c) => (
                <Badge key={c.v} variant={selectedCondition === c.v ? 'default' : 'outline'}
                  className={`cursor-pointer py-1 px-2.5 rounded-lg text-[12px] ${selectedCondition === c.v ? 'bg-terracotta' : ''}`}
                  onClick={() => setSelectedCondition(selectedCondition === c.v ? '' : c.v)}>{c.l}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold mb-2">Trier par</p>
            <div className="flex flex-wrap gap-2">
              {[{ v: 'recent', l: 'Récent' }, { v: 'popular', l: 'Populaire' }, { v: 'price-asc', l: 'Prix +' }, { v: 'price-desc', l: 'Prix -' }].map((s) => (
                <Badge key={s.v} variant={sortBy === s.v ? 'default' : 'outline'}
                  className={`cursor-pointer py-1 px-2.5 rounded-lg text-[12px] ${sortBy === s.v ? 'bg-terracotta' : ''}`}
                  onClick={() => setSortBy(s.v)}>{s.l}</Badge>
              ))}
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="text-destructive text-[12px]" onClick={clearFilters}>
              <X className="w-3.5 h-3.5 mr-1" /> Effacer les filtres
            </Button>
          )}
        </div>
      )}

      <p className="text-[13px] text-muted-foreground mt-4 mb-3 font-medium">{total} résultat{total !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="overflow-hidden border-0"><Skeleton className="aspect-[4/3]" /><div className="p-3"><Skeleton className="h-3.5 mb-2 rounded" /><Skeleton className="h-5 w-24 rounded" /></div></Card>)}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center"><SearchX className="w-7 h-7 text-muted-foreground/40" /></div>
          <p className="font-medium text-[15px] mb-1">Aucun résultat</p>
          <p className="text-[13px] text-muted-foreground">Essayez d'autres filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {listings.map((listing: any) => {
            const hasImg = listing.images && listing.images !== '[]';
            const img = hasImg ? JSON.parse(listing.images)[0] : null;
            const CatIcon = listing.category?.slug ? (ICON_MAP[listing.category.slug] || Package) : Package;
            return (
              <Card key={listing.id} className="cursor-pointer shadow-sm hover:shadow-card-hover transition-all duration-300 overflow-hidden border-0 group"
                onClick={() => navigate('listing-detail', { id: listing.id })}>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {img ? (
                    <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60"><CatIcon size={28} strokeWidth={1} className="text-muted-foreground/30" /></div>
                  )}
                  {listing.isBoosted && <Badge className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur text-white text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md"><Zap className="w-2.5 h-2.5 fill-current" /></Badge>}
                </div>
                <CardContent className="p-3 pt-2.5">
                  <h3 className="font-semibold text-[13px] line-clamp-2 mb-1">{listing.title}</h3>
                  <p className="text-terracotta font-bold text-sm">{formatPrice(listing.price)}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                    <MapPin className="w-3 h-3" /><span className="truncate">{listing.city}</span>
                    {listing.seller?.isVerifiedSeller && <Shield className="w-3 h-3 text-accent ml-auto" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}