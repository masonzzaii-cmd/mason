import React, { useEffect } from 'react';
import { X, Mail, Phone, Lock, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface StaggeredMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({ isOpen, onClose }) => {
  const { isAdmin, openLoginModal, logout } = useAdmin();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems = [
    { label: 'HOME', href: '#hero', zh: '首页' },
    { label: 'ABOUT', href: '#about', zh: '关于我' },
    { label: 'SKILLS', href: '#skills', zh: '专业技能' },
    { label: 'EXPERIENCE', href: '#experience', zh: '工作经历' },
    { label: 'HONORS', href: '#honors', zh: '获得荣誉' },
    { label: 'PROJECTS', href: '#projects', zh: '项目作品' },
    { label: 'BRANDS', href: '#brands', zh: '合作品牌' },
    { label: 'CONTACT', href: '#contact', zh: '联系我' },
  ];

  const handleAdminAction = () => {
    onClose();
    openLoginModal();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-500 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sliding Panel */}
      <aside
        className={`absolute top-0 right-0 w-full sm:w-[480px] h-full bg-[#07080a] border-l border-[#b4935d]/30 backdrop-blur-2xl p-8 sm:p-12 flex flex-col justify-between overflow-y-auto transition-transform duration-500 ease-out z-10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          {/* Header in panel */}
          <div className="flex items-center justify-between pb-8 border-b border-[#b4935d]/20">
            <span className="font-orbitron text-[10px] tracking-[0.25em] text-[#a98d61]">
              NAVIGATION
            </span>
            <button
              onClick={onClose}
              className="p-2 text-[#eee7db] hover:text-[#b4935d] transition-colors rounded-full hover:bg-white/5"
              aria-label="关闭菜单"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links with staggered animation */}
          <ul className="mt-6 space-y-1">
            {navItems.map((item, idx) => (
              <li key={item.label} className="overflow-hidden">
                <a
                  href={item.href}
                  onClick={onClose}
                  className={`group block py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-all duration-300 transform border-b border-white/[0.04] hover:border-[#b4935d]/30 ${
                    isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                  }`}
                  style={{ transitionDelay: `${isOpen ? 80 + idx * 45 : 0}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-orbitron text-xl sm:text-2xl font-medium tracking-wider text-[#eee7db] group-hover:text-[#b4935d] group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap">
                      {item.label}
                    </span>
                    <span className="text-xs sm:text-sm font-sans text-[#a98d61] group-hover:text-[#eee7db] transition-colors whitespace-nowrap shrink-0">
                      {item.zh}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Section: Admin Access Box + Socials & Info */}
        <div className="pt-8 border-t border-[#b4935d]/20 space-y-6">
          {/* Dedicated Administrator Access Card in Menu */}
          <div className="p-4 rounded-xl bg-[#0f1219] border border-[#232838] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-[10px] tracking-[0.2em] text-[#b4935d] flex items-center gap-1.5">
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-[#b4935d]" /> : <Lock className="w-3.5 h-3.5 text-[#a8a195]" />}
                ADMINISTRATOR / 管理权限
              </span>
              <span className={`text-[10px] font-orbitron px-2 py-0.5 rounded ${
                isAdmin ? 'bg-[#b4935d]/20 text-[#e0cfb3]' : 'bg-white/5 text-[#888]'
              }`}>
                {isAdmin ? '已解锁' : '只读锁定'}
              </span>
            </div>

            <p className="text-[11px] text-[#938c80] leading-relaxed">
              {isAdmin
                ? '您当前已登录管理员账号，享有新增/删除/编辑项目作品代表作、方案PDF、首页首屏视觉文案、关于我资料、工作经历履历、联系方式、获奖荣誉及技能库的全部权限。'
                : '验证管理员账号与密码后，可在线新增、删除或编辑项目代表作、方案PDF、首屏文案、个人简介、工作经历、联系方式、证书荣誉与技能卡片。'}
            </p>

            <div className="pt-1 flex items-center gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-orbitron font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>退出管理模式</span>
                  </button>
                  <button
                    onClick={handleAdminAction}
                    className="py-1.5 px-3 rounded-lg bg-[#191d28] hover:bg-[#252b3a] border border-[#303648] text-[#eee7db] text-xs font-orbitron font-medium transition-colors"
                  >
                    管理设置
                  </button>
                </>
              ) : (
                <button
                  id="menu-admin-login-btn"
                  onClick={handleAdminAction}
                  className="w-full py-2 px-3 rounded-lg bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] text-xs font-orbitron font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-[#b4935d]/20"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>管理员登录 / ADMIN LOGIN</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-orbitron text-[10px] tracking-[0.2em] text-[#a98d61]">CONNECT</p>
            <div className="flex flex-wrap gap-4 text-xs font-orbitron text-[#a8a195]">
              <a
                href="mailto:857422610@qq.com"
                className="flex items-center gap-1.5 hover:text-[#b4935d] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#b4935d]" />
                857422610@qq.com
              </a>
              <a
                href="tel:13112453953"
                className="flex items-center gap-1.5 hover:text-[#b4935d] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#b4935d]" />
                13112453953
              </a>
            </div>
            <p className="text-[10px] text-[#6d675e] mt-1">
              © 2026 MASON · 资深软装设计师作品集
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
