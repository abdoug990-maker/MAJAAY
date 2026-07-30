'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, X, MapPin, Shield, Zap, ArrowLeft } from 'lucide-react';
import { formatPrice, getCategoryEmoji } from './HomePage';
import { CITIES } from '@/lib/seed';

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
    const load = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!cancelled) setCategories(await res.json());
      } catch { /* ignore */ }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (search) sp.set('search', search);
        if (selectedCategory) sp.set('categoryId', selectedCategory);
        if (selectedCity) sp.set('city', selectedCity);
        if (selectedCondition) sp.set('condition', selectedCondition);
        if (sortBy) sp.set('sortBy', sortBy);
        sp.set('limit', '50');
        const res = await fetch(`/api/listings?${sp.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          setListings(data.listings || []);
          setTotal(data.total || 0);
        }
      } catch (err) { console.error(err); }
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, [search, selectedCategory, selectedCity, selectedCondition, sortBy]);

  const handleSearch = () => {
    // The effect already watches search, so pressing Enter just needs to trigger re-render
    // No-op since the effect depends on search directly
  };

  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setSelectedCity(''); setSelectedCondition(''); setSortBy('recent');
  };

  const hasActiveFilters = search || selectedCategory || selectedCity || selectedCondition;

  return (
    <div className="min-h-screen pb-20 px-4">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b py-3 -mx-4 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 pr-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {search && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setSearch('')} />}
          </div>
          <Button variant="outline" size="icon" className={`flex-shrink-0 ${showFilters ? 'bg-terracotta text-white border-terracotta' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mt-4 border-terracotta/20">
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Catégorie</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: any) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    className={`cursor-pointer ${selectedCategory === cat.id ? 'bg-terracotta' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                  >
                    {getCategoryEmoji(cat.slug)} {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Ville</p>
              <div className="flex flex-wrap gap-2">
                {['Dakar', 'Pikine', 'Thiès', 'Rufisque', 'Saint-Louis', 'Ziguinchor'].map((city) => (
                  <Badge
                    key={city}
                    variant={selectedCity === city ? 'default' : 'outline'}
                    className={`cursor-pointer ${selectedCity === city ? 'bg-terracotta' : ''}`}
                    onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                  >{city}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">État</p>
              <div className="flex gap-2">
                {[{ v: 'neuf', l: 'Neuf' }, { v: 'usage', l: 'Usage' }, { v: 'reconditionne', l: 'Reconditionné' }].map((c) => (
                  <Badge
                    key={c.v}
                    variant={selectedCondition === c.v ? 'default' : 'outline'}
                    className={`cursor-pointer ${selectedCondition === c.v ? 'bg-terracotta' : ''}`}
                    onClick={() => setSelectedCondition(selectedCondition === c.v ? '' : c.v)}
                  >{c.l}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Trier par</p>
              <div className="flex flex-wrap gap-2">
                {[{ v: 'recent', l: 'Plus récent' }, { v: 'popular', l: 'Plus populaire' }, { v: 'price-asc', l: 'Prix croissant' }, { v: 'price-desc', l: 'Prix décroissant' }].map((s) => (
                  <Badge
                    key={s.v}
                    variant={sortBy === s.v ? 'default' : 'outline'}
                    className={`cursor-pointer ${sortBy === s.v ? 'bg-terracotta' : ''}`}
                    onClick={() => setSortBy(s.v)}
                  >{s.l}</Badge>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" /> Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <p className="text-sm text-muted-foreground">{total} résultat{total !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden"><Skeleton className="aspect-[4/3]" /><div className="p-3"><Skeleton className="h-4 mb-2" /><Skeleton className="h-5 w-24" /></div></Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-muted-foreground">Aucun résultat trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">Essayez d&apos;autres mots-clés ou filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {listings.map((listing: any) => {
            const hasImages = listing.images && listing.images !== '[]';
            const firstImage = hasImages ? JSON.parse(listing.images)[0] : null;
            return (
              <Card key={listing.id} className="cursor-pointer hover:shadow-lg transition-all overflow-hidden group"
                onClick={() => navigate('listing-detail', { id: listing.id })}>
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {firstImage ? (
                    <img src={firstImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center gradient-majaay"><span className="text-white/60 text-3xl font-bold">MJ</span></div>
                  )}
                  {listing.isBoosted && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] flex items-center gap-1"><Zap className="w-3 h-3" /></Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{listing.title}</h3>
                  <p className="text-primary font-bold text-sm">{formatPrice(listing.price)}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" /><span className="truncate">{listing.city}</span>
                  </div>
                  {listing.seller?.isVerifiedSeller && <div className="flex items-center gap-1 mt-1"><Shield className="w-3 h-3 text-accent" /><span className="text-[10px] text-accent">Vérifié</span></div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
