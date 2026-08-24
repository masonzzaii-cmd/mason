import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminLoginModal: React.FC = () => {
  const { isAdmin, isLoginModalOpen, closeLoginModal, login, logout } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMessage('');
    } else {
      document.body.style.overflow = '';
      setEmail('');
      setPassword('');
      setErrorMessage('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoginModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMessage(res.error || '账号或密码不正确');
      }
    }, 200);
  };

  return (
    <div
      id="admin-login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300"
    >
      <div
        className="w-full max-w-md bg-[#0b0d13] border border-[#b4935d]/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#b4935d]/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 py-5 border-b border-[#1f2432] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b4935d]/10 border border-[#b4935d]/30 flex items-center justify-center text-[#b4935d]">
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-orbitron font-semibold text-sm tracking-wider text-[#eee7db]">
                {isAdmin ? 'ADMINISTRATOR' : 'ADMIN ACCESS'}
              </h3>
              <p className="text-[10px] text-[#9c9387]">
                {isAdmin ? '网站管理控制面板' : '管理员身份权限验证'}
              </p>
            </div>
          </div>

          <button
            id="admin-modal-close-btn"
            onClick={closeLoginModal}
            className="p-1.5 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isAdmin ? (
            /* Logged in state */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#121620] border border-[#b4935d]/30 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-[#b4935d] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-orbitron font-semibold text-[#eee7db]">
                    已解锁全站管理权限
                  </h4>
                  <p className="text-xs text-[#a8a195] leading-relaxed">
                    当前账号拥有最高编辑权限。您可以直接在网站各板块点击操作按钮，新增、删除或编辑项目作品代表作、PDF 链接与名称、获奖荣誉以及软件技能库。
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#b4935d]/15 text-[#cbb082] text-[11px] font-orbitron">
                      当前状态: 管理员已认证
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="admin-logout-btn"
                  onClick={() => {
                    logout();
                    closeLoginModal();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-orbitron font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出管理员模式</span>
                </button>
                <button
                  id="admin-keep-editing-btn"
                  onClick={closeLoginModal}
                  className="flex-1 py-2.5 rounded-xl bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] text-xs font-orbitron font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#b4935d]/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>继续编辑内容</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#a8a195] leading-relaxed">
                请输入管理员账号与密码以解锁网站作品、荣誉、技能与资料的编辑与修改权限。
              </p>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Account / Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-orbitron text-[#c2b5a1]">
                  管理员账号 / EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#787165]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入管理员邮箱账号..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#262b3a] focus:border-[#b4935d] text-[#eee7db] text-xs placeholder-[#665f54] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-orbitron text-[#c2b5a1]">
                  管理密码 / PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#787165]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141720] border border-[#262b3a] focus:border-[#b4935d] text-[#eee7db] text-xs placeholder-[#665f54] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#787165] hover:text-[#eee7db] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="admin-submit-login-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#b4935d] hover:bg-[#cbb082] disabled:opacity-50 text-[#08090c] text-xs font-orbitron font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#b4935d]/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? '验证中...' : '确认登录并解锁权限'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
