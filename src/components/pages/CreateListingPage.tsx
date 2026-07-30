'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { CITIES } from '@/lib/seed';

const CONDITIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'usage', label: 'Bon état (usage)' },
  { value: 'reconditionne', label: 'Reconditionné' },
];

export function CreateListingPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'usage',
    categoryId: '',
    city: 'Dakar',
    location: '',
    negotiable: true,
    images: '[]',
  });
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCities, setShowCities] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (!user) navigate('login');
  }, [user]);

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.title || !form.categoryId) {
      toast.error('Titre et catégorie sont requis');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseInt(form.price) : null,
          sellerId: user!.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Annonce publiée avec succès !');
      navigate('my-listings');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b flex items-center gap-3 px-1 py-3 -mx-4 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-lg font-bold">Publier une annonce</h1>
      </div>

      <div className="mt-4 space-y-5">
        {/* Photos placeholder */}
        <div>
          <Label className="mb-2 block font-semibold">Photos</Label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-terracotta transition-colors flex-shrink-0">
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1">Ajouter</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Jusqu&apos;à 3 photos (plan gratuit) ou 5+ avec un abonnement</p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold">Titre de l&apos;annonce *</Label>
          <Input
            id="title"
            placeholder="Ex: Toyota Corolla 2019 - Excellent état"
            className="h-11"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={100}
          />
          <p className="text-[11px] text-muted-foreground">Soyez précis : marque, modèle, année, état...</p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price" className="font-semibold">Prix (FCFA)</Label>
          <Input
            id="price"
            type="number"
            placeholder="Ex: 500000"
            className="h-11"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} className="rounded" />
            <span className="text-sm">Prix négociable</span>
          </label>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="font-semibold">Catégorie *</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: any) => (
              <Card
                key={cat.id}
                className={`cursor-pointer transition-all p-3 ${form.categoryId === cat.id ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta' : 'hover:bg-muted'}`}
                onClick={() => setForm({ ...form, categoryId: cat.id })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryEmojiStatic(cat.slug)}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label className="font-semibold">État du produit</Label>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => (
              <Card
                key={c.value}
                className={`flex-1 cursor-pointer p-3 text-center ${form.condition === c.value ? 'border-terracotta bg-terracotta/5 ring-1 ring-terracotta' : 'hover:bg-muted'}`}
                onClick={() => setForm({ ...form, condition: c.value })}
              >
                <span className="text-sm font-medium">{c.label}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="font-semibold">Localisation</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une ville..."
              className="pl-10 h-11"
              value={citySearch}
              onChange={(e) => { setCitySearch(e.target.value); setShowCities(true); }}
              onFocus={() => setShowCities(true)}
            />
          </div>
          {showCities && citySearch && (
            <div className="border rounded-lg max-h-40 overflow-y-auto bg-card shadow-lg">
              {filteredCities.map((city) => (
                <div
                  key={city}
                  className="px-3 py-2 cursor-pointer hover:bg-muted text-sm flex items-center gap-2"
                  onClick={() => { setForm({ ...form, city, location: city }); setCitySearch(city); setShowCities(false); }}
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{city}
                </div>
              ))}
            </div>
          )}
          <Input
            placeholder="Quartier ou adresse précise (optionnel)"
            className="h-11 mt-2"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="desc" className="font-semibold">Description</Label>
          <Textarea
            id="desc"
            placeholder="Décrivez votre produit en détail : caractéristiques, état, motif de vente..."
            className="min-h-[120px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={2000}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full h-12 gradient-majaay text-white font-semibold text-base"
          onClick={handleSubmit}
          disabled={loading || !form.title || !form.categoryId}
        >
          {loading ? 'Publication...' : 'Publier l\'annonce'}
        </Button>
      </div>
    </div>
  );
}

function getCategoryEmojiStatic(slug: string): string {
  const map: Record<string, string> = {
    'vehicules': '🚗', 'immobilier': '🏠', 'electronique': '📱', 'mode-beaute': '👗',
    'maison-jardin': '🏡', 'emploi-services': '💼', 'loisirs-sport': '⚽', 'alimentation': '🛒',
  };
  return map[slug] || '📦';
}
