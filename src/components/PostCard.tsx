import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

interface PostCardProps {
  id: number;
  type: string;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  concertId: number;
  createdAt: string;
}

export default function PostCard({ id, type, title, content, authorId, authorName, concertId, createdAt }: PostCardProps) {
  const navigate = useNavigate();
  const isCompanion = type === 'companion';

  return (
    <div
      className={`glass rounded-xl p-4 cursor-pointer transition-all duration-300 animate-slide-up ${isCompanion ? 'hover:neon-border-pink' : 'hover:neon-border-cyan'}`}
      onClick={() => navigate(`/post/${id}`)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isCompanion ? 'bg-neon-pink/20 text-neon-pink' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
          {isCompanion ? '找同伴' : '置换周边'}
        </span>
      </div>
      <h3 className="text-white font-medium text-lg mb-1">{title}</h3>
      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{content}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>{authorName}</span>
        </div>
        <span>{new Date(createdAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  );
}
