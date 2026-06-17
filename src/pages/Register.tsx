import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    }
  };

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 animate-slide-up">
        <h1 className="font-display mb-8 text-center text-3xl font-bold text-neon-pink neon-text-pink">
          注册
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm text-gray-300">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-neon w-full rounded-lg border border-white/10 bg-neon-dark/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-colors"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-300">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-neon w-full rounded-lg border border-white/10 bg-neon-dark/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-colors"
              placeholder="请输入邮箱"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-gray-300">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-neon w-full rounded-lg border border-white/10 bg-neon-dark/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-colors"
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-neon-pink to-neon-cyan py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          已有账号？
          <Link to="/login" className="ml-1 text-neon-cyan hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
