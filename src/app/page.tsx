'use client';

import { useRouterStore, PageRoute } from '@/stores/use-router-store';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/use-auth-store';
import { HomePage } from '@/components/pages/HomePage';
import { AuthPage } from '@/components/pages/AuthPage';
import { ListingDetailPage } from '@/components/pages/ListingDetailPage';
import { CreateListingPage } from '@/components/pages/CreateListingPage';
import { SearchPage } from '@/components/pages/SearchPage';
import { ChatPage } from '@/components/pages/ChatPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { MyListingsPage } from '@/components/pages/MyListingsPage';
import { PlansPage } from '@/components/pages/PlansPage';
import { AdminPage } from '@/components/pages/AdminPage';
import { AdminLoginPage } from '@/components/pages/AdminLoginPage';
import Image from 'next/image';
import { Home, Search, Plus, MessageCircle, UserRound, Sparkles } from 'lucide-react';

const navItems = [
  { page: 'home' as PageRoute, icon: Home, label: 'Découvrir' },
  { page: 'search' as PageRoute, icon: Search, label: 'Explorer' },
  { page: 'chat' as PageRoute, icon: MessageCircle, label: 'Messages' },
  { page: 'profile' as PageRoute, icon: UserRound, label: 'Mon espace' },
];

function Brand() {
  const navigate = useRouterStore((s) => s.navigate);
  return <button onClick={() => navigate('home')} className="group flex items-center gap-3" aria-label="Retour à l’accueil"><span className="brand-mark"><Image src="/logo.png" alt="Ma Jaay" width={46} height={46} className="h-full w-full object-contain" priority /></span><span className="hidden text-[22px] font-black tracking-[-0.06em] text-ink sm:block">ma<span className="text-coral">.</span>jaay</span></button>;
}

function BottomNav() {
  const { page, navigate } = useRouterStore();
  return <nav className="mobile-dock md:hidden"><div className="mobile-dock-inner"><button onClick={() => navigate('home')} className={`dock-item ${page === 'home' ? 'is-active' : ''}`}><Home /><span>Accueil</span></button><button onClick={() => navigate('search')} className={`dock-item ${page === 'search' ? 'is-active' : ''}`}><Search /><span>Explorer</span></button><button onClick={() => navigate('create-listing')} className="dock-publish"><span><Plus /></span><em>Vendre</em></button><button onClick={() => navigate('chat')} className={`dock-item ${page === 'chat' || page === 'chat-conversation' ? 'is-active' : ''}`}><MessageCircle /><span>Messages</span></button><button onClick={() => navigate('profile')} className={`dock-item ${['profile', 'my-listings', 'plans'].includes(page) ? 'is-active' : ''}`}><UserRound /><span>Espace</span></button></div></nav>;
}

function DesktopNav() {
  const { page, navigate } = useRouterStore();
  const user = useAuthStore((s) => s.user);
  return <header className="site-header"><div className="site-header-inner"><Brand /><nav className="desktop-links">{navItems.map((item) => { const Icon = item.icon; const active = page === item.page || (item.page === 'profile' && ['profile', 'my-listings', 'plans'].includes(page)); return <button key={item.page} onClick={() => navigate(item.page)} className={`desktop-link ${active ? 'is-active' : ''}`}><Icon />{item.label}</button>; })}</nav><div className="header-actions"><span className="header-pulse"><Sparkles /> La marketplace qui a du goût</span>{user ? <><button onClick={() => navigate('profile')} className="nav-avatar" aria-label="Ouvrir mon profil">{user.avatar ? <Image src={user.avatar} alt="Photo de profil" width={34} height={34} /> : <span>{user.name?.[0] || 'U'}</span>}</button><button onClick={() => navigate('create-listing')} className="sell-button"><Plus /> Vendre un objet</button></> : <button onClick={() => navigate('login')} className="login-button">Se connecter</button>}</div></div></header>;
}

function PageRouter() {
  const page = useRouterStore((s) => s.page);
  switch (page) {
    case 'login': case 'register': case 'verify-otp': return <AuthPage />;
    case 'admin-login': return <AdminLoginPage />;
    case 'listing-detail': return <ListingDetailPage />;
    case 'create-listing': case 'edit-listing': return <CreateListingPage />;
    case 'search': return <SearchPage />;
    case 'chat': case 'chat-conversation': return <ChatPage />;
    case 'profile': return <ProfilePage />;
    case 'my-listings': return <MyListingsPage />;
    case 'plans': return <PlansPage />;
    case 'admin': case 'admin-listings': case 'admin-reports': case 'admin-users': return <AdminPage />;
    default: return <HomePage />;
  }
}

export default function MaJaayApp() {
  const page = useRouterStore((s) => s.page);
  const navigate = useRouterStore((s) => s.navigate);
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1') navigate('admin-login');
  }, [navigate]);
  const hideBottomNav = ['login', 'register', 'verify-otp', 'admin-login', 'chat-conversation'].includes(page);
  return <div className="app-shell"><DesktopNav /><div className="page-frame"><main className={hideBottomNav ? '' : 'pb-24 md:pb-12'}><PageRouter /></main>{!hideBottomNav && <BottomNav />}</div></div>;
}
