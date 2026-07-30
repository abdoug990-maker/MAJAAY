'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, FileText, MessageSquare, AlertTriangle, TrendingUp, CreditCard, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('home'); return; }
    Promise.all([
      fetch('/api/admin').then((r) => r.json()),
      fetch('/api/listings?limit=50').then((r) => r.json()),
    ]).then(([adminData, listData]) => {
      setStats(adminData.stats);
      setListings(listData.listings || []);
      setLoading(false);
    });
  }, [user]);

  const moderateListing = async (id: string) => {
    try {
      const res = await fetch(`/api/admin?type=listing&id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Annonce modérée'); setListings(listings.filter((l) => l.id !== id)); }
    } catch { toast.error('Erreur'); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-majaay-dark text-white px-4 pt-12 pb-8 -mx-4 -mt-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-lg font-bold">Administration</h1>
            <p className="text-white/70 text-xs">Panneau de contrôle Ma Jaay</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Utilisateurs" value={stats?.users || 0} sub={`+${stats?.newUsers || 0} ce mois`} />
          <StatCard icon={FileText} label="Annonces" value={stats?.activeListings || 0} sub={`+${stats?.newListings || 0} ce mois`} />
          <StatCard icon={CreditCard} label="Revenus" value={`${new Intl.NumberFormat('fr-FR').format(stats?.totalRevenue || 0)}`} sub="FCFA total" />
          <StatCard icon={AlertTriangle} label="Signalements" value={stats?.pendingReports || 0} sub="En attente" color="text-amber-500" />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <h2 className="font-bold text-lg">Toutes les annonces ({listings.length})</h2>
        <div className="space-y-2">
          {listings.map((listing: any) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{listing.title}</h3>
                      {listing.isBoosted && <Badge className="bg-amber-500 text-white text-[10px]">Boost</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{listing.seller?.name} · {listing.city} · {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[11px]">{listing.status}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => moderateListing(listing.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <Icon className={`w-5 h-5 mb-1 ${color || 'text-white/70'}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-white/60">{label}</p>
      <p className="text-[10px] text-green-300">{sub}</p>
    </div>
  );
}