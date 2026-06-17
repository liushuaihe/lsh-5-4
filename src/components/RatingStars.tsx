import { Star } from 'lucide-react';

interface RatingStarsProps {
  score: number;
  interactive?: boolean;
  onChange?: (score: number) => void;
  size?: number;
}

export default function RatingStars({ score, interactive = false, onChange, size = 20 }: RatingStarsProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={`${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} ${interactive ? 'cursor-pointer hover:text-yellow-300 transition-colors' : ''}`}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}
