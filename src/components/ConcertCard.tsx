import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Music } from 'lucide-react';

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

interface ConcertCardProps {
  concert: Concert;
}

export default function ConcertCard({ concert }: ConcertCardProps) {
  const navigate = useNavigate();
  const posterUrl = concert.poster || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(concert.name)}&image_size=landscape_16_9`;

  return (
    <div
      onClick={() => navigate(`/concert/${concert.id}`)}
      className="glass group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:animate-float hover:neon-glow-pink"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={posterUrl}
          alt={concert.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neon-dark/90 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-lg font-bold text-neon-pink neon-text-pink line-clamp-1">
            {concert.name}
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Music className="h-4 w-4 text-neon-cyan" />
          <span>{concert.singer}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="h-4 w-4 text-neon-cyan" />
          <span>{concert.city} · {concert.venue}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="h-4 w-4 text-neon-cyan" />
          <span>{concert.date}</span>
        </div>
      </div>
    </div>
  );
}
