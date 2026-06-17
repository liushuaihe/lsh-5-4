import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.messages.conversations()
      .then((res) => setConversations(res.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-grid">
      <h1 className="font-display text-xl text-white neon-text-cyan mb-6">消息</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <MessageCircle size={48} className="mb-3 opacity-50" />
          <p>暂无对话</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv, i) => (
            <div
              key={conv.partner?.id || i}
              className="glass rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:neon-border-cyan animate-slide-up"
              onClick={() => navigate(`/messages/${conv.partner?.id}`)}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center text-white font-bold shrink-0">
                {conv.partner?.username?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium text-sm">{conv.partner?.username || '未知'}</p>
                  <span className="text-gray-500 text-xs shrink-0">
                    {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
                <p className="text-gray-400 text-xs truncate mt-0.5">{conv.lastMessage || ''}</p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-2.5 h-2.5 rounded-full bg-neon-pink shrink-0 animate-pulse-neon" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
