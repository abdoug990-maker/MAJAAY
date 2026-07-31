import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/use-auth-store';
import { useChatStore } from '@/stores/use-chat-store';

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);
  const { addMessage, setConnected, setConversations, setCurrentMessages, clearUnread } = useChatStore();

  useEffect(() => {
    if (!user) return;

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
      // Defer state updates to avoid synchronous setState in event handler
      setTimeout(() => setConnected(true), 0);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('conversations', setConversations);
    socket.on('messages', setCurrentMessages);
    socket.on('new-message', (msg) => {
      addMessage(msg);
      if (msg.receiverId === user.id) {
        clearUnread(msg.senderId);
      }
    });

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [user?.id]);

  return socketRef;
}
