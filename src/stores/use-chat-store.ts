import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  listingId: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
  receiverName?: string;
  listingTitle?: string;
}

export interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string | null;
  userPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
 listingId: string | null;
  listingTitle: string | null;
}

interface ChatState {
  conversations: Conversation[];
  currentMessages: ChatMessage[];
  currentConversationId: string | null;
  isConnected: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentConversationId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  incrementUnread: (userId: string) => void;
  clearUnread: (userId: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  currentMessages: [],
  currentConversationId: null,
  isConnected: false,
  setConversations: (conversations) => set({ conversations }),
  setCurrentMessages: (messages) => set({ currentMessages: messages }),
  addMessage: (message) => {
    const { currentConversationId, currentMessages } = get();
    set({ currentMessages: [...currentMessages, message] });
    // Increment unread if message is from other person and not in current conversation
    const convId = `${message.senderId}-${message.receiverId}`;
    const convIdReverse = `${message.receiverId}-${message.senderId}`;
    if (currentConversationId !== convId && currentConversationId !== convIdReverse) {
      get().incrementUnread(message.senderId);
    }
  },
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
  incrementUnread: (userId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unreadCount: c.unreadCount + 1 } : c
      ),
    }));
  },
  clearUnread: (userId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },
}));
