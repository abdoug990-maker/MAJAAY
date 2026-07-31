'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Eye, MessageCircle, Zap, Trash2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from './HomePage';

export function MyListingsPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    fetch(`/api/listings?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setListings((data.listings || []).filter((l: any) => l.sellerId === user.id));
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      const res = await fetch(`/api/listings?id=${id}&userId=${user!.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Annonce supprimée');
        setListings(listings.filter((l) => l.id !== id));
      }
    } catch { toast.error('Erreur'); }
  };

  const handleBoost = async (id: string) => {
    try {
      const res = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, userId: user!.id, durationHours: 48, amount: 1000 }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Annonce boostée !'); setListings(listings.map((l) => l.id === id ? { ...l, isBoosted: true } : l)); }
      else toast.error(data.error);
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b py-3 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-lg font-bold">Mes annonces</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <Button className="w-full h-11 gradient-majaay text-white font-semibold flex items-center gap-2" onClick={() => navigate('create-listing')}>
          <Plus className="w-5 h-5" /> Publier une nouvelle annonce
        </Button>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><Skeleton className="h-20 w-full" /></Card>)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-semibold">Aucune annonce</p>
            <p className="text-sm text-muted-foreground">Commencez par publier votre première annonce !</p>
          </div>
        ) : (
          listings.map((listing: any) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('listing-detail', { id: listing.id })}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                      {listing.isBoosted && <Badge className="bg-amber-500 text-white text-[10px] flex items-center gap-1"><Zap className="w-3 h-3" /> Boost</Badge>}
                    </div>
                    <p className="text-terracotta font-bold">{formatPrice(listing.price)}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{listing.contactCount}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {!listing.isBoosted && (
                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 text-xs" onClick={() => handleBoost(listing.id)}>
                      <Zap className="w-3.5 h-3.5 mr-1" /> Booster (1 000 F)
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => handleDelete(listing.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
