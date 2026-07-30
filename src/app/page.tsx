'use client';

import { useEffect } from 'react';
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
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

function PageRouter() {
  const page = useRouterStore((s) => s.page);
  switch (page) {
    case 'login': case 'register': case 'verify-otp': return <AuthPage />;
    case 'listing-detail': return <ListingDetailPage />;
    case 'create-listing': case 'edit-listing': return <CreateListingPage />;
    case 'search': return <SearchPage />;
    case 'chat': case 'chat-conversation': return <ChatPage />;
    case 'profile': return <ProfilePage />;
    case 'my-listings': return <MyListingsPage />;
    case 'plans': return <PlansPage />;
    case 'admin': case 'admin-listings': case 'admin-reports': return <AdminPage />;
    default: return <HomePage />;
  }
}

export default function MaJaayApp() {
  const page = useRouterStore((s) => s.page);
  const user = useAuthStore((s) => s.user);

  useChatSocket();

  useEffect(() => {
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', phone: '+221000000000', name: '_seed' }),
    }).catch(() => {});
  }, []);

  const hideBottomNav = page === 'login' || page === 'register' || page === 'verify-otp' || page === 'chat-conversation';

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background pattern-african">
      <main className={hideBottomNav ? '' : 'pb-[60px]'}>
        <PageRouter />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
