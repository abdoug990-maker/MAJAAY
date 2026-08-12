'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { CategoryIcon } from '@/lib/category-icons';
import { Search, ArrowUpRight, Plus, MapPin, ShieldCheck, Zap, ChevronRight, Sparkles, PackageOpen, Megaphone, ExternalLink } from 'lucide-react';

const fallbackCategories = [
  { id: 'vehicles', name: 'Véhicules', slug: 'vehicules' }, { id: 'real-estate', name: 'Immobilier', slug: 'immobilier' }, { id: 'electronics', name: 'Électronique', slug: 'electronique' }, { id: 'fashion', name: 'Mode', slug: 'mode' }, { id: 'home', name: 'Maison', slug: 'maison' }, { id: 'services', name: 'Services', slug: 'services' },
];

export function HomePage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [activeAd, setActiveAd] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, listRes, adsRes] = await Promise.all([fetch('/api/categories'), fetch('/api/listings?limit=12'), fetch('/api/ads')]);
      const cats = await catRes.json().catch(() => []); const payload = await listRes.json().catch(() => ({})); const adsPayload = await adsRes.json().catch(() => ({}));
      setCategories(Array.isArray(cats) && cats.length ? cats : fallbackCategories); setListings(Array.isArray(payload?.listings) ? payload.listings : []); setAds(Array.isArray(adsPayload?.campaigns) ? adsPayload.campaigns : []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { setActiveAd(0); }, [ads.length]);
  useEffect(() => { if (ads.length < 2) return; const timer = window.setInterval(() => setActiveAd((index) => (index + 1) % ads.length), 15000); return () => window.clearInterval(timer); }, [ads.length]);
  const doSearch = () => search.trim() && navigate('search', { q: search.trim() });

  return <div className="px-4 pb-6 md:px-8 lg:px-12">
    <section className="signature-hero relative mt-5 overflow-hidden rounded-[32px] px-6 py-8 text-ink md:mt-8 md:min-h-[470px] md:px-12 md:py-12 lg:px-16">
      <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
      <div className="relative z-10 max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/55 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-ink-soft"><Sparkles className="h-3.5 w-3.5 text-coral" /> Le goût du bon deal</div>
        <h1 className="max-w-2xl text-[clamp(42px,7vw,86px)] font-black leading-[.9] tracking-[-.085em]">Tout ce qui <span className="text-coral">compte.</span><br /><span className="font-serif italic font-medium">Juste à côté.</span></h1>
        <p className="mt-6 max-w-lg text-[15px] font-medium leading-relaxed text-ink-soft md:text-lg">La nouvelle façon de trouver, vendre et faire circuler les belles choses au Sénégal.</p>
        <div className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-2 shadow-[0_18px_45px_rgba(16,32,27,.14)] focus-within:ring-4 focus-within:ring-coral/15"><Search className="ml-3 h-5 w-5 shrink-0 text-ink-soft" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="Que cherchez-vous aujourd’hui ?" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm font-semibold outline-none placeholder:text-ink-soft/55 md:text-base" /><button onClick={doSearch} className="rounded-xl bg-ink px-5 py-3 text-xs font-black text-paper transition hover:-translate-y-0.5">Rechercher</button></div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-ink-soft"><span>Populaire :</span>{['Dakar', 'Téléphones', 'Voitures'].map((term) => <button key={term} onClick={() => { setSearch(term); navigate('search', { q: term }); }} className="rounded-full border border-ink/10 bg-white/40 px-3 py-1.5 transition hover:bg-white">{term}</button>)}</div>
      </div>
      <div className="hero-sticker"><span>DAKAR<br /><b>↗</b></span></div>
      <div className="absolute bottom-5 right-6 hidden items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-ink-soft/70 md:flex"><span className="h-2 w-2 rounded-full bg-coral" /> Marketplace locale, énergie globale</div>
    </section>

    {ads.length > 0 && <section className="ad-shelf ad-carousel mt-5 md:mt-8"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-ink-soft"><Megaphone className="h-3.5 w-3.5 text-coral" /> À découvrir</div><span className="text-[10px] font-bold text-ink-soft">Partenaire vérifié · {activeAd + 1}/{ads.length}</span></div><div className="ad-carousel-track" style={{ transform: `translateX(-${activeAd * 100}%)` }}>{ads.map((ad) => <a key={ad.id} href={ad.targetUrl || '#'} target={ad.targetUrl ? '_blank' : undefined} rel="noreferrer" className="ad-card ad-carousel-slide"><img src={ad.imageUrl} alt={ad.title} /><div className="min-w-0"><p className="line-clamp-1 text-sm font-black text-ink">{ad.title}</p><p className="mt-1 line-clamp-2 text-xs text-ink-soft">{ad.description || 'Une sélection proposée par un annonceur Majaay.'}</p></div><ExternalLink className="h-4 w-4 shrink-0 text-coral" /></a>)}</div>{ads.length > 1 && <div className="ad-carousel-dots">{ads.map((ad, index) => <button key={ad.id} className={index === activeAd ? 'active' : ''} aria-label={`Afficher la publicité ${index + 1}`} onClick={() => setActiveAd(index)} />)}</div>}</section>}

    <section className="mt-12 md:mt-16"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Choisir son terrain</p><h2 className="mt-1 text-2xl font-black tracking-[-.05em] text-ink md:text-3xl">Explorer par univers</h2></div><button onClick={() => navigate('search')} className="inline-flex items-center gap-1 text-xs font-black text-coral">Tout voir <ArrowUpRight className="h-4 w-4" /></button></div><div className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:gap-4">{(categories.length ? categories : fallbackCategories).slice(0, 6).map((cat, index) => <button key={cat.id} onClick={() => navigate('search', { categoryId: cat.id, categoryName: cat.name })} className={`category-tile category-tile-${index % 3}`}><span className="category-symbol"><CategoryIcon slug={cat.slug} size={27} /></span><span>{cat.name}</span><ArrowUpRight className="category-arrow" /></button>)}</div></section>

    <section className="mt-14 md:mt-20"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Le marché, en temps réel</p><h2 className="mt-1 text-2xl font-black tracking-[-.05em] text-ink md:text-3xl">Les dernières trouvailles</h2></div><button onClick={() => navigate('search')} className="inline-flex items-center gap-1 text-xs font-black text-coral">Explorer <ChevronRight className="h-4 w-4" /></button></div>{loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="skeleton-card" />)}</div> : listings.length === 0 ? <div className="empty-market"><PackageOpen className="h-10 w-10 text-coral" /><h3>Le prochain bon deal peut être le tien.</h3><p>Le catalogue est prêt. Publie une annonce et deviens le premier vendeur de ce nouvel espace.</p><button onClick={() => navigate(user ? 'create-listing' : 'login')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-black text-paper"><Plus className="h-4 w-4" /> Publier une annonce</button></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{listings.map((listing, index) => <ListingCard key={listing.id} listing={listing} index={index} onOpen={() => navigate('listing-detail', { id: listing.id })} />)}</div>}</section>

    <section className="mt-14 grid gap-4 md:mt-20 md:grid-cols-[1.25fr_.75fr]"><div className="trust-panel"><div className="flex items-start justify-between"><div><p className="eyebrow text-lime">L’esprit Majaay</p><h2 className="mt-2 max-w-md text-3xl font-black leading-tight tracking-[-.06em] text-paper">Acheter local.<br /><span className="text-lime">Vendre mieux.</span></h2></div><ShieldCheck className="h-9 w-9 text-lime" /></div><p className="mt-8 max-w-md text-sm leading-relaxed text-paper/65">Des annonces claires, des vendeurs vérifiés et une expérience pensée pour aller droit au bon choix.</p></div><button onClick={() => navigate(user ? 'create-listing' : 'login')} className="sell-cta"><span className="eyebrow">Ton prochain chapitre</span><strong>Une chose à vendre ?<br />Fais-la briller.</strong><span className="cta-arrow"><Plus /></span></button></section>
  </div>;
}

export function formatPrice(price: number | null): string { if (!price) return 'Prix sur demande'; return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'; }

function ListingCard({ listing, index, onOpen }: { listing: any; index: number; onOpen: () => void }) {
  let image: string | null = null; try { image = listing.images && listing.images !== '[]' ? JSON.parse(listing.images)[0] : null; } catch { image = null; }
  return <article onClick={onOpen} className="new-listing-card" style={{ animationDelay: `${index * 45}ms` }}><div className="listing-visual">{image ? <img src={image} alt={listing.title} loading="lazy" /> : <div className="listing-placeholder"><CategoryIcon slug={listing.category?.slug || 'services'} size={34} /></div>}{listing.isBoosted && <span className="boost-chip"><Zap className="h-3 w-3" /> Boost</span>}<button type="button" aria-label="Voir l’annonce" className="listing-arrow"><ArrowUpRight /></button></div><div className="p-3.5"><p className="line-clamp-2 text-sm font-black leading-snug text-ink">{listing.title}</p><p className="mt-2 text-base font-black text-coral">{formatPrice(listing.price)}</p><div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold text-ink-soft"><span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{listing.city || 'Sénégal'}</span>{listing.seller?.isVerifiedSeller && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}</div></div></article>;
}
