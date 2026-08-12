'use client';

import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, LogOut, Crown, Shield, Settings, CreditCard, FileText, BarChart3, ShieldCheck, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  premium_plus: { label: 'Premium+', color: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white', icon: '👑' },
  premium: { label: 'Premium', color: 'bg-terracotta text-white', icon: '⭐' },
  standard: { label: 'Standard', color: 'bg-accent text-accent-foreground', icon: '🥈' },
  free: { label: 'Gratuit', color: 'bg-muted text-muted-foreground', icon: '🆓' },
};

export function ProfilePage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout, setUser } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', location: user?.location || '', bio: user?.bio || '' });

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    fetch('/api/listings?limit=100').then((response) => response.json()).then((data) => setListings((data.listings || []).filter((listing: any) => listing.sellerId === user.id))).catch(() => setListings([]));
  }, [user?.id, navigate]);

  if (!user) return null;
  const tier = TIER_LABELS[user.subscriptionTier] || TIER_LABELS.free;
  const views = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
  const contacts = listings.reduce((sum, listing) => sum + (listing.contactCount || 0), 0);

  const handleLogout = () => { logout(); toast.success('Déconnecté'); navigate('home'); };
  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-profile', ...form }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de sauvegarder le profil.');
      setUser(data.user); setEditing(false); toast.success('Profil mis à jour.');
    } catch (error: any) { toast.error(error.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-majaay-dark -mx-4 -mt-4 px-4 pb-8 pt-12 text-white">
        <div className="mb-6 flex items-center gap-3"><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('home')}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-lg font-bold">Mon profil</h1></div>
        <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">{user.name?.[0] || 'U'}</div><div><div className="flex items-center gap-2"><h2 className="text-xl font-bold">{user.name || 'Utilisateur'}</h2>{user.isVerifiedSeller && <ShieldCheck className="h-5 w-5 text-green-400" />}</div><p className="text-sm text-white/70">{user.email}</p><Badge className={`${tier.color} mt-1 text-xs`}>{tier.icon} {tier.label}</Badge></div></div>
      </div>

      <div className="-mt-4 space-y-3 px-4">
        <Card className="shadow-md"><CardContent className="p-4"><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-2xl font-bold text-terracotta">{listings.length}</p><p className="text-[11px] text-muted-foreground">Annonces</p></div><div><p className="text-2xl font-bold text-gold">{views}</p><p className="text-[11px] text-muted-foreground">Vues</p></div><div><p className="text-2xl font-bold text-accent">{contacts}</p><p className="text-[11px] text-muted-foreground">Contacts</p></div></div></CardContent></Card>

        {editing && <Card className="border-terracotta/30 shadow-sm"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Modifier mon profil</h2><Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button></div><Input placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><Input placeholder="Ville ou localisation" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /><Input placeholder="Bio vendeur (facultatif)" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /><Button className="w-full gradient-majaay text-white" onClick={() => void saveProfile()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</Button></CardContent></Card>}

        <Card className="shadow-sm"><CardContent className="p-0"><MenuItem icon={FileText} label="Mes annonces" subtitle="Gérer vos publications" onClick={() => navigate('my-listings')} /><Separator /><MenuItem icon={Crown} label="Abonnements" subtitle="Passer au plan supérieur" onClick={() => navigate('plans')} /><Separator /><MenuItem icon={BarChart3} label="Statistiques" subtitle="Voir vos annonces et performances" onClick={() => navigate('my-listings')} /></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-0"><MenuItem icon={Settings} label="Paramètres" subtitle="Nom, téléphone, localisation et bio" onClick={() => { setForm({ name: user.name || '', phone: user.phone || '', location: user.location || '', bio: user.bio || '' }); setEditing(true); }} /><Separator /><MenuItem icon={Shield} label="Vérification vendeur" subtitle={user.isVerifiedSeller ? 'Vérifié ✓' : 'Découvrir les options vendeur'} onClick={() => navigate('plans')} /><Separator /><MenuItem icon={CreditCard} label="Moyens de paiement" subtitle="Gérer votre abonnement et paiement Wave" onClick={() => navigate('plans')} /></CardContent></Card>
        <Button variant="ghost" className="flex h-12 w-full items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}><LogOut className="h-5 w-5" /> Se déconnecter</Button>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, subtitle, onClick, className }: { icon: any; label: string; subtitle: string; onClick: () => void; className?: string }) {
  return <button type="button" className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${className || ''}`} onClick={onClick}><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="h-5 w-5 text-muted-foreground" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{subtitle}</p></div></button>;
}
