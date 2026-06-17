import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Loader2, ShieldCheck, Shield, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/utils/api';
import RatingStars from '@/components/RatingStars';
import TrustedBadge from '@/components/TrustedBadge';

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const isOwn = !userId || String(currentUser?.id) === userId;

  const [profile, setProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'ratings'>('posts');
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    if (isOwn && currentUser) {
      setProfile(currentUser);
      setLoading(false);
    } else if (userId) {
      api.auth.me()
        .then((res) => {
          if (String(res.user?.id) === userId) {
            setProfile(res.user);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId, currentUser, isOwn]);

  useEffect(() => {
    const targetId = isOwn ? currentUser?.id : Number(userId);
    if (!targetId) return;

    if (activeTab === 'ratings') {
      api.ratings.list(targetId)
        .then((res) => setRatings(res.ratings || []))
        .catch(() => setRatings([]));
    } else {
      api.concerts.list()
        .then(async (res) => {
          const allPosts: any[] = [];
          const concerts = res.concerts || [];
          for (const c of concerts.slice(0, 5)) {
            try {
              const postRes = await api.posts.list(c.id);
              const mine = (postRes.posts || []).filter((p: any) => p.author?.id === targetId);
              allPosts.push(...mine);
            } catch {
              // Ignore errors for individual concert post queries
            }
          }
          setUserPosts(allPosts);
        })
        .catch(() => setUserPosts([]));
    }
  }, [activeTab, userId, currentUser, isOwn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        请先登录查看个人中心
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-grid">
      <div className="glass rounded-2xl p-6 max-w-lg mx-auto mb-4 animate-slide-up">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan p-0.5 mb-3 neon-glow-pink">
            <div className="w-full h-full rounded-full bg-neon-dark flex items-center justify-center text-2xl text-white font-bold">
              {profile.username?.[0] || '?'}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-lg text-white">{profile.username}</h2>
            <TrustedBadge 
              identityVerified={profile.identityVerified}
              fullyVerified={profile.identityVerified && (profile.verifiedTicketCount || 0) > 0}
              size="sm"
            />
          </div>
          <p className="text-gray-400 text-sm mb-2">{profile.email}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <RatingStars score={Math.round(profile.reputationScore || 0)} size={18} />
            <span className="text-yellow-400 text-sm ml-1">
              {(profile.reputationScore || 0).toFixed(1)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              profile.identityVerified 
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' 
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              <Shield size={12} />
              <span>{profile.identityVerified ? '已实名认证' : '未实名认证'}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              (profile.verifiedTicketCount || 0) > 0
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              <Ticket size={12} />
              <span>{profile.verifiedTicketCount || 0} 场购票核验</span>
            </div>
          </div>

          {isOwn && (
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button 
                onClick={() => navigate('/verification/identity')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                  profile.identityVerified
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20'
                }`}
              >
                <ShieldCheck size={14} />
                {profile.identityVerified ? '已完成实名认证' : '去实名认证'}
              </button>
              <button 
                onClick={() => navigate('/verification/ticket')}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-neon-pink/30 text-neon-pink text-sm hover:bg-neon-pink/10 transition-all"
              >
                <Ticket size={14} />
                购票凭证核验
              </button>
              <button className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:bg-gray-800 transition-all">
                <Edit3 size={14} />
                编辑资料
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'posts'
                ? 'bg-neon-pink/20 text-neon-pink neon-border-pink'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            我的帖子
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'ratings'
                ? 'bg-neon-cyan/20 text-neon-cyan neon-border-cyan'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('ratings')}
          >
            收到的评价
          </button>
        </div>

        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无帖子</div>
          ) : (
            <div className="flex flex-col gap-3">
              {userPosts.map((post: any) => (
                <div key={post.id} className="glass rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      post.type === 'companion' ? 'bg-neon-pink/20 text-neon-pink' : 'bg-neon-cyan/20 text-neon-cyan'
                    }`}>
                      {post.type === 'companion' ? '找同伴' : '置换周边'}
                    </span>
                  </div>
                  <h3 className="text-white font-medium mb-1">{post.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )
        ) : ratings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无评价</div>
        ) : (
          <div className="flex flex-col gap-3">
            {ratings.map((r: any, i: number) => (
              <div key={i} className="glass rounded-xl p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{r.rater?.username || '匿名用户'}</span>
                  <span className="text-gray-500 text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
                <RatingStars score={r.score} size={14} />
                {r.comment && <p className="text-gray-400 text-sm mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
