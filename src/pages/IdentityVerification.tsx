import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, Loader2, Clock, User, MapPin, Calendar, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface ValidationInfo {
  province: string;
  birthday: string;
  age: number;
  gender: string;
  confidence: number;
  message: string;
}

export default function IdentityVerification() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadStatus();
  }, [user, navigate]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.verification.getIdentity();
      setVerification(res.verification);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setSuccess('');
    setValidationInfo(null);

    if (!realName.trim()) {
      setError('请输入真实姓名');
      return;
    }
    if (!idCard.trim()) {
      setError('请输入身份证号');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.verification.submitIdentity({ realName, idCard });
      setVerification(res.verification);
      if (res.validationInfo) {
        setValidationInfo(res.validationInfo);
      }
      setSuccess('实名认证验证通过！');
      setRealName('');
      setIdCard('');
    } catch (e: any) {
      setError(e.message || '提交失败');
      if (e.code) {
        setErrorCode(e.code);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getValidationInfoDisplay = (info: ValidationInfo | null) => {
    if (!info) return null;
    
    return (
      <div className="glass rounded-xl p-4 border border-cyan-500/30 bg-cyan-500/5 mt-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          验证信息
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">发证地区：</span>
            <span className="text-white">{info.province}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">出生日期：</span>
            <span className="text-white">{info.birthday}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">年龄：</span>
            <span className="text-white">{info.age}岁</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">性别：</span>
            <span className="text-white">{info.gender}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-400 text-xs">
            <span className="text-cyan-400">验证结果：</span>
            {info.message}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            置信度：{(info.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  const getStatusDisplay = () => {
    if (!verification) return null;
    
    let info = validationInfo;
    if (!info && verification.verificationInfo) {
      try {
        info = JSON.parse(verification.verificationInfo);
      } catch {
        // ignore
      }
    }
    
    switch (verification.status) {
      case 'verified':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-6 border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">实名认证已通过</h3>
                  <p className="text-gray-400 text-sm">
                    认证时间：{verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleString('zh-CN') : ''}
                  </p>
                </div>
              </div>
              <p className="text-green-400 text-sm">您已完成实名认证，享受更多平台权限</p>
            </div>
            {getValidationInfoDisplay(info)}
          </div>
        );
      case 'pending':
        return (
          <div className="glass rounded-xl p-6 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">实名认证审核中</h3>
                <p className="text-gray-400 text-sm">
                  提交时间：{verification.createdAt ? new Date(verification.createdAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
            <p className="text-yellow-400 text-sm">您的实名认证正在审核中，请耐心等待</p>
          </div>
        );
      case 'rejected':
        return (
          <div className="glass rounded-xl p-6 border border-red-500/30 bg-red-500/5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">实名认证未通过</h3>
                <p className="text-gray-400 text-sm">
                  提交时间：{verification.createdAt ? new Date(verification.createdAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
            {verification.rejectReason && (
              <p className="text-red-400 text-sm mb-2">拒绝原因：{verification.rejectReason}</p>
            )}
            <p className="text-gray-400 text-sm">请检查信息后重新提交</p>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center mx-auto mb-4 neon-glow-cyan">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl text-white mb-2">实名认证</h1>
            <p className="text-gray-400 text-sm">完成实名认证，提升账号可信度，享受更多平台权限</p>
          </div>

          {getStatusDisplay()}

          {(!verification || verification.status === 'rejected') && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">真实姓名</label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="请输入您的真实姓名"
                  className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors input-neon"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">身份证号</label>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value.toUpperCase())}
                  placeholder="请输入18位身份证号"
                  maxLength={18}
                  className="w-full px-4 py-3 rounded-xl bg-neon-dark border border-gray-700 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors input-neon"
                  disabled={submitting}
                />
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-400 text-xs leading-relaxed">
                  <span className="text-neon-cyan">🔒 隐私保护：</span>
                  您的身份信息仅用于实名认证验证，平台将严格保密，不会泄露给任何第三方。
                  验证通过后，您的真实姓名不会公开展示。
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm mb-2">{error}</p>
                  {errorCode === 'ID_CARD_INVALID' && (
                    <p className="text-gray-400 text-xs">
                      💡 提示：请检查身份证号是否正确。18位身份证号最后一位为校验位，
                      由前17位通过ISO 7064:1983.MOD 11-2算法计算得出。
                      测试可用：110101199003077654（张三）
                    </p>
                  )}
                  {errorCode === 'NAME_ID_MISMATCH' && (
                    <p className="text-gray-400 text-xs">
                      💡 提示：公安系统验证姓名与身份证号不匹配。
                      请确保填写的是身份证上的真实姓名。
                      测试可用：姓名"张三" + 身份证号110101199003077654
                    </p>
                  )}
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
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-neon-cyan to-cyan-600 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <span>提交实名认证</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3 text-sm">实名认证权益</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-neon-cyan mt-0.5">✓</span>
                <span className="text-gray-400">每日陌生人搭讪次数提升至10-20次</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-cyan mt-0.5">✓</span>
                <span className="text-gray-400">发布帖子时展示"已实名"标识</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-cyan mt-0.5">✓</span>
                <span className="text-gray-400">结合购票核验可升级为"可信用户"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neon-cyan mt-0.5">✓</span>
                <span className="text-gray-400">可信用户不受每日搭讪次数限制</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
