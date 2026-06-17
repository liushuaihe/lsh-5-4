import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Music, Plus, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import PostCard from '@/components/PostCard';

export default function ConcertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [concert, setConcert] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'companion' | 'merch'>('companion');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.concerts.get(Number(id))
      .then((res) => setConcert(res.concert))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setPostsLoading(true);
    api.posts.list(Number(id), activeTab)
      .then((res) => setPosts(res.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [id, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        演唱会不存在
      </div>
    );
  }

  const posterUrl = concert.poster || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(concert.name)}&image_size=landscape_16_9`;

  return (
    <div className="min-h-screen pb-24">
      <div className="relative h-72 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neon-dark/60 via-neon-dark/80 to-neon-dark" />
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <h1 className="font-display text-2xl md:text-3xl text-white neon-text-pink mb-2">
            {concert.name}
          </h1>
          <div className="flex items-center gap-2 text-gray-300 mb-1">
            <Music size={16} className="text-neon-cyan" />
            <span>{concert.singer}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-neon-pink" />
              <span>{concert.city} · {concert.venue}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-neon-cyan" />
              <span>{concert.date ? new Date(concert.date).toLocaleDateString('zh-CN') : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'companion'
                ? 'bg-neon-pink/20 text-neon-pink neon-border-pink'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('companion')}
          >
            找同伴
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'merch'
                ? 'bg-neon-cyan/20 text-neon-cyan neon-border-cyan'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('merch')}
          >
            置换周边
          </button>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无帖子，快来发布第一个吧！
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                type={post.type}
                title={post.title}
                content={post.content}
                authorId={post.author?.id}
                authorName={post.author?.username}
                concertId={post.concertId}
                createdAt={post.createdAt}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-neon-pink to-pink-600 text-white flex items-center justify-center shadow-lg neon-glow-pink animate-float z-50"
        onClick={() => navigate(`/concert/${id}/post`)}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
