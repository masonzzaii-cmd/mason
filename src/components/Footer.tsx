import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#24231f] py-10 px-6 sm:px-12 bg-[#030405] text-[#77736c] text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#b4935d]/40 flex items-center justify-center text-[#b4935d]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <b className="block text-[#bda27a] font-orbitron tracking-widest text-xs">
              MIND EXPLORER
            </b>
            <small className="text-[9px] text-[#635f58]">探索 · 创造 · 无限</small>
          </div>
        </div>

        {/* Copyright */}
        <span className="font-orbitron text-[10px] tracking-wider text-[#77736c] text-center">
          © 2026 MASON · ALL RIGHTS RESERVED
        </span>

        {/* Back to top */}
        <button
          onClick={scrollToTop}
          className="inline-flex items-center gap-2 text-[10px] font-orbitron tracking-widest text-[#a89d8c] hover:text-[#b4935d] transition-colors p-2 rounded-lg hover:bg-white/5 cursor-pointer"
        >
          BACK TO TOP <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
