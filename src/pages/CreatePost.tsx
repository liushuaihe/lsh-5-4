import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';

export default function CreatePost() {
  const { concertId } = useParams<{ concertId: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState<'companion' | 'merch'>('companion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !concertId) return;
    setSubmitting(true);
    try {
      await api.posts.create(Number(concertId), { type, title: title.trim(), content: content.trim() });
      navigate(`/concert/${concertId}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-grid">
      <div className="flex items-center gap-3 mb-6">
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display text-xl text-white">发布帖子</h1>
      </div>

      <div className="glass rounded-2xl p-6 max-w-lg mx-auto">
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">类型</label>
          <div className="flex gap-3">
            <button
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                type === 'companion'
                  ? 'bg-neon-pink/20 text-neon-pink neon-border-pink'
                  : 'text-gray-400 border border-gray-700'
              }`}
              onClick={() => setType('companion')}
            >
              找同伴
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                type === 'merch'
                  ? 'bg-neon-cyan/20 text-neon-cyan neon-border-cyan'
                  : 'text-gray-400 border border-gray-700'
              }`}
              onClick={() => setType('merch')}
            >
              置换周边
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入帖子标题"
            className="w-full px-4 py-2.5 rounded-lg bg-neon-dark border border-gray-700 text-white input-neon transition-all"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="描述你的需求..."
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-neon-dark border border-gray-700 text-white input-neon transition-all resize-none"
          />
        </div>

        <button
          className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-pink to-pink-600 text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '发布'}
        </button>
      </div>
    </div>
  );
}
