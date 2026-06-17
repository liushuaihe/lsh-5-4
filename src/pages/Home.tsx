import { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { api } from '@/utils/api';
import ConcertCard from '@/components/ConcertCard';

interface Concert {
  id: number;
  name: string;
  singer: string;
  city: string;
  venue: string;
  date: string;
  poster: string;
  description: string;
}

export default function Home() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async (kw?: string) => {
    setLoading(true);
    try {
      const res = await api.concerts.list(kw);
      setConcerts(res.concerts || []);
    } catch {
      setConcerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchConcerts(keyword || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen">
      <section className="bg-grid relative overflow-hidden px-4 pb-16 pt-20 text-center">
        <div className="animate-slide-up">
          <h1 className="font-display mb-4 text-4xl font-bold text-neon-pink neon-text-pink md:text-5xl lg:text-6xl">
            发现你的演唱会
          </h1>
          <p className="mx-auto max-w-xl text-gray-400">
            找同伴、换周边、分享精彩 — 让每一场演唱会都不孤单
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-lg items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索歌手或城市..."
              className="input-neon w-full rounded-xl border border-white/10 bg-neon-dark/50 py-3 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-cyan px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            搜索
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="mb-4 h-48 animate-pulse rounded-lg bg-white/5" />
                <div className="space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : concerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-gray-600" />
            <p className="text-lg text-gray-400">暂无演唱会信息</p>
            <p className="mt-1 text-sm text-gray-500">换个关键词试试？</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
