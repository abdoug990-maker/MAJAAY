'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Building2, Smartphone, Shirt, Home, Briefcase, Dumbbell, ShoppingBasket, Package, ArrowLeft, MapPin, Eye, Clock, Shield, MessageCircle, Zap, Share2, Phone, Heart, ChevronLeft } from 'lucide-react';
import { formatPrice } from './HomePage';
import { getCategoryStyle } from '@/lib/category-icons';
import { toast } from 'sonner';
import React from 'react';

const ICON_MAP: Record<string, React.FC<any>> = { vehicules: Car, immobilier: Building2, electronique: Smartphone, 'mode-beaute': Shirt, 'maison-jardin': Home, 'emploi-services': Briefcase, 'loisirs-sport': Dumbbell, alimentation: ShoppingBasket };

export function ListingDetailPage() {
  const { params, navigate, goBack } = useRouterStore();
  const user = useAuthStore((s) => s.user);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

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

  const handleCall = () => {
    if (!user) { navigate('login'); return; }
    if (!listing.seller?.phone) { toast.info('Ce vendeur n’a pas renseigné de numéro public. Utilisez la messagerie.'); return; }
    window.location.href = `tel:${listing.seller.phone}`;
  };

  const handleShare = async () => {
    const shareData = { title: listing.title, text: `Découvrez cette annonce sur Ma Jaay : ${listing.title}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(window.location.href); toast.success('Lien de l’annonce copié.'); }
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error('Impossible de partager cette annonce.');
    }
  };

  const handleBoost = async () => {
    if (!user) { navigate('login'); return; }
    try {
      const res = await fetch('/api/boosts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, userId: user.id, durationHours: 48, amount: 1000 }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Annonce boostée pendant 48h !'); setListing({ ...listing, isBoosted: true }); }
      else toast.error(data.error);
    } catch { toast.error('Erreur lors du boost'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <Skeleton className="h-72 w-full" />
        <div className="px-4 -mt-6"><Skeleton className="h-40 w-full rounded-2xl" /></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-3">
        <p className="text-muted-foreground">Annonce non trouvée</p>
        <Button variant="outline" onClick={() => navigate('home')}>Retour</Button>
      </div>
    );
  }

  const images = listing.images && listing.images !== '[]' ? JSON.parse(listing.images) : [];
  const isOwner = user && user.id === listing.sellerId;
  const CatIcon = listing.category?.slug ? (ICON_MAP[listing.category.slug] || Package) : Package;
  const catStyle = getCategoryStyle(listing.category?.slug);
  const tierConfig: Record<string, { label: string; cls: string }> = {
    premium_plus: { label: 'Premium+', cls: 'gradient-gold-shimmer text-white' },
    premium: { label: 'Premium', cls: 'gradient-majaay text-white' },
    standard: { label: 'Standard', cls: 'bg-accent text-accent-foreground' },
    free: { label: 'Gratuit', cls: 'bg-muted text-muted-foreground' },
  };
  const tier = tierConfig[listing.seller?.subscriptionTier || 'free'] || tierConfig.free;

  return (
    <div className="min-h-screen pb-24">
      {/* Image header */}
      <div className="relative bg-muted">
        <div className="absolute top-12 left-4 z-10 flex gap-2">
          <button onClick={() => goBack()} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-lg flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-12 right-4 z-10 flex gap-2">
          <button onClick={() => setLiked(!liked)} className={`w-9 h-9 rounded-full bg-black/30 backdrop-blur-lg flex items-center justify-center transition-colors ${liked ? 'text-red-400' : 'text-white'}`}>
            <Heart className="w-[18px] h-[18px]" fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {images.length > 0 ? (
          <img src={images[0]} alt={listing.title} className="w-full h-72 md:h-96 object-cover" />
        ) : (
          <div className="w-full h-72 md:h-96 flex items-center justify-center bg-gradient-to-b from-muted to-muted/50">
            <CatIcon size={48} strokeWidth={1} className="text-muted-foreground/25" />
          </div>
        )}
        {listing.isBoosted && (
          <Badge className="absolute bottom-4 left-4 bg-amber-500/95 backdrop-blur text-white text-[11px] font-medium badge-boosted flex items-center gap-1 px-2.5 py-1 rounded-lg">
            <Zap className="w-3.5 h-3.5 fill-current" /> Sponsorisé
          </Badge>
        )}
      </div>

      <div className="px-4 -mt-5 relative z-10">
        {/* Main card */}
        <Card className="shadow-premium border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${catStyle.bg} flex items-center justify-center`}>
                <CatIcon size={15} strokeWidth={1.5} className={catStyle.icon} />
              </div>
              <Badge variant="secondary" className="text-[11px] font-medium rounded-lg">{listing.category?.name}</Badge>
              <div className="flex-1" />
              <Badge className={`${tier.cls} text-[10px] font-medium rounded-lg px-2`}>{tier.label}</Badge>
            </div>

            <h1 className="text-[20px] font-bold leading-tight mb-2 tracking-tight">{listing.title}</h1>
            <p className="text-2xl font-extrabold text-terracotta tracking-tight mb-4">{formatPrice(listing.price)}</p>

            {listing.negotiable && listing.price && (
              <Badge variant="outline" className="mb-4 text-[11px] font-medium rounded-lg">Prix négociable</Badge>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{listing.city}{listing.location ? ` · ${listing.location}` : ''}</span>
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{listing.views} vues</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(listing.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>

            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="rounded-lg text-[11px] font-medium capitalize">{listing.condition === 'neuf' ? 'Neuf' : listing.condition === 'reconditionne' ? 'Reconditionné' : 'Usage'}</Badge>
            </div>

            {listing.description && (
              <div className="pt-3 border-t border-border/60">
                <h3 className="font-semibold text-[13px] mb-2 text-muted-foreground uppercase tracking-wider">Description</h3>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/85">{listing.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seller card */}
        <Card className="mt-3 shadow-sm border-0 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-majaay flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
              {listing.seller?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[14px] truncate">{listing.seller?.name}</span>
                {listing.seller?.isVerifiedSeller && <Shield className="w-4 h-4 text-accent" />}
              </div>
              <span className="text-[12px] text-muted-foreground">Membre Ma Jaay</span>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        {!isOwner && (
          <div className="mt-4 space-y-2.5">
            <Button className="w-full h-[50px] gradient-majaay text-white font-semibold text-[15px] rounded-2xl shadow-lg shadow-terracotta/20 flex items-center gap-2" onClick={handleContact}>
              <MessageCircle className="w-5 h-5" strokeWidth={2} /> Contacter le vendeur
            </Button>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-medium text-[13px] flex items-center gap-2" onClick={handleCall}>
                <Phone className="w-4 h-4" /> Appeler
              </Button>
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-medium text-[13px] flex items-center gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Partager
              </Button>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mt-4">
            {!listing.isBoosted ? (
              <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm" onClick={handleBoost}>
                <Zap className="w-4 h-4" strokeWidth={2} fill="currentColor" /> Booster (1 000 FCFA / 48h)
              </Button>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-500" fill="currentColor" />
                <span className="text-[13px] font-medium text-amber-800">Annonce boostée</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
