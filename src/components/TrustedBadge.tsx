import { ShieldCheck, Shield, Info } from 'lucide-react';
import { useState } from 'react';

interface TrustedBadgeProps {
  identityVerified?: boolean;
  ticketVerified?: boolean;
  fullyVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function TrustedBadge({ 
  identityVerified = false, 
  ticketVerified = false, 
  fullyVerified = false,
  size = 'sm',
  showTooltip = true
}: TrustedBadgeProps) {
  const [showInfo, setShowInfo] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (fullyVerified) {
    return (
      <div 
        className="relative inline-flex items-center gap-1"
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 ${badgeSizes[size]}`}>
          <ShieldCheck className={`${sizeClasses[size]} text-yellow-400`} />
          <span className="text-yellow-400 font-medium">可信用户</span>
        </div>
        {showInfo && showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap shadow-xl">
            已完成实名认证 + 购票凭证核验
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  if (identityVerified) {
    return (
      <div 
        className="relative inline-flex items-center gap-1"
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 ${badgeSizes[size]}`}>
          <Shield className={`${sizeClasses[size]} text-neon-cyan`} />
          <span className="text-neon-cyan font-medium">已实名</span>
        </div>
        {showInfo && showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap shadow-xl">
            已完成实名认证
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  if (ticketVerified) {
    return (
      <div 
        className="relative inline-flex items-center gap-1"
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 ${badgeSizes[size]}`}>
          <Info className={`${sizeClasses[size]} text-green-400`} />
          <span className="text-green-400 font-medium">已验票</span>
        </div>
        {showInfo && showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap shadow-xl">
            已完成本场购票凭证核验
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  return null;
}
