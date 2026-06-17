import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import TrustedBadge from '@/components/TrustedBadge';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io();
  }
  return socket;
}

export default function Chat() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [partnerIdentityVerified, setPartnerIdentityVerified] = useState(false);
  const [error, setError] = useState('');
  const [showLimitInfo, setShowLimitInfo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!partnerId) return;
    api.messages.list(Number(partnerId))
      .then((res) => {
        const msgs = res.messages || [];
        setMessages(msgs.reverse());
        for (const m of msgs) {
          if (m.sender?.id === Number(partnerId)) {
            setPartnerName(m.sender?.username || '');
            setPartnerIdentityVerified(m.sender?.identityVerified || false);
            break;
          }
        }
        if (!partnerName && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.sender?.id !== user?.id) {
            setPartnerName(lastMsg.sender?.username || '');
            setPartnerIdentityVerified(lastMsg.sender?.identityVerified || false);
          }
        }
        if (msgs.length === 0) {
          setShowLimitInfo(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerId]);

  useEffect(() => {
    const s = getSocket();
    const handler = (msg: any) => {
      if (msg.senderId === Number(partnerId) || msg.sender_id === Number(partnerId)) {
        setMessages((prev) => [...prev, normalizeKeys(msg)]);
      }
    };
    s.on('private:message', handler);
    s.on('private:message:received', handler);
    return () => {
      s.off('private:message', handler);
      s.off('private:message:received', handler);
    };
  }, [partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !partnerId || !user) return;
    setError('');
    try {
      const res = await api.messages.send(Number(partnerId), text);
      const msg = res.message;
      setMessages((prev) => [...prev, msg]);
      const s = getSocket();
      s.emit('private:message', { senderId: user.id, receiverId: Number(partnerId), content: text });
      setNewMessage('');
      setShowLimitInfo(false);
    } catch (e: any) {
      setError(e.message || '发送失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-grid">
      <div className="glass flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/messages')}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center text-white text-sm font-bold">
          {partnerName?.[0] || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{partnerName || '对话'}</span>
            <TrustedBadge 
              identityVerified={partnerIdentityVerified}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {messages.map((msg, i) => {
          const isMine = user ? (msg.senderId === user.id || msg.sender?.id === user.id) : false;
          return (
            <div
              key={msg.id || i}
              className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-gradient-to-r from-neon-pink to-pink-600 text-white rounded-br-sm'
                    : 'bg-gradient-to-r from-neon-cyan/80 to-cyan-700/80 text-white rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 shrink-0">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        </div>
      )}
      {showLimitInfo && !error && user && (
        <div className="px-4 py-2 bg-neon-cyan/5 border-t border-neon-cyan/20 shrink-0">
          <p className="text-neon-cyan text-xs">
            💡 提示：完成实名认证和购票核验可提升每日陌生人搭讪次数限制
          </p>
        </div>
      )}
      <div className="glass px-4 py-3 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 px-4 py-2.5 rounded-full bg-neon-dark border border-gray-700 text-white text-sm input-neon"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-pink to-pink-600 text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-all"
          onClick={handleSend}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = normalizeKeys(obj[key]);
    }
    return result;
  }
  return obj;
}
