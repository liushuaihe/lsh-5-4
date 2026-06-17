import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, MessageCircle, Shield, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import TrustedBadge from './TrustedBadge';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token, logout } = useAuthStore();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: '首页' },
    { to: '/messages', label: '私信', icon: MessageCircle, badge: true },
    { to: '/profile', label: '个人中心' },
  ];

  const verifyLinks = [
    { to: '/verification/identity', label: '实名认证', icon: Shield },
    { to: '/verification/ticket', label: '购票核验', icon: Ticket },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-neon-pink/30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-display text-xl font-bold text-neon-pink neon-text-pink tracking-wider">
          CONCERTVIBE
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative text-sm transition-colors ${
                isActive(link.to)
                  ? 'text-neon-pink neon-text-pink'
                  : 'text-gray-300 hover:text-neon-pink'
              }`}
            >
              {link.icon && <link.icon className="mr-1 inline h-4 w-4" />}
              {link.label}
              {link.badge && token && (
                <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {token && user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{user.username}</span>
                <TrustedBadge 
                  identityVerified={user.identityVerified}
                  fullyVerified={user.identityVerified && (user.verifiedTicketCount || 0) > 0}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-1">
                {verifyLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive(link.to)
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                        : 'text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10'
                    }`}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-neon-pink hover:text-neon-pink"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-1.5 text-sm text-neon-pink transition-colors hover:bg-neon-pink/10"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-neon-pink px-4 py-1.5 text-sm text-white transition-colors hover:bg-neon-pink/80"
              >
                注册
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="glass border-t border-white/5 md:hidden animate-slide-up">
          <div className="flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(link.to)
                    ? 'bg-neon-pink/10 text-neon-pink'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
                {link.badge && token && (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
            ))}
            {token && user && (
              <>
                <div className="my-2 border-t border-white/5" />
                <p className="px-3 text-xs text-gray-500">信任认证</p>
                {verifyLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive(link.to)
                        ? 'bg-neon-cyan/10 text-neon-cyan'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            <div className="my-2 border-t border-white/5" />
            {token && user ? (
              <div className="flex flex-col gap-2 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{user.username}</span>
                    <TrustedBadge 
                      identityVerified={user.identityVerified}
                      fullyVerified={user.identityVerified && (user.verifiedTicketCount || 0) > 0}
                      size="sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-1 rounded-lg border border-gray-600 py-2 text-sm text-gray-300 hover:border-neon-pink hover:text-neon-pink"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg py-2 text-center text-sm text-neon-pink hover:bg-neon-pink/10"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-neon-pink py-2 text-center text-sm text-white hover:bg-neon-pink/80"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
