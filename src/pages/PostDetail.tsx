import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Star, Clock, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.posts.get(Number(id))
      .then((res) => setPost(res.post))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        帖子不存在
      </div>
    );
  }

  const isCompanion = post.type === 'companion';

  return (
    <div className="min-h-screen p-4 bg-grid">
      <div className="flex items-center gap-3 mb-6">
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display text-xl text-white">帖子详情</h1>
      </div>

      <div className="glass rounded-2xl p-6 max-w-lg mx-auto animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isCompanion ? 'bg-neon-pink/20 text-neon-pink' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
            {isCompanion ? '找同伴' : '置换周边'}
          </span>
        </div>

        <h2 className="text-xl text-white font-medium mb-3">{post.title}</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">{post.content}</p>

        <div className="border-t border-gray-700/50 pt-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center text-white font-bold">
              {post.author?.username?.[0] || '?'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{post.author?.username || '未知用户'}</p>
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                <Star size={12} className="fill-yellow-400" />
                <span>{post.author?.reputationScore ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-6">
          <Clock size={12} />
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleString('zh-CN') : ''}</span>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan to-cyan-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            onClick={() => navigate(`/messages/${post.author?.id}`)}
          >
            <MessageCircle size={16} />
            私信 TA
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg border border-neon-cyan/30 text-neon-cyan font-medium text-sm flex items-center justify-center gap-2 hover:bg-neon-cyan/10 transition-all"
            onClick={() => navigate(`/rate/${post.author?.id}`)}
          >
            <Star size={16} />
            评价 TA
          </button>
        </div>
      </div>
    </div>
  );
}
