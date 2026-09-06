import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Send, X, MessageSquare, AlertCircle } from 'lucide-react';
import { PrimaryButton } from './common/Primitives';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderRole: 'YOU' | 'OTHER';
}

interface ChatDrawerProps {
  contractId: string;
  otherPartyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDrawer({ contractId, otherPartyName, isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOpen) {
      loadMessages();
      interval = setInterval(loadMessages, 5000); // poll every 5s
    }
    return () => clearInterval(interval);
  }, [isOpen, contractId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const res = await api.get(`/chat/contracts/${contractId}`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
      // Also mark as read
      await api.post(`/chat/contracts/${contractId}/read`).catch(() => {});
    } catch (e) {
      console.error('Failed to load chat messages', e);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage('');
    try {
      setIsLoading(true);
      await api.post(`/chat/contracts/${contractId}`, { content: tempMessage });
      await loadMessages();
    } catch (error) {
      console.error('Send failed', error);
      // Revert if failed
      setNewMessage(tempMessage);
      alert('Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 
        }} 
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 400,
          background: 'var(--bg-card)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{otherPartyName}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Contract Chat</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Message List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-surface)' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#fef3c7', color: '#92400e', borderRadius: 8, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertCircle size={14} /> For your safety, always communicate inside the app.
          </div>
          
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 14 }}>
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === 'YOU';
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div 
                    style={{ 
                      background: isMe ? 'var(--primary)' : 'var(--bg-card)', 
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: 16,
                      borderBottomRightRadius: isMe ? 4 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 4,
                      border: isMe ? 'none' : '1px solid var(--border)',
                      fontSize: 14,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 24,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: (isLoading || !newMessage.trim()) ? 'var(--border)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isLoading || !newMessage.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
