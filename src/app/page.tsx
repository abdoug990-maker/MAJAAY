'use client';

import { useRouterStore, PageRoute } from '@/stores/use-router-store';
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
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useChatSocket } from '@/hooks/use-chat-socket';

function BottomNav() {
  const { page, navigate } = useRouterStore();

  const items = [
    { page: 'home' as PageRoute, icon: Home, label: 'Accueil' },
    { page: 'search' as PageRoute, icon: Search, label: 'Rechercher' },
    { page: 'create-listing' as PageRoute, icon: PlusCircle, label: 'Publier' },
    { page: 'chat' as PageRoute, icon: MessageCircle, label: 'Messages' },
    { page: 'profile' as PageRoute, icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom md:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[60px] px-1">
        {items.map((item) => {
          const isActive = page === item.page ||
            (item.page === 'create-listing' && page === 'create-listing') ||
            (item.page === 'profile' && (page === 'profile' || page === 'my-listings' || page === 'plans' || page === 'admin'));
          const isPublish = item.page === 'create-listing';
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-full flex-1 rounded-xl transition-colors duration-200 ${
                isActive ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              {isPublish ? (
                <div className={`w-10 h-10 -mt-5 rounded-2xl gradient-majaay flex items-center justify-center shadow-lg shadow-terracotta/25 ${
                  isActive ? 'ring-4 ring-terracotta/15' : ''
                }`}>
                  <PlusCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
              )}
              <span className={`text-[10px] font-medium ${isPublish ? '-mt-0.5' : ''}`}>{item.label}</span>
              {isActive && !isPublish && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-terracotta" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav() {
  const { page, navigate } = useRouterStore();
  const user = useAuthStore((s) => s.user);
  const items = [
    { page: 'home' as PageRoute, icon: Home, label: 'Accueil' },
    { page: 'search' as PageRoute, icon: Search, label: 'Rechercher' },
    { page: 'create-listing' as PageRoute, icon: PlusCircle, label: 'Publier' },
    { page: 'chat' as PageRoute, icon: MessageCircle, label: 'Messages' },
    { page: 'profile' as PageRoute, icon: User, label: 'Profil' },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b border-white/10 bg-[#131921] text-white shadow-lg">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-3 px-3 sm:px-5 lg:gap-6 lg:px-8">
        <button onClick={() => navigate('home')} className="group flex items-center gap-3 text-lg font-extrabold tracking-tight shrink-0">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
            <Image src="/logo.png" alt="Ma Jaay" width={48} height={48} className="h-full w-full object-contain" priority />
          </span>
          <span className="hidden lg:block text-[21px] tracking-[-0.03em]">Ma Jaay</span>
        </button>
        <nav className="flex items-center gap-1 flex-1 justify-center">
          {items.map((item) => {
            const Icon = item.icon;
            const active = page === item.page || (item.page === 'profile' && ['profile', 'my-listings', 'plans', 'admin'].includes(page));
            return (
              <button key={item.page} onClick={() => navigate(item.page)} className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-colors lg:gap-2 lg:px-4 lg:text-sm ${active ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="h-4 w-4" />{item.label}
              </button>
            );
          })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden 2xl:block text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">Le marché qui nous rassemble</span>
            {!user && <button onClick={() => navigate('login')} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20">Se connecter</button>}
          </div>
        </div>
      </header>
  );
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
  const user = useAuthStore((s) => s.user);

  useChatSocket();

  const hideBottomNav = page === 'login' || page === 'register' || page === 'verify-otp' || page === 'admin-login' || page === 'chat-conversation';

  return (
    <div className="min-h-screen bg-background pattern-african">
      <DesktopNav />
      <div className="mx-auto min-h-screen w-full max-w-7xl md:px-8">
      <main className={hideBottomNav ? '' : 'pb-[60px] md:pb-8'}>
        <PageRouter />
      </main>
      {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
