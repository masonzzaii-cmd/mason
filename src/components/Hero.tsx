import React, { useState, useEffect } from 'react';
import { HeroVideo } from './HeroVideo';
import { 
  ArrowDownRight, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  X, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles,
  LayoutTemplate,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAdmin } from '../context/AdminContext';
import { HeroData } from '../types';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

const HERO_STORAGE_KEY = 'mason_portfolio_hero_data';

export const DEFAULT_HERO_DATA: HeroData = {
  greeting: "HELLO, I'M",
  name: 'MASON',
  slogan: 'WELCOME TO MY WORLD',
  primaryBtnText: '探索我的世界',
  primaryBtnLink: '#about',
  secondaryBtnText: '与我交流',
  secondaryBtnLink: '#contact',
  email: '857422610@qq.com',
  phone: '13112453953',
};

export const Hero: React.FC = () => {
  const { isAdmin, openLoginModal } = useAdmin();
  const [heroData, setHeroData] = useState<HeroData>(DEFAULT_HERO_DATA);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<HeroData>(DEFAULT_HERO_DATA);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Load persistent data from Supabase and local cache
  useEffect(() => {
    let isMounted = true;
    const loadHeroData = async () => {
      try {
        const saved = await fetchSectionData<HeroData>(
          'hero',
          'hero_content',
          HERO_STORAGE_KEY,
          DEFAULT_HERO_DATA
        );
        if (isMounted && saved && saved.name) {
          setHeroData(saved);
        }
      } catch (err) {
        console.error('Failed to load hero data:', err);
      }
    };
    loadHeroData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEdit = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditForm(JSON.parse(JSON.stringify(heroData)));
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setHeroData(editForm);
    const result = await saveSectionData<HeroData>(
      'hero',
      'hero_content',
      HERO_STORAGE_KEY,
      editForm
    );

    // Also sync fields to site_content
    if (isSupabaseConfigured()) {
      try {
        await upsertSiteContent('hero', 'greeting', editForm.greeting);
        await upsertSiteContent('hero', 'name', editForm.name);
        await upsertSiteContent('hero', 'slogan', editForm.slogan);
        await upsertSiteContent('hero', 'primaryBtnText', editForm.primaryBtnText);
        await upsertSiteContent('hero', 'primaryBtnLink', editForm.primaryBtnLink);
        await upsertSiteContent('hero', 'secondaryBtnText', editForm.secondaryBtnText);
        await upsertSiteContent('hero', 'secondaryBtnLink', editForm.secondaryBtnLink);
      } catch (e) {}
    }

    setIsEditModalOpen(false);
    triggerToast(
      result.cloudSynced
        ? '首屏文案已成功同步至 Supabase 云端！'
        : '首屏欢迎界面文案与按钮已成功保存！'
    );
  };

  const handleResetToDefault = () => {
    setEditForm(JSON.parse(JSON.stringify(DEFAULT_HERO_DATA)));
    triggerToast('已重置为默认文案（点击保存后生效）');
  };

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-4 sm:px-8">
      {/* Background Video Stream */}
      <HeroVideo />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#14161f]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-full bg-[#b4935d] text-[#08090c]">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Admin Floating Edit Trigger at top of Hero */}
      {isAdmin && (
        <div className="absolute top-28 right-6 sm:right-12 z-30 animate-in fade-in duration-300">
          <button
            id="edit-hero-btn"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12151f]/80 hover:bg-[#b4935d] border border-[#b4935d]/50 text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all duration-300 shadow-xl backdrop-blur-md cursor-pointer"
            title="编辑首页欢迎界面主副标与按钮文案"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>编辑首页首屏文案</span>
          </button>
        </div>
      )}

      {/* Hero Central Content Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center"
      >
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-orbitron tracking-[0.35em] text-[#b89965] mb-4 font-semibold text-[28px] sm:text-[38px] md:text-[46px] leading-[40px] sm:leading-[52px] md:leading-[62px]"
        >
          {heroData.greeting}
        </motion.p>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-widest text-[#eee7db] drop-shadow-2xl my-3"
        >
          {heroData.name}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl sm:text-2xl md:text-3xl text-[#f2dfbf] font-orbitron font-light max-w-2xl mx-auto leading-relaxed mb-8 tracking-[0.25em] uppercase"
        >
          {heroData.slogan}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={heroData.primaryBtnLink || '#about'}
            className="inline-flex items-center gap-3 px-8 py-3.5 border border-[#b4935d] bg-[#080808]/60 hover:bg-[#b4935d] text-[#f2dfbf] hover:text-[#080808] text-xs font-orbitron tracking-widest transition-all duration-300 shadow-lg shadow-[#b4935d]/10 rounded-full group"
          >
            {heroData.primaryBtnText}
            <ArrowDownRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
          </a>

          <a
            href={heroData.secondaryBtnLink || '#contact'}
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#2a2824] hover:border-[#b4935d]/50 text-[#c8bda9] hover:text-[#eee7db] text-xs font-orbitron tracking-wider transition-all rounded-full hover:bg-white/5"
          >
            {heroData.secondaryBtnText}
          </a>

          {isAdmin && (
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-4 py-3 border border-[#b4935d]/30 text-[#b4935d] hover:bg-[#b4935d]/15 text-xs font-orbitron rounded-full transition-all cursor-pointer"
              title="快速编辑首页文字"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>快速编辑</span>
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* Portal Glow Light Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-radial from-[#b4935d]/15 via-transparent to-transparent filter blur-3xl animate-portal-pulse pointer-events-none z-10" />

      {/* Left Social Rail */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-6 font-orbitron text-xs text-[#a99b88] z-20"
      >
        <a
          href={`mailto:${heroData.email}`}
          className="hover:text-[#d6b47b] transition-colors p-2 rounded-full hover:bg-white/5"
          title={`发送邮件: ${heroData.email}`}
        >
          <Mail className="w-4 h-4" />
        </a>
        <a
          href={`tel:${heroData.phone}`}
          className="hover:text-[#d6b47b] transition-colors p-2 rounded-full hover:bg-white/5"
          title={`电话联系: ${heroData.phone}`}
        >
          <Phone className="w-4 h-4" />
        </a>
        <a
          href="#contact"
          className="hover:text-[#d6b47b] transition-colors p-2 rounded-full hover:bg-white/5"
          title="前往联系我"
        >
          <MapPin className="w-4 h-4" />
        </a>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-8 left-8 sm:left-12 flex items-center gap-3 font-orbitron text-[10px] tracking-[0.3em] text-[#9c958a] z-20"
      >
        <span className="w-0.5 h-8 bg-[#b4935d] animate-bounce" />
        <span>SCROLL DOWN</span>
      </motion.div>

      {/* --- EDIT HERO MODAL (ADMIN ONLY) --- */}
      {isAdmin && isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-md animate-in fade-in duration-200 text-left">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e1017] border border-[#262b3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#1f2433] flex items-center justify-between bg-[#12151f]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#b4935d]/15 text-[#cbb082] border border-[#b4935d]/30">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                    编辑首页首屏 (Hero) 视觉文案与按钮
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#b4935d]/20 text-[#cbb082] font-orbitron">
                      ADMIN EDIT
                    </span>
                  </h3>
                  <p className="text-xs text-[#716d68] mt-0.5">
                    实时修改首屏问候语、设计师英文名、主标标语、行动按钮与快捷联系方式
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-2 rounded-xl text-[#716d68] hover:text-[#eee7db] hover:bg-[#1c2230] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Top Greeting & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    顶部问候语 (Top Greeting)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.greeting}
                    onChange={(e) => setEditForm({ ...editForm, greeting: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none transition-colors"
                    placeholder="如: HELLO, I'M"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    设计师大标题名称 (Name / Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs font-orbitron tracking-wider focus:border-[#b4935d] focus:outline-none transition-colors"
                    placeholder="如: MASON"
                  />
                </div>
              </div>

              {/* Slogan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#cbb082]">
                  副标标语 / 口号 (Slogan / Subtitle)
                </label>
                <input
                  type="text"
                  required
                  value={editForm.slogan}
                  onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs font-orbitron tracking-wide focus:border-[#b4935d] focus:outline-none transition-colors"
                  placeholder="如: WELCOME TO MY WORLD"
                />
              </div>

              {/* Action Buttons Settings */}
              <div className="space-y-3 pt-2 border-t border-[#1f2433]">
                <label className="block text-xs font-medium text-[#cbb082]">
                  行动按钮文案与锚点目标 (CTA Buttons)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Button */}
                  <div className="p-3.5 rounded-xl bg-[#141722] border border-[#222838] space-y-2">
                    <span className="text-[11px] font-semibold text-[#b4935d] flex items-center gap-1.5">
                      主按钮 (主要行动)
                    </span>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        value={editForm.primaryBtnText}
                        onChange={(e) => setEditForm({ ...editForm, primaryBtnText: e.target.value })}
                        placeholder="按钮文字 (如: 探索我的世界)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={editForm.primaryBtnLink}
                        onChange={(e) => setEditForm({ ...editForm, primaryBtnLink: e.target.value })}
                        placeholder="跳转锚点 (如: #about)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#a9a29a] font-mono text-xs focus:border-[#b4935d] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <div className="p-3.5 rounded-xl bg-[#141722] border border-[#222838] space-y-2">
                    <span className="text-[11px] font-semibold text-[#9e978b] flex items-center gap-1.5">
                      副按钮 (次要行动)
                    </span>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        value={editForm.secondaryBtnText}
                        onChange={(e) => setEditForm({ ...editForm, secondaryBtnText: e.target.value })}
                        placeholder="按钮文字 (如: 与我交流)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={editForm.secondaryBtnLink}
                        onChange={(e) => setEditForm({ ...editForm, secondaryBtnLink: e.target.value })}
                        placeholder="跳转锚点 (如: #contact)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#a9a29a] font-mono text-xs focus:border-[#b4935d] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Rail Contacts */}
              <div className="space-y-3 pt-2 border-t border-[#1f2433]">
                <label className="block text-xs font-medium text-[#cbb082]">
                  左侧快捷悬浮联系信息
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#b4935d]" /> 快捷邮箱
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      placeholder="857422610@qq.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#b4935d]" /> 快捷电话
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      placeholder="13112453953"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="pt-4 border-t border-[#1f2433] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-[#1a1e2b] text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复初始首屏文案</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="px-4 py-2 rounded-xl bg-[#171b26] hover:bg-[#202534] text-[#a9a29a] text-xs transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] font-medium text-xs transition-colors shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存首屏文案</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
