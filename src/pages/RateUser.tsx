import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/utils/api';
import RatingStars from '@/components/RatingStars';

export default function RateUser() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [concertIdInput, setConcertIdInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!score || !userId) return;
    setSubmitting(true);
    try {
      await api.ratings.create(Number(userId), {
        score,
        comment: comment.trim(),
        concertId: concertIdInput ? Number(concertIdInput) : undefined,
      });
      navigate(`/profile/${userId}`);
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
        <h1 className="font-display text-xl text-white">评价</h1>
      </div>

      <div className="glass rounded-2xl p-6 max-w-lg mx-auto animate-slide-up">
        <div className="mb-6 text-center">
          <h2 className="font-display text-lg text-white neon-text-cyan mb-3">为 TA 评分</h2>
          <RatingStars score={score} interactive onChange={setScore} size={32} />
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">评价内容</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写下你的评价..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg bg-neon-dark border border-gray-700 text-white input-neon transition-all resize-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">演唱会 ID（可选）</label>
          <input
            type="text"
            value={concertIdInput}
            onChange={(e) => setConcertIdInput(e.target.value)}
            placeholder="输入演唱会 ID"
            className="w-full px-4 py-2.5 rounded-lg bg-neon-dark border border-gray-700 text-white input-neon transition-all"
          />
        </div>

        <button
          className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-cyan-600 text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting || !score}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '提交评价'}
        </button>
      </div>
    </div>
  );
}
