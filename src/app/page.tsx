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
import { Button } from '@/components/ui/button';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useChatSocket } from '@/hooks/use-chat-socket';

function BottomNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = page === item.page || (item.page === 'create-listing' && page === 'create-listing') ||
            (item.page === 'profile' && (page === 'profile' || page === 'my-listings' || page === 'plans'));
          return (
            <Button
              key={item.page}
              variant="ghost"
              className={`flex flex-col items-center gap-0.5 h-full px-3 rounded-lg ${
                isActive ? 'text-terracotta' : 'text-muted-foreground'
              }`}
              onClick={() => navigate(item.page)}
            >
              <item.icon className={`w-5 h-5 ${item.page === 'create-listing' ? 'text-terracotta' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

function PageRouter() {
  const page = useRouterStore((s) => s.page);

  switch (page) {
    case 'login':
    case 'register':
    case 'verify-otp':
      return <AuthPage />;
    case 'listing-detail':
      return <ListingDetailPage />;
    case 'create-listing':
    case 'edit-listing':
      return <CreateListingPage />;
    case 'search':
      return <SearchPage />;
    case 'chat':
    case 'chat-conversation':
      return <ChatPage />;
    case 'profile':
      return <ProfilePage />;
    case 'my-listings':
      return <MyListingsPage />;
    case 'plans':
      return <PlansPage />;
    case 'admin':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
}

export default function MaJaayApp() {
  const page = useRouterStore((s) => s.page);
  const user = useAuthStore((s) => s.user);

  // Initialize socket connection for logged-in users
  useChatSocket();

  // Seed database on first load
  useEffect(() => {
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', phone: '+221000000000', name: '_seed' }),
    }).catch(() => {});
  }, []);

  const hideBottomNav = page === 'login' || page === 'register' || page === 'verify-otp' || page === 'chat-conversation';

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background">
      <main className={hideBottomNav ? '' : 'pb-16'}>
        <PageRouter />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
