'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Users, FileText, AlertTriangle, TrendingUp, CreditCard,
  Shield, Crown, Search, RefreshCw, Eye, Ban, CheckCircle2,
  MessageSquare, ShieldCheck, Zap, X, Package, Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/client-auth';

async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(input, { ...init, headers: { ...authHeaders, ...(init.headers || {}) } });
}

type Tab = 'dashboard' | 'users' | 'listings' | 'subscriptions' | 'ads' | 'reports';

const TIER_BADGE: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  premium_plus: 'bg-purple-100 text-purple-700',
};

export function AdminPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auth = await adminFetch('/api/admin-auth');
        const authData = await auth.json();
        if (!authData.authenticated) { navigate('admin-login'); return; }
        const r = await adminFetch('/api/admin?type=stats');
        const d = await r.json();
        if (!cancelled && d.stats) setStats(d.stats);
      } catch { /* */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" /></div>;
  }

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { key: 'users', label: 'Utilisateurs', icon: Users, count: stats.users },
    { key: 'listings', label: 'Annonces', icon: FileText, count: stats.activeListings },
    { key: 'subscriptions', label: 'Abonnements', icon: CreditCard },
    { key: 'ads', label: 'Publicités', icon: Megaphone },
    { key: 'reports', label: 'Signalements', icon: AlertTriangle, count: stats.pendingReports },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="gradient-majaay-dark text-white px-4 pt-12 pb-6 -mx-4 -mt-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('home')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Super Admin</h1>
            <p className="text-white/60 text-xs">Panneau de contrôle Ma Jaay</p>
          </div>
          <img src="/logo.png" alt="" className="w-8 h-8 opacity-80" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/30' : 'bg-white/10'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {tab === 'dashboard' && <DashboardTab stats={stats} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'listings' && <ListingsTab />}
        {tab === 'subscriptions' && <SubscriptionsTab />}
        {tab === 'ads' && <AdsTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

/* ==================== DASHBOARD ==================== */
function DashboardTab({ stats }: { stats: any }) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat icon={Users} label="Utilisateurs" value={fmt(stats.users)} sub={`+${stats.newUsers} ce mois`} />
        <MiniStat icon={Package} label="Annonces actives" value={fmt(stats.activeListings)} sub={`+${stats.newListings} ce mois`} />
        <MiniStat icon={CreditCard} label="Revenus" value={`${fmt(stats.totalRevenue)}`} sub="FCFA" />
        <MiniStat icon={ShieldCheck} label="Vendeurs vérifiés" value={fmt(stats.sellers || 0)} sub={`sur ${stats.users}`} />
      </div>

      {/* Tier distribution */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Répartition des abonnements</h3>
          <div className="space-y-2">
            {(stats.tierCounts || []).map((t: any) => {
              const pct = stats.users > 0 ? Math.round((t._count / stats.users) * 100) : 0;
              return (
                <div key={t.subscriptionTier} className="flex items-center gap-3">
                  <Badge className={TIER_BADGE[t.subscriptionTier] || ''} variant="secondary">
                    {t.subscriptionTier === 'premium_plus' ? 'Premium+' : t.subscriptionTier === 'free' ? 'Gratuit' : t.subscriptionTier?.charAt(0).toUpperCase() + t.subscriptionTier?.slice(1)}
                  </Badge>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{t._count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={Users} label="Gérer utilisateurs" onClick={() => {}} />
            <ActionBtn icon={FileText} label="Modérer annonces" onClick={() => {}} />
            <ActionBtn icon={AlertTriangle} label="Signalements" onClick={() => {}} />
            <ActionBtn icon={CreditCard} label="Abonnements" onClick={() => {}} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== USERS ==================== */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await adminFetch('/api/admin?type=users&limit=50');
        const d = await r.json();
        if (!cancelled) { setUsers(d.users || []); setTotal(d.total || 0); }
      } catch { toast.error('Erreur chargement'); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = () => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await adminFetch(`/api/admin?type=users&limit=50&search=${encodeURIComponent(search)}`);
        const d = await r.json();
        if (!cancelled) { setUsers(d.users || []); setTotal(d.total || 0); }
      } catch { toast.error('Erreur'); }
      if (!cancelled) setLoading(false);
    })();
  };

  const updateUser = async (userId: string, data: any) => {
    try {
      const r = await adminFetch('/api/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update-user', userId, ...data }),
      });
      if (r.ok) {
        toast.success('Utilisateur mis à jour');
        setUsers(users.map((u) => u.id === userId ? { ...u, ...data } : u));
      }
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Nom ou téléphone..." className="pl-9 h-10" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        </div>
        <Button variant="outline" size="icon" className="h-10" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
      </div>

      <p className="text-xs text-muted-foreground">{total} utilisateur(s)</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-sm flex-shrink-0">
                    {u.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{u.name || 'Sans nom'}</h3>
                      {u.isVerifiedSeller && <ShieldCheck className="w-3.5 h-3.5 text-accent" />}
                      {u.role === 'admin' && <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">Admin</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.phone} · Inscrit {new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge className={TIER_BADGE[u.subscriptionTier] || ''} variant="secondary" >{u.subscriptionTier}</Badge>
                      {u.isVerified ? <Badge className="bg-green-100 text-green-700 text-[10px]">Vérifié</Badge> : <Badge variant="outline" className="text-[10px]">Non vérifié</Badge>}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t flex-wrap">
                  <ActionPill icon={Crown} label="Tier" onClick={() => {
                    const tiers = ['free', 'standard', 'premium', 'premium_plus'];
                    const next = tiers[(tiers.indexOf(u.subscriptionTier) + 1) % tiers.length];
                    updateUser(u.id, { subscriptionTier: next });
                  }} />
                  <ActionPill icon={ShieldCheck} label={u.isVerifiedSeller ? 'Retirer vérif.' : 'Vérifier'} onClick={() => updateUser(u.id, { isVerifiedSeller: !u.isVerifiedSeller })} />
                  <ActionPill icon={u.role === 'admin' ? Ban : Shield} label={u.role === 'admin' ? 'Retirer admin' : 'Rendre admin'} onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })} />
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Aucun utilisateur trouvé</p>}
        </div>
      )}
    </div>
  );
}

/* ==================== LISTINGS ==================== */
function ListingsTab() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = async () => {
    try {
      const r = await adminFetch('/api/listings?limit=50');
      const d = await r.json();
      setListings(d.listings || []);
    } catch { toast.error('Erreur'); }
    setLoading(false);
  };

  useEffect(() => { loadListings(); }, []);

  const moderate = async (id: string) => {
    try {
      await adminFetch(`/api/admin?type=listing&id=${id}`, { method: 'DELETE' });
      toast.success('Annonce modérée');
      setListings(listings.filter((l) => l.id !== id));
    } catch { toast.error('Erreur'); }
  };

  const toggleBoost = async (listing: any) => {
    try {
      await adminFetch('/api/listings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listing.id, data: { isBoosted: !listing.isBoosted, boostExpiresAt: !listing.isBoosted ? new Date(Date.now() + 48 * 3600000).toISOString() : null } }),
      });
      toast.success(listing.isBoosted ? 'Boost retiré' : 'Annonce boostée');
      setListings(listings.map((l) => l.id === listing.id ? { ...l, isBoosted: !l.isBoosted } : l));
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{listings.length} annonce(s)</p>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadListings}><RefreshCw className="w-3 h-3 mr-1" /> Actualiser</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold truncate max-w-[200px]">{l.title}</h3>
                      {l.isBoosted && <Badge className="bg-amber-500 text-white text-[10px]"><Zap className="w-2.5 h-2.5 mr-0.5" />Boost</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.seller?.name || 'Inconnu'} · {l.city} · {l.price ? new Intl.NumberFormat('fr-FR').format(l.price) + ' FCFA' : 'Gratuit'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground"><Eye className="w-3 h-3 inline mr-0.5" />{l.views}</span>
                      <span className="text-[10px] text-muted-foreground"><MessageSquare className="w-3 h-3 inline mr-0.5" />{l.contactCount}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Badge variant={l.status === 'active' ? 'default' : 'outline'} className="text-[10px] flex-shrink-0">{l.status}</Badge>
                </div>
                <div className="flex gap-1.5 mt-3 pt-3 border-t">
                  <ActionPill icon={Zap} label={l.isBoosted ? 'Retirer boost' : 'Booster'} onClick={() => toggleBoost(l)} />
                  <ActionPill icon={Ban} label="Modérer" onClick={() => moderate(l.id)} className="text-destructive" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== SUBSCRIPTIONS ==================== */
function SubscriptionsTab() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin?type=subscriptions')
      .then((r) => r.json()).then((d) => { setSubs(d.subscriptions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateSub = async (id: string, status: string) => {
    try {
      const r = await adminFetch('/api/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update-subscription', subscriptionId: id, status }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur');
      toast.success(status === 'active' ? 'Abonnement approuvé' : 'Abonnement refusé');
      setSubs(subs.map((s) => s.id === id ? { ...s, status } : s));
    } catch (error: any) { toast.error(error.message || 'Erreur'); }
  };

  const cancelSub = async (id: string) => {
    try {
      await adminFetch('/api/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update-subscription', subscriptionId: id, status: 'cancelled' }),
      });
      toast.success('Abonnement annulé');
      setSubs(subs.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s));
    } catch { toast.error('Erreur'); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{subs.length} abonnement(s)</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{s.user?.name || 'Utilisateur'}</h3>
                      <Badge className={TIER_BADGE[s.tier] || ''} variant="secondary">{s.tier}</Badge>
                      <Badge variant={s.status === 'active' ? 'default' : 'outline'} className="text-[10px]">{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.user?.phone} · {fmt(s.amount)} FCFA · Du {new Date(s.startsAt).toLocaleDateString('fr-FR')} au {new Date(s.expiresAt).toLocaleDateString('fr-FR')}
                    </p>
                    {s.paymentRef && <p className="text-[10px] text-muted-foreground mt-0.5">Réf: {s.paymentRef}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {s.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-green-700 border-green-300" onClick={() => updateSub(s.id, 'active')}><CheckCircle2 className="w-3 h-3 mr-1" /> Approuver</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateSub(s.id, 'cancelled')}><X className="w-4 h-4" /></Button>
                      </>
                    )}
                    {s.status === 'active' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelSub(s.id)}><X className="w-4 h-4" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {subs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Aucun abonnement</p>}
        </div>
      )}
    </div>
  );
}

/* ==================== ADS ==================== */
function AdsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); adminFetch('/api/ads?admin=1').then((r) => r.json()).then((d) => setCampaigns(d.campaigns || [])).catch(() => toast.error('Erreur')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const act = async (id: string, action: string) => { const payload: any = { id, action }; if (action === 'activate') { const paymentRef = window.prompt('Référence Wave vérifiée :'); if (!paymentRef) return; const days = window.prompt('Durée de diffusion en jours (1 à 365) :', '30'); if (!days) return; payload.paymentRef = paymentRef.trim(); payload.days = Number(days); } const r = await adminFetch('/api/ads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const d = await r.json(); if (!r.ok) return toast.error(d.error || 'Erreur'); toast.success(action === 'approve' ? 'Campagne approuvée : paiement débloqué.' : action === 'activate' ? 'Paiement vérifié, campagne activée.' : 'Campagne refusée.'); load(); };
  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full" /></div>;
  return <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{campaigns.length} campagne(s)</p><Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3 h-3 mr-1" /> Actualiser</Button></div>{campaigns.map((c) => <Card key={c.id}><CardContent className="p-3"><div className="flex gap-3"><img src={c.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold truncate">{c.title}</h3><Badge variant="outline">{c.status}</Badge></div><p className="text-xs text-muted-foreground mt-1">{c.advertiser?.name || 'Annonceur'} · {new Intl.NumberFormat('fr-FR').format(c.amount)} FCFA</p><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description || 'Sans description'}</p></div></div><div className="mt-3 flex gap-2 border-t pt-3">{c.status === 'pending' && <Button size="sm" onClick={() => void act(c.id, 'approve')}><CheckCircle2 className="mr-1 h-3 w-3" /> Approuver</Button>}{c.status === 'payment_pending' && <Badge className="bg-amber-100 text-amber-800">En attente du paiement annonceur</Badge>}{c.status === 'payment_submitted' && <Button size="sm" onClick={() => void act(c.id, 'activate')}><CheckCircle2 className="mr-1 h-3 w-3" /> Vérifier et activer</Button>}{c.status === 'active' && <Button variant="outline" size="sm" onClick={() => void act(c.id, 'activate')}>Renouveler</Button>}{(c.status === 'pending' || c.status === 'payment_pending') && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void act(c.id, 'reject')}><X className="mr-1 h-3 w-3" /> Refuser</Button>}</div></CardContent></Card>)}{campaigns.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Aucune demande publicitaire.</p>}</div>;
}

/* ==================== REPORTS ==================== */
function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const r = await adminFetch('/api/admin?type=reports');
      const d = await r.json();
      setReports(d.reports || []);
    } catch { toast.error('Erreur'); }
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  const resolve = async (id: string) => {
    try {
      await adminFetch(`/api/admin?type=report&id=${id}`, { method: 'DELETE' });
      toast.success('Signalement traité');
      setReports(reports.filter((r) => r.id !== id));
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{reports.length} signalement(s) en attente</p>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadReports}><RefreshCw className="w-3 h-3 mr-1" /> Actualiser</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 mx-auto text-accent mb-3" />
          <p className="text-muted-foreground text-sm">Aucun signalement en attente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id} className="border-l-4 border-l-destructive">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{r.listing?.title || 'Annonce supprimée'}</p>
                    <p className="text-xs text-destructive mt-1">{r.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Signalé par {r.reporter?.name || 'Anonyme'} ({r.reporter?.phone}) · {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => resolve(r.id)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Résolu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== SHARED COMPONENTS ==================== */
function MiniStat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <Card><CardContent className="p-3">
      <Icon className="w-4 h-4 text-terracotta mb-1" />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[10px] text-accent">{sub}</p>
    </CardContent></Card>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 p-3 rounded-xl border text-left hover:bg-muted/50 transition-colors">
      <Icon className="w-4 h-4 text-terracotta" /><span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function ActionPill({ icon: Icon, label, onClick, className = '' }: { icon: any; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:bg-muted/50 transition-colors ${className}`}>
      <Icon className="w-3 h-3" />{label}
    </button>
  );
}
