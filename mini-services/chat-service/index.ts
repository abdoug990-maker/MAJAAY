import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'file:/home/z/my-project/db/custom.db',
});

const io = new Server({
  cors: { origin: '*' },
  pingTimeout: 60000,
});

const onlineUsers = new Map<string, string>(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('Chat client connected:', socket.id);

  socket.on('join', async (userId: string) => {
    onlineUsers.set(socket.id, userId);
    socket.join(userId);
    console.log(`User ${userId} joined chat`);
  });

  socket.on('get-conversations', async (userId: string) => {
    try {
      // Get all messages where user is sender or receiver, grouped by the other user
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true, phone: true } },
          receiver: { select: { id: true, name: true, avatar: true, phone: true } },
          listing: { select: { id: true, title: true } },
        },
      });

      // Group into conversations
      const convMap = new Map<string, any>();
      for (const msg of messages) {
        const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        const other = msg.senderId === userId ? msg.receiver : msg.sender;
        const convKey = msg.listingId ? `${otherId}-${msg.listingId}` : otherId;
        
        if (!convMap.has(convKey)) {
          convMap.set(convKey, {
            userId: otherId,
            userName: other.name,
            userAvatar: other.avatar,
            userPhone: other.phone,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
            listingId: msg.listingId,
            listingTitle: msg.listing?.title || null,
          });
        }
        // Count unread (messages where user is receiver and not read)
        if (msg.receiverId === userId && !msg.isRead) {
          const conv = convMap.get(convKey);
          if (conv) conv.unreadCount++;
        }
      }
      socket.emit('conversations', Array.from(convMap.values()));
    } catch (err) {
      console.error('Get conversations error:', err);
      socket.emit('error', 'Erreur lors du chargement des conversations');
    }
  });

  socket.on('get-messages', async ({ userId1, userId2, listingId }: { userId1: string; userId2: string; listingId?: string }) => {
    try {
      const where: any = {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      };
      if (listingId) where.listingId = listingId;

      const msgs = await prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      });

      // Mark as read
      await prisma.message.updateMany({
        where: { senderId: userId2, receiverId: userId1, isRead: false },
        data: { isRead: true },
      });

      socket.emit('messages', msgs);
    } catch (err) {
      console.error('Get messages error:', err);
    }
  });

  socket.on('send-message', async (data: { senderId: string; receiverId: string; content: string; listingId?: string }) => {
    try {
      const message = await prisma.message.create({
        data: {
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          listingId: data.listingId || null,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });

      // Send to both users
      io.to(data.receiverId).emit('new-message', message);
      io.to(data.senderId).emit('new-message', message);

      // Update contact count on listing if applicable
      if (data.listingId) {
        await prisma.listing.update({
          where: { id: data.listingId },
          data: { contactCount: { increment: 1 } },
        });
      }
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', 'Erreur lors de l\'envoi du message');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3003;
io.listen(PORT);
console.log(`Ma Jaay Chat Service running on port ${PORT}`);
