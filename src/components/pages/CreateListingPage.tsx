'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { CITIES } from '@/lib/cities';
import { ImageUpload } from '@/components/ui/image-upload';
import { CategoryIcon } from '@/lib/category-icons';
import { getAuthHeaders } from '@/lib/client-auth';

const CONDITIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'usage', label: 'Bon etat' },
  { value: 'reconditionne', label: 'Reconditionne' },
];

export function CreateListingPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', price: '', condition: 'usage',
    categoryId: '', city: 'Dakar', location: '', negotiable: true,
  });
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCities, setShowCities] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories);
  }, []);
  const filteredCities = CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.title || !form.categoryId) { toast.error('Titre et categorie requis'); return; }
    const hasActivePaidSubscription = Boolean(
      user && user.subscriptionTier !== 'free' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date(),
    );
    if (!hasActivePaidSubscription) {
      toast.info('Choisissez un abonnement payant avant de publier.');
      navigate('plans');
      return;
    }
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...form, images: JSON.stringify(images), price: form.price ? parseInt(form.price) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Annonce publiee !');
      navigate('my-listings');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="sticky top-0 z-20 glass border-b border-border/50 py-3 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-[16px] font-bold tracking-tight">Nouvelle annonce</h1>
        </div>
      </div>
      <div className="mt-5 space-y-6">
        <div>
          <Label className="mb-2.5 block font-semibold text-[14px]">Photos</Label>
          <ImageUpload images={images} onChange={setImages} maxImages={5} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold text-[14px]">Titre *</Label>
          <Input id="title" placeholder="Ex: Toyota Corolla 2019" className="h-11 rounded-xl" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="font-semibold text-[14px]">Prix (FCFA)</Label>
          <Input id="price" type="number" placeholder="Ex: 500000" className="h-11 rounded-xl" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} className="rounded accent-terracotta" />
            <span className="text-[13px]">Prix negociable</span>
          </label>
        </div>
        <div className="space-y-2.5">
          <Label className="font-semibold text-[14px]">Categorie *</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: any) => {
              const selected = form.categoryId === cat.id;
              return (
                <Card key={cat.id}
                  className={`cursor-pointer transition-all duration-200 p-3 border rounded-xl ${selected ? 'border-terracotta bg-terracotta/5 shadow-sm ring-1 ring-terracotta/30' : 'border-border/60 hover:border-terracotta/30 hover:bg-muted/50'}`}
                  onClick={() => setForm({ ...form, categoryId: cat.id })}>
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon slug={cat.slug} size={18} />
                    <span className={`text-[13px] font-medium ${selected ? 'text-terracotta' : ''}`}>{cat.name}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="space-y-2.5">
          <Label className="font-semibold text-[14px]">Etat</Label>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => {
              const sel = form.condition === c.value;
              return (
                <button key={c.value} onClick={() => setForm({ ...form, condition: c.value })}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-200 ${sel ? 'border-terracotta bg-terracotta text-white shadow-sm' : 'border-border/60 hover:border-terracotta/30'}`}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2.5">
          <Label className="font-semibold text-[14px]">Localisation</Label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Ville..." className="pl-10 h-11 rounded-xl" value={citySearch}
              onChange={(e) => { setCitySearch(e.target.value); setShowCities(true); }}
              onFocus={() => setShowCities(true)} />
          </div>
          {showCities && citySearch && (
            <div className="border border-border/60 rounded-xl max-h-36 overflow-y-auto bg-card shadow-premium">
              {filteredCities.map((city) => (
                <div key={city} className="px-4 py-2.5 cursor-pointer hover:bg-muted/60 text-[13px] flex items-center gap-2 transition-colors"
                  onClick={() => { setForm({ ...form, city, location: city }); setCitySearch(city); setShowCities(false); }}>
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{city}
                </div>
              ))}
            </div>
          )}
          <Input placeholder="Quartier (optionnel)" className="h-11 rounded-xl mt-2" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="space-y-2.5">
          <Label htmlFor="desc" className="font-semibold text-[14px]">Description</Label>
          <Textarea id="desc" placeholder="Decrivez votre produit..." className="min-h-[110px] rounded-xl"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} />
        </div>
        <Button className="w-full h-[52px] gradient-majaay text-white font-semibold text-[15px] rounded-2xl shadow-lg shadow-terracotta/20"
          onClick={handleSubmit} disabled={loading || !form.title || !form.categoryId}>
          {loading ? 'Publication...' : 'Publier l\'annonce'}
        </Button>
        {(!user || user.subscriptionTier === 'free' || !user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) <= new Date()) && (
          <p className="text-center text-xs text-muted-foreground">Un abonnement payant approuvé est requis pour publier.</p>
        )}
      </div>
    </div>
  );
}
