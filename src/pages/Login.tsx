import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 animate-slide-up">
        <h1 className="font-display mb-8 text-center text-3xl font-bold text-neon-pink neon-text-pink">
          登录
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          还没有账号？
          <Link to="/register" className="ml-1 text-neon-cyan hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
