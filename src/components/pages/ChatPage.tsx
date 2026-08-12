'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/stores/use-router-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ChatPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const { params } = useRouterStore();
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isConversation = Boolean(params.sellerId);

  const loadMessages = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const query = isConversation
        ? `/api/messages?userId=${encodeURIComponent(params.sellerId)}${params.listingId ? `&listingId=${encodeURIComponent(params.listingId)}` : ''}`
        : '/api/messages';
      const response = await fetch(query, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de charger les messages.');
      if (isConversation) setMessages(data.messages || []);
      else setConversations(data.conversations || []);
    } catch (error: any) {
      if (!silent) toast.error(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, isConversation, params.sellerId, params.listingId]);

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(true), 5000);
    return () => window.clearInterval(interval);
  }, [user?.id, loadMessages, navigate]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !user || !params.sellerId || sending) return;
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: params.sellerId, listingId: params.listingId || null, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible d’envoyer le message.');
      setMessages((previous) => [...previous, data.message]);
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  if (isConversation) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('chat')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-majaay font-bold text-white">{(params.sellerName || '?')[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{params.sellerName || 'Utilisateur'}</p>
            {params.listingTitle && <p className="truncate text-[11px] text-muted-foreground">Re: {params.listingTitle}</p>}
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-terracotta" /></div>}
          {!loading && messages.length === 0 && <div className="py-12 text-center"><MessageCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Commencez la conversation !</p></div>}
          {messages.map((message) => {
            const isMe = message.senderId === user.id;
            return <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'rounded-br-md bg-terracotta text-white' : 'rounded-bl-md bg-muted'}`}><p className="whitespace-pre-wrap text-sm">{message.content}</p><p className={`mt-1 text-[10px] ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>{new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div></div>;
          })}
        </div>
        <div className="sticky bottom-0 border-t bg-background px-4 py-3"><div className="flex gap-2"><Input placeholder="Écrire un message..." className="h-11 flex-1 rounded-full" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void handleSend()} /><Button size="icon" className="h-11 w-11 rounded-full gradient-majaay text-white" onClick={() => void handleSend()} disabled={sending || !newMessage.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-3"><h1 className="text-lg font-bold">Messages</h1></div>
      {loading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-terracotta" /></div>}
      {!loading && conversations.length === 0 && <div className="px-4 py-20 text-center"><MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" /><p className="mb-1 text-lg font-semibold">Aucun message</p><p className="text-sm text-muted-foreground">Contactez un vendeur pour commencer une conversation.</p></div>}
      {!loading && conversations.length > 0 && <div className="divide-y">{conversations.map((conversation, index) => <Card key={`${conversation.userId}-${index}`} className="cursor-pointer rounded-none border-0 transition-colors hover:bg-muted/50" onClick={() => navigate('chat-conversation', { sellerId: conversation.userId, sellerName: conversation.userName, listingId: conversation.listingId, listingTitle: conversation.listingTitle })}><CardContent className="flex items-center gap-3 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-full gradient-majaay text-lg font-bold text-white">{conversation.userName?.[0] || '?'}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><p className="truncate text-sm font-semibold">{conversation.userName}</p><span className="flex-shrink-0 text-[11px] text-muted-foreground">{conversation.lastMessageTime ? new Date(conversation.lastMessageTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span></div><p className="mt-0.5 truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>{conversation.listingTitle && <p className="truncate text-[11px] text-terracotta">Re: {conversation.listingTitle}</p>}</div>{conversation.unreadCount > 0 && <Badge className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-terracotta text-[10px] text-white">{conversation.unreadCount}</Badge>}</CardContent></Card>)}</div>}
    </div>
  );
}
