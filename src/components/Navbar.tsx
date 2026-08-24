import React from 'react';
import { Menu, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface NavbarProps {
  onOpenMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMenu }) => {
  const { isAdmin, openLoginModal } = useAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-20 px-6 sm:px-12 flex items-center justify-between bg-gradient-to-b from-[#030406]/90 via-[#030406]/50 to-transparent backdrop-blur-md transition-all">
      {/* Brand logo */}
      <a href="#hero" className="flex items-center gap-3 group">
        <div className="w-9 h-9 border border-[#c6a36a] rounded-full flex items-center justify-center text-[#c6a36a] group-hover:bg-[#c6a36a] group-hover:text-[#050608] transition-all">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-orbitron font-bold text-xs tracking-[0.15em] text-[#eee7db]">
            MIND EXPLORER
          </span>
          <span className="text-[9px] text-[#9c9387] tracking-wider">
            探索 · 创造 · 无限
          </span>
        </div>
      </a>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-orbitron text-[#c8c0b5]">
        <a href="#about" className="hover:text-[#d6b47b] transition-colors">
          关于我
        </a>
        <a href="#skills" className="hover:text-[#d6b47b] transition-colors">
          技能
        </a>
        <a href="#experience" className="hover:text-[#d6b47b] transition-colors">
          经历
        </a>
        <a href="#honors" className="hover:text-[#d6b47b] transition-colors">
          荣誉
        </a>
        <a href="#projects" className="hover:text-[#d6b47b] transition-colors">
          项目
        </a>
        <a href="#brands" className="hover:text-[#d6b47b] transition-colors">
          合作品牌
        </a>
        <a href="#contact" className="hover:text-[#d6b47b] transition-colors">
          联系我
        </a>
      </nav>

      {/* Right controls: Admin button + Menu Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Admin Permission Button */}
        <button
          id="navbar-admin-btn"
          onClick={openLoginModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-orbitron transition-all border ${
            isAdmin
              ? 'bg-[#b4935d]/15 border-[#b4935d]/50 text-[#d8c39e] hover:bg-[#b4935d]/25'
              : 'bg-white/5 border-white/10 text-[#a8a195] hover:text-[#eee7db] hover:bg-white/10'
          }`}
          title={isAdmin ? '管理员已登录 (点击管理)' : '管理员登录 (解锁编辑权限)'}
        >
          {isAdmin ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#b4935d]" />
              <span className="hidden sm:inline">管理模式</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-[#8e877a]" />
              <span className="hidden sm:inline">管理员</span>
            </>
          )}
        </button>

        {/* Menu Toggle button */}
        <button
          id="navbar-menu-toggle-btn"
          onClick={onOpenMenu}
          className="flex items-center gap-2 text-xs font-orbitron tracking-widest text-[#eee7db] hover:text-[#b4935d] p-2 rounded-lg hover:bg-white/5 transition-all"
          aria-label="打开导航菜单"
        >
          <span className="hidden sm:inline text-[11px]">MENU</span>
          <Menu className="w-5 h-5 text-[#b4935d]" />
        </button>
      </div>
    </header>
  );
};
