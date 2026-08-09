'use client';

import { useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Zap, Star, Crown, X, Gem, Medal, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import { getAuthHeaders } from '@/lib/client-auth';

const PLANS = [
  {
    tier: 'free', name: 'Gratuit', price: 0,
    Icon: () => <Medal className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />,
    color: 'border-border/60', popular: false,
    features: [
      { text: '3 annonces actives', ok: true },
      { text: '3 photos par annonce', ok: true },
      { text: 'Visibilité standard', ok: true },
      { text: 'Badge vendeur', ok: false },
      { text: 'Statistiques', ok: false },
      { text: 'Support prioritaire', ok: false },
    ],
  },
  {
    tier: 'standard', name: 'Standard', price: 2200,
    Icon: () => <Star className="w-6 h-6 text-accent" strokeWidth={1.5} />,
    color: 'border-accent/40', popular: false,
    features: [
      { text: 'Annonces illimitées', ok: true },
      { text: '5 photos + 1 vidéo', ok: true },
      { text: 'Badge "Standard"', ok: true },
      { text: 'Statistiques de base', ok: true },
      { text: 'Support par chat', ok: true },
      { text: 'Mise en avant boutique', ok: false },
    ],
  },
  {
    tier: 'premium', name: 'Premium', price: 3600,
    Icon: () => <Crown className="w-6 h-6 text-terracotta" strokeWidth={1.5} />,
    color: 'border-terracotta/40', popular: true,
    features: [
      { text: 'Annonces illimitées', ok: true },
      { text: '10 photos + 2 vidéos', ok: true },
      { text: 'Badge "Premium" doré', ok: true },
      { text: 'Priorité résultats', ok: true },
      { text: 'Statistiques avancées', ok: true },
      { text: 'Support prioritaire', ok: true },
    ],
  },
  {
    tier: 'premium_plus', name: 'Premium+', price: 7000,
    Icon: () => <Gem className="w-6 h-6 text-gold" strokeWidth={1.5} />,
    color: 'border-gold/40', popular: false,
    features: [
      { text: 'Boutique personnalisée URL', ok: true },
      { text: 'Photos et vidéos illimitées', ok: true },
      { text: 'Badge doré animé', ok: true },
      { text: 'Ma Jaay Ads Manager', ok: true },
      { text: 'Alertes acheteurs temps réel', ok: true },
      { text: 'Export catalogue PDF/Excel', ok: true },
    ],
  },
];

export function PlansPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (tier: string, price: number) => {
    if (!user) { navigate('login'); return; }
    if (price === 0) { toast.info('Le plan gratuit ne permet pas de publier.'); return; }
    setSubscribing(tier);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de créer la demande.');
      if (data.waveUrl) window.open(data.waveUrl, '_blank', 'noopener,noreferrer');
      toast.success('Paiement Wave ouvert. Après paiement, l’administrateur validera votre abonnement.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    } finally { setSubscribing(null); }
  };

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="sticky top-0 z-20 glass border-b border-border/50 py-3 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight">Abonnements</h1>
            <p className="text-[11px] text-muted-foreground">Choisissez votre plan</p>
          </div>
        </div>
      </div>

      {/* Boost banner */}
      <Card className="mt-4 border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3 bg-amber-50/80">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-amber-600" fill="currentColor" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[13px]">Boost à la carte</p>
            <p className="text-[11px] text-muted-foreground">1 000 FCFA = 48h en tête de liste</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 h-8 rounded-lg text-[12px]" onClick={() => navigate('my-listings')}>Booster</Button>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="mt-5 space-y-3">
        {PLANS.map((plan) => {
          const isCurrent = user?.subscriptionTier === plan.tier;
          return (
            <Card key={plan.tier} className={`${plan.color} ${plan.popular ? 'ring-2 ring-terracotta shadow-premium' : 'shadow-sm'} rounded-2xl overflow-hidden border-0 relative`}>
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-xl gradient-majaay text-white text-[10px] font-medium px-3 py-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Populaire
                  </Badge>
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><plan.Icon /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[16px]">{plan.name}</h3>
                    <p className="text-[13px] text-muted-foreground">
                      {plan.price === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA/mois`}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px]">
                      {f.ok ? (
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-accent" strokeWidth={3} /></div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-muted-foreground/30" /></div>
                      )}
                      <span className={f.ok ? '' : 'text-muted-foreground/50'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full h-11 rounded-xl font-semibold text-[14px] ${
                  isCurrent ? 'bg-muted text-muted-foreground' : plan.tier === 'free' ? 'border' : 'gradient-majaay text-white shadow-md shadow-terracotta/20'
                }`} variant={plan.tier === 'free' ? 'outline' : 'default'}
                  disabled={isCurrent || subscribing === plan.tier}
                  onClick={() => handleSubscribe(plan.tier, plan.price)}>
                  {isCurrent ? 'Plan actuel' : plan.price === 0 ? 'Plan actuel' : subscribing === plan.tier ? 'Chargement...' : `S'abonner — ${new Intl.NumberFormat('fr-FR').format(plan.price)} F`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-muted-foreground mt-5 mb-4">
        Paiement : Wave · Validation manuelle après paiement
      </p>
    </div>
  );
}