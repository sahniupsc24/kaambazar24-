import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { ChatService } from '../services/ChatService';

const router = Router();
const chatService = new ChatService();

// GET /api/chat/contracts/:contractId
router.get('/contracts/:contractId', authenticate, async (req, res) => {
  try {
    const messages = await chatService.getMessagesByContract(req.params.contractId, req.user!.id);
    // Sanitize user data
    const sanitizedMessages = messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      receiverId: m.receiverId,
      isRead: m.isRead,
      senderRole: m.senderId === req.user!.id ? 'YOU' : 'OTHER',
    }));

    res.json({ success: true, data: sanitizedMessages });
  } catch (err: any) {
    res.status(403).json({ success: false, message: err.message });
  }
});

// POST /api/chat/contracts/:contractId
router.post('/contracts/:contractId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const message = await chatService.sendMessage(req.params.contractId, req.user!.id, content);
    res.json({ success: true, data: message });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/chat/contracts/:contractId/read
router.post('/contracts/:contractId/read', authenticate, async (req, res) => {
  try {
    await chatService.markAsRead(req.params.contractId, req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
