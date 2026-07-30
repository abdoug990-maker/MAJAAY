'use client';

import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, LogOut, Crown, Shield, Settings, CreditCard, FileText, BarChart3, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';

const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  premium_plus: { label: 'Premium+', color: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white', icon: '👑' },
  premium: { label: 'Premium', color: 'bg-terracotta text-white', icon: '⭐' },
  standard: { label: 'Standard', color: 'bg-accent text-accent-foreground', icon: '🥈' },
  free: { label: 'Gratuit', color: 'bg-muted text-muted-foreground', icon: '🆓' },
};

export function ProfilePage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout } = useAuthStore();

  if (!user) { navigate('login'); return null; }

  const tier = TIER_LABELS[user.subscriptionTier] || TIER_LABELS.free;

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté');
    navigate('home');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-majaay-dark text-white px-4 pt-12 pb-8 -mx-4 -mt-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('home')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Mon profil</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user.name?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.name || 'Utilisateur'}</h2>
              {user.isVerifiedSeller && <ShieldCheck className="w-5 h-5 text-green-400" />}
            </div>
            <p className="text-white/70 text-sm">{user.phone}</p>
            <Badge className={`${tier.color} mt-1 text-xs`}>{tier.icon} {tier.label}</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Quick Stats */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-terracotta">3</p>
                <p className="text-[11px] text-muted-foreground">Annonces</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">48</p>
                <p className="text-[11px] text-muted-foreground">Vues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">12</p>
                <p className="text-[11px] text-muted-foreground">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <MenuItem icon={FileText} label="Mes annonces" subtitle="Gérer vos publications" onClick={() => navigate('my-listings')} />
            <Separator />
            <MenuItem icon={Crown} label="Abonnements" subtitle="Passer au plan supérieur" onClick={() => navigate('plans')} />
            <Separator />
            <MenuItem icon={BarChart3} label="Statistiques" subtitle="Vues, contacts, performances" onClick={() => toast.info('Bientôt disponible !')} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <MenuItem icon={Settings} label="Paramètres" subtitle="Nom, photo, localisation" onClick={() => toast.info('Bientôt disponible !')} />
            <Separator />
            <MenuItem icon={Shield} label="Vérification vendeur" subtitle={user.isVerifiedSeller ? 'Vérifié ✓' : 'Devenez vendeur vérifié'} onClick={() => toast.info('Bientôt disponible !')} />
            <Separator />
            <MenuItem icon={CreditCard} label="Moyens de paiement" subtitle="Wave, Orange Money, Free Money" onClick={() => toast.info('Bientôt disponible !')} />
          </CardContent>
        </Card>

        {user.role === 'admin' && (
          <Card className="shadow-sm border-amber-300">
            <CardContent className="p-0">
              <MenuItem icon={Shield} label="Panneau Admin" subtitle="Modération, statistiques" onClick={() => navigate('admin')} className="text-amber-700" />
            </CardContent>
          </Card>
        )}

        <Button variant="ghost" className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-2" onClick={handleLogout}>
          <LogOut className="w-5 h-5" /> Se déconnecter
        </Button>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, subtitle, onClick, className }: { icon: any; label: string; subtitle: string; onClick: () => void; className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${className || ''}`} onClick={onClick}>
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}