'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { useChatStore } from '@/stores/use-chat-store';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export function ChatPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const { params } = useRouterStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Determine if we're viewing a specific conversation
  const isConversation = !!params.sellerId;

  useEffect(() => {
    if (!user) { navigate('login'); return; }

    const s = io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join', user.id);
      if (isConversation) {
        s.emit('get-messages', { userId1: user.id, userId2: params.sellerId, listingId: params.listingId });
      } else {
        s.emit('get-conversations', user.id);
      }
    });

    s.on('conversations', setConversations);
    s.on('messages', (msgs: any[]) => {
      setMessages(msgs.map((m: any) => ({ ...m, senderName: m.sender?.name })));
    });

    s.on('new-message', (msg: any) => {
 setMessages((prev) => [...prev, { ...msg, senderName: msg.sender?.name }]);
      if (!isConversation) {
        s.emit('get-conversations', user.id);
      }
    });

    return () => { s.disconnect(); };
  }, [user?.id, isConversation, params.sellerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !socketRef.current || !user) return;
    socketRef.current.emit('send-message', {
      senderId: user.id,
      receiverId: params.sellerId,
      content: newMessage.trim(),
      listingId: params.listingId || null,
    });
    setNewMessage('');
  };

  const openConversation = (conv: any) => {
    navigate('chat-conversation', {
      sellerId: conv.userId,
      sellerName: conv.userName,
      listingId: conv.listingId,
      listingTitle: conv.listingTitle,
    });
  };

  if (!user) return null;

  // Conversation View
  if (isConversation) {
    return (
      <div className="flex flex-col h-screen">
        {/* Chat Header */}
        <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('chat')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="w-9 h-9 rounded-full gradient-majaay flex items-center justify-center text-white font-bold">
            {(params.sellerName || '?')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{params.sellerName || 'Utilisateur'}</p>
            {params.listingTitle && <p className="text-[11px] text-muted-foreground truncate">Re: {params.listingTitle}</p>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Commencez la conversation !</p>
              {params.listingTitle && <p className="text-xs text-muted-foreground mt-1">À propos de : {params.listingTitle}</p>}
            </div>
          )}
          {messages.map((msg: any) => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-terracotta text-white rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>{new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t px-4 py-3">
          <div className="flex gap-2">
            <Input
              placeholder="Écrire un message..."
              className="flex-1 h-11 rounded-full"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <Button size="icon" className="h-11 w-11 rounded-full gradient-majaay text-white" onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3 -mx-4 px-4">
        <h1 className="text-lg font-bold">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 px-4">
          <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">Aucun message</p>
          <p className="text-sm text-muted-foreground">Contactez un vendeur pour commencer une conversation</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map((conv: any, i: number) => (
            <Card
              key={`${conv.userId}-${i}`}
              className="border-0 rounded-none cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openConversation(conv)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full gradient-majaay flex items-center justify-center text-white font-bold text-lg">
                    {conv.userName?.[0] || '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{conv.userName}</p>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  {conv.listingTitle && <p className="text-[11px] text-terracotta truncate">Re: {conv.listingTitle}</p>}
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="bg-terracotta text-white text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full">{conv.unreadCount}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
