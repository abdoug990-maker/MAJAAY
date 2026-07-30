'use client';

import { useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Zap, Star, Crown, X } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    tier: 'free',
    name: 'Gratuit',
    price: 0,
    icon: '🆓',
    color: 'border-muted',
    popular: false,
    features: [
      { text: '3 annonces actives', included: true },
      { text: '3 photos par annonce', included: true },
      { text: 'Visibilité standard', included: true },
      { text: 'Badge vendeur', included: false },
      { text: 'Statistiques', included: false },
      { text: 'Support prioritaire', included: false },
    ],
  },
  {
    tier: 'standard',
    name: 'Standard',
    price: 2200,
    icon: '🥈',
    color: 'border-accent',
    popular: false,
    features: [
      { text: 'Annonces illimitées', included: true },
      { text: '5 photos + 1 vidéo', included: true },
      { text: 'Badge "Standard"', included: true },
      { text: 'Statistiques de base', included: true },
      { text: 'Support par chat', included: true },
      { text: 'Mise en avant boutique', included: false },
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 3600,
    icon: '⭐',
    color: 'border-terracotta',
    popular: true,
    features: [
      { text: 'Annonces illimitées', included: true },
      { text: '10 photos + 2 vidéos', included: true },
      { text: 'Badge "Premium" doré', included: true },
      { text: 'Priorité dans les résultats', included: true },
      { text: 'Statistiques avancées', included: true },
      { text: 'Support prioritaire', included: true },
    ],
  },
  {
    tier: 'premium_plus',
    name: 'Premium+',
    price: 7000,
    icon: '👑',
    color: 'border-amber-400',
    popular: false,
    features: [
      { text: 'Boutique personnalisée URL', included: true },
      { text: 'Photos et vidéos illimitées', included: true },
      { text: 'Badge doré animé', included: true },
      { text: 'Ma Jaay Ads Manager', included: true },
      { text: 'Alertes acheteurs temps réel', included: true },
      { text: 'Export catalogue PDF/Excel', included: true },
    ],
  },
];

export function PlansPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (tier: string, price: number) => {
    if (!user) { navigate('login'); return; }
    if (price === 0) { toast.info('Vous êtes déjà sur le plan gratuit !'); return; }
    setSubscribing(tier);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tier }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh user data
        const checkRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check', userId: user.id }),
        });
        const checkData = await checkRes.json();
        if (checkData.user) {
          useAuthStore.getState().setUser(checkData.user);
        }
        toast.success(`Bienvenue sur le plan ${tier === 'premium_plus' ? 'Premium+' : tier === 'premium' ? 'Premium' : 'Standard'} !`);
        navigate('profile');
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Erreur lors de l\'abonnement'); }
    finally { setSubscribing(null); }
  };

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b py-3 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-lg font-bold">Abonnements</h1>
            <p className="text-xs text-muted-foreground">Choisissez le plan qui vous convient</p>
          </div>
        </div>
      </div>

      {/* Boost Banner */}
      <Card className="mt-4 border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Zap className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-amber-900">Boostez vos annonces à la carte</p>
            <p className="text-xs text-amber-700">1 000 FCFA = 2 jours en tête de liste + badge "Sponsorisé"</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700" onClick={() => navigate('my-listings')}>
            Booster
          </Button>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="mt-6 space-y-4">
        {PLANS.map((plan) => {
          const isCurrent = user?.subscriptionTier === plan.tier;
          return (
            <Card key={plan.tier} className={`${plan.color} ${plan.popular ? 'ring-2 ring-terracotta relative' : ''} overflow-hidden`}>
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg gradient-majaay text-white text-[10px]">Populaire</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{plan.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {plan.price === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA/mois`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {f.included ? <Check className="w-4 h-4 text-accent flex-shrink-0" /> : <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />}
                      <span className={f.included ? '' : 'text-muted-foreground/60'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-4 h-11 ${isCurrent ? 'bg-muted text-muted-foreground' : plan.tier === 'free' ? '' : 'gradient-majaay text-white'} font-semibold`}
                  variant={plan.tier === 'free' ? 'outline' : 'default'}
                  disabled={isCurrent || (subscribing === plan.tier)}
                  onClick={() => handleSubscribe(plan.tier, plan.price)}
                >
                  {isCurrent ? 'Plan actuel' : plan.price === 0 ? 'Plan actuel' : subscribing === plan.tier ? 'Chargement...' : `S\'abonner - ${new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-muted-foreground mt-6 mb-4">
        Paiement par mobile money : Wave, Orange Money, Free Money. En démo, le paiement est simulé.
      </p>
    </div>
  );
}