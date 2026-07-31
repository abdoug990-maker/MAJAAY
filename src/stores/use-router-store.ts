import { create } from 'zustand';

export type PageRoute =
  | 'home'
  | 'login'
  | 'register'
  | 'verify-otp'
  | 'listing-detail'
  | 'create-listing'
  | 'edit-listing'
  | 'search'
  | 'chat'
  | 'chat-conversation'
  | 'profile'
  | 'my-listings'
  | 'plans'
  | 'admin'
  | 'admin-listings'
  | 'admin-reports'
  | 'admin-users';

interface RouterState {
  page: PageRoute;
  params: Record<string, string>;
  history: PageRoute[];
  navigate: (page: PageRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

export const useRouterStore = create<RouterState>()((set, get) => ({
  page: 'home',
  params: {},
  history: ['home'],
  navigate: (page, params = {}) => {
    const { page: currentPage, history } = get();
    if (page !== currentPage) {
      set({ page, params, history: [...history, page] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (params && Object.keys(params).length > 0) {
      set({ params });
    }
  },
  goBack: () => {
    const { history } = get();
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      set({
        page: newHistory[newHistory.length - 1],
        history: newHistory,
        params: {},
      });
    }
  },
}));
