import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedAppUser, unauthorized } from '@/lib/auth-server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const listingId = searchParams.get('listingId');

    if (otherUserId) {
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user.id },
          ],
          ...(listingId ? { listingId } : {}),
        },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });
      await db.message.updateMany({ where: { senderId: otherUserId, receiverId: user.id, ...(listingId ? { listingId } : {}), isRead: false }, data: { isRead: true } });
      return NextResponse.json({ messages });
    }

    const messages = await db.message.findMany({
      where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const conversations = new Map<string, any>();
    for (const message of messages) {
      const other = message.senderId === user.id ? message.receiver : message.sender;
      if (!conversations.has(other.id)) {
        conversations.set(other.id, {
          userId: other.id,
          userName: other.name,
          listingId: message.listingId,
          listingTitle: message.listing?.title || null,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0,
        });
      }
      if (message.receiverId === user.id && !message.isRead) conversations.get(other.id).unreadCount += 1;
    }
    return NextResponse.json({ conversations: Array.from(conversations.values()) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible de charger les messages.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedAppUser(request);
    if (!user) return unauthorized();
    const body = await request.json();
    const receiverId = typeof body.receiverId === 'string' ? body.receiverId : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const listingId = typeof body.listingId === 'string' && body.listingId ? body.listingId : null;
    if (!receiverId || !content) return NextResponse.json({ error: 'Destinataire et message requis.' }, { status: 400 });
    if (receiverId === user.id) return NextResponse.json({ error: 'Vous ne pouvez pas vous écrire à vous-même.' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Message trop long (2 000 caractères maximum).' }, { status: 400 });
    const receiver = await db.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) return NextResponse.json({ error: 'Destinataire introuvable.' }, { status: 404 });
    const message = await db.message.create({
      data: { senderId: user.id, receiverId, listingId, content },
      include: { sender: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Impossible d’envoyer le message.' }, { status: 500 });
  }
}
