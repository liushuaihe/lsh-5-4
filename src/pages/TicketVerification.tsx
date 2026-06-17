import { useState, useEffect } from 'react';
import { ArrowLeft, Ticket, ShieldCheck, ShieldAlert, Loader2, Clock, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

export default function TicketVerification() {
  const navigate = useNavigate();
  const { concertId } = useParams<{ concertId?: string }>();
  const { user } = useAuthStore();
  
  const [concerts, setConcerts] = useState<any[]>([]);
  const [selectedConcertId, setSelectedConcertId] = useState<number | ''>('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [purchaseChannel, setPurchaseChannel] = useState('');
  const [seatInfo, setSeatInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [currentVerification, setCurrentVerification] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate, concertId]);

  useEffect(() => {
    if (concertId) {
      setSelectedConcertId(parseInt(concertId));
      setShowForm(true);
      loadCurrentStatus(parseInt(concertId));
    }
  }, [concertId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [concertRes, verifyRes] = await Promise.all([
        api.concerts.list(),
        api.verification.getTickets(),
      ]);
      setConcerts(concertRes.concerts || []);
      setVerifications(verifyRes.verifications || []);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentStatus = async (cId: number) => {
    try {
      const res = await api.verification.getTicket(cId);
      setCurrentVerification(res.verification);
    } catch (e: any) {
      setError(e.message || '加载状态失败');
    }
  };

  const handleConcertChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value ? parseInt(e.target.value) : '';
    setSelectedConcertId(cId);
    if (cId) {
      loadCurrentStatus(cId);
    } else {
      setCurrentVerification(null);
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedConcertId) {
      setError('请选择演唱会场次');
      return;
    }
    if (!ticketNumber.trim()) {
      setError('请输入票号');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.verification.submitTicket({
        concertId: selectedConcertId,
        ticketNumber: ticketNumber.trim(),
        purchaseChannel: purchaseChannel.trim(),
        seatInfo: seatInfo.trim(),
      });
      setCurrentVerification(res.verification);
      setSuccess('购票凭证提交成功，正在审核中');
      setTicketNumber('');
      setPurchaseChannel('');
      setSeatInfo('');
      loadData();
    } catch (e: any) {
      setError(e.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            已通过
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            审核中
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            未通过
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusDisplay = () => {
    if (!currentVerification) return null;
    
    switch (currentVerification.status) {
      case 'verified':
        return (
          <div className="glass rounded-xl p-5 border border-green-500/30 bg-green-500/5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">购票凭证已通过</h3>
                <p className="text-gray-400 text-xs">
                  {currentVerification.verifiedAt ? new Date(currentVerification.verifiedAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="glass rounded-xl p-5 border border-yellow-500/30 bg-yellow-500/5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">购票凭证审核中</h3>
                <p className="text-gray-400 text-xs">
                  {currentVerification.createdAt ? new Date(currentVerification.createdAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="glass rounded-xl p-5 border border-red-500/30 bg-red-500/5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">购票凭证未通过</h3>
                <p className="text-gray-400 text-xs">
                  {currentVerification.createdAt ? new Date(currentVerification.createdAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
            {currentVerification.rejectReason && (
              <p className="text-red-400 text-xs ml-13">拒绝原因：{currentVerification.rejectReason}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid p-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center mx-auto mb-4 neon-glow-pink">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl text-white mb-2">购票凭证核验</h1>
            <p className="text-gray-400 text-sm">核验您的演唱会购票凭证，成为可信用户</p>
          </div>

          {verifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">我的核验记录</h3>
              <div className="space-y-2">
                {verifications.map((v: any) => (
                  <div key={v.id} className="glass rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{v.concertName}</p>
                      <p className="text-gray-500 text-xs">{v.city} · {new Date(v.date).toLocaleDateString('zh-CN')}</p>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-neon-pink to-pink-600 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>新增购票核验</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">选择演唱会场次</label>
                <select
                  value={selectedConcertId}
                  onChange={handleConcertChange}
                  className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white focus:border-neon-pink focus:outline-none transition-colors"
                  disabled={submitting}
                >
                  <option value="">请选择演唱会</option>
                  {concerts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.city} ({new Date(c.date).toLocaleDateString('zh-CN')})
                    </option>
                  ))}
                </select>
              </div>

              {getStatusDisplay()}

              {selectedConcertId && (!currentVerification || currentVerification.status === 'rejected') && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">票号 *</label>
                    <input
                      type="text"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      placeholder="请输入票号或订单号"
                      className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white placeholder-gray-500 focus:border-neon-pink focus:outline-none transition-colors input-neon"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm mb-2">购票渠道</label>
                    <input
                      type="text"
                      value={purchaseChannel}
                      onChange={(e) => setPurchaseChannel(e.target.value)}
                      placeholder="如：大麦网、猫眼演出等"
                      className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white placeholder-gray-500 focus:border-neon-pink focus:outline-none transition-colors input-neon"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm mb-2">座位信息</label>
                    <input
                      type="text"
                      value={seatInfo}
                      onChange={(e) => setSeatInfo(e.target.value)}
                      placeholder="如：内场A区 12排 25号"
                      className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white placeholder-gray-500 focus:border-neon-pink focus:outline-none transition-colors input-neon"
                      disabled={submitting}
                    />
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      <span className="text-neon-pink">🔒 隐私保护：</span>
                      您的购票信息仅用于核验真实观演身份，平台将严格保密。
                      核验通过后，仅展示核验状态，不会公开具体票号。
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-neon-pink to-pink-600 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>提交中...</span>
                      </>
                    ) : (
                      <span>提交核验</span>
                    )}
                  </button>
                </>
              )}

              {showForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedConcertId('');
                    setCurrentVerification(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  取消
                </button>
              )}
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3 text-sm">购票核验权益</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-neon-pink mt-0.5">✓</span>
                <span className="text-gray-400">本场次发布帖子时展示"已验票"标识</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-pink mt-0.5">✓</span>
                <span className="text-gray-400">结合实名认证升级为"可信用户"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-pink mt-0.5">✓</span>
                <span className="text-gray-400">可信用户不受每日搭讪次数限制</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-pink mt-0.5">✓</span>
                <span className="text-gray-400">更高的可信度，降低黄牛风险</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
