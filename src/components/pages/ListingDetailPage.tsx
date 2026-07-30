'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Eye, Clock, Shield, MessageCircle, Zap, Heart, Share2, Phone, Flag } from 'lucide-react';
import { formatPrice, getCategoryEmoji } from './HomePage';
import { toast } from 'sonner';

export function ListingDetailPage() {
  const { params, navigate } = useRouterStore();
  const user = useAuthStore((s) => s.user);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/listings/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setListing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleContact = () => {
    if (!user) { navigate('login'); return; }
    navigate('chat-conversation', { listingId: listing.id, sellerId: listing.seller.id, sellerName: listing.seller.name, listingTitle: listing.title });
  };

  const handleBoost = async () => {
    if (!user) { navigate('login'); return; }
    try {
      const res = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, userId: user.id, durationHours: 48, amount: 1000 }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Annonce boostée ! Elle sera visible en tête de liste pendant 48h.');
        setListing({ ...listing, isBoosted: true });
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Erreur lors du boost'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 px-4">
        <Skeleton className="h-64 w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">Annonce non trouvée</p>
        <Button onClick={() => navigate('home')}>Retour</Button>
      </div>
    );
  }

  const images = listing.images && listing.images !== '[]' ? JSON.parse(listing.images) : [];
  const isOwner = user && user.id === listing.sellerId;
  const tierColors: Record<string, string> = {
    premium_plus: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white',
    premium: 'bg-terracotta text-white',
    standard: 'bg-accent text-accent-foreground',
    free: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Back Button Overlay */}
      <div className="relative">
        <Button variant="ghost" size="icon" className="absolute top-12 left-2 z-10 bg-white/80 backdrop-blur rounded-full" onClick={() => navigate('home')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {images.length > 0 ? (
          <img src={images[0]} alt={listing.title} className="w-full h-64 md:h-96 object-cover" />
        ) : (
          <div className="w-full h-64 md:h-96 gradient-majaay flex items-center justify-center">
            <span className="text-white/60 text-6xl font-bold">{getCategoryEmoji(listing.category?.slug)}</span>
          </div>
        )}
        {listing.isBoosted && (
          <Badge className="absolute top-14 right-2 bg-amber-500 text-white badge-boosted flex items-center gap-1">
            <Zap className="w-3 h-3" /> Sponsorisé
          </Badge>
        )}
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary" className="text-[11px]">{listing.category?.name}</Badge>
              <Badge className={`${tierColors[listing.seller?.subscriptionTier || 'free']} text-[10px]`}>
                {listing.seller?.subscriptionTier === 'premium_plus' ? 'Premium+' : listing.seller?.subscriptionTier === 'premium' ? 'Premium' : listing.seller?.subscriptionTier === 'standard' ? 'Standard' : 'Gratuit'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-2">{listing.title}</h1>
            <p className="text-2xl font-bold text-terracotta mb-3">{formatPrice(listing.price)}</p>
            {listing.negotiable && listing.price && (
              <Badge variant="outline" className="mb-3">Prix négociable</Badge>
            )}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{listing.city}{listing.location ? ` · ${listing.location}` : ''}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{listing.views} vues</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(listing.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex gap-2 mb-3">
              <Badge variant="outline">{listing.condition === 'neuf' ? 'Neuf' : listing.condition === 'reconditionne' ? 'Reconditionné' : 'Usage'}</Badge>
              {listing.category && <Badge variant="outline">{getCategoryEmoji(listing.category.slug)} {listing.category.name}</Badge>}
            </div>
            {listing.description && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seller Info */}
        <Card className="mt-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-majaay flex items-center justify-center text-white font-bold text-lg">
                {listing.seller?.name?.[0] || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{listing.seller?.name}</span>
                  {listing.seller?.isVerifiedSeller && <Shield className="w-4 h-4 text-accent" />}
                </div>
                <span className="text-xs text-muted-foreground">Membre Ma Jaay</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isOwner && (
          <div className="mt-4 space-y-3">
            <Button className="w-full h-12 gradient-majaay text-white font-semibold flex items-center gap-2" onClick={handleContact}>
              <MessageCircle className="w-5 h-5" /> Contacter le vendeur
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 flex items-center gap-2" onClick={() => toast.info('Appel direct bientôt disponible !')}>
                <Phone className="w-4 h-4" /> Appeler
              </Button>
              <Button variant="outline" className="flex-1 h-11 flex items-center gap-2" onClick={() => toast.info('Partagé !')}>
                <Share2 className="w-4 h-4" /> Partager
              </Button>
            </div>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="mt-4 space-y-3">
            {!listing.isBoosted && (
              <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2" onClick={handleBoost}>
                <Zap className="w-5 h-5" /> Booster cette annonce (1 000 FCFA / 48h)
              </Button>
            )}
            {listing.isBoosted && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-800">Annonce boostée</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
