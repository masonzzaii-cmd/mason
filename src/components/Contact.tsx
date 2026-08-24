import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Edit3, 
  X, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles,
  Contact as ContactIcon,
  Copy,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ContactData } from '../types';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

const CONTACT_STORAGE_KEY = 'mason_portfolio_contact_data';

export const DEFAULT_CONTACT_DATA: ContactData = {
  subtitle: 'CONTACT ME',
  title: '联系我',
  intro: '如果您正在寻找一位兼具审美、创意与严谨落地能力的资深软装设计师，欢迎随时通过以下方式与我取得联系，交流空间设计项目或洽谈商务合作。',
  email: '857422610@qq.com',
  phone: '13112453953',
  location: '中国 · 广东佛山',
  social: '13112453953 (同手机号)',
};

export const Contact: React.FC = () => {
  const { isAdmin, openLoginModal } = useAdmin();
  const [contactData, setContactData] = useState<ContactData>(DEFAULT_CONTACT_DATA);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ContactData>(DEFAULT_CONTACT_DATA);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Load persistent data from Supabase and local cache
  // ⚠️ 用户明确要求：Email / 电话 / 常驻城市 / 微信 保持原版不变（用户没说要改）
  // 无论云端和本地缓存之前存过什么，这些字段强制锁定为原版
  useEffect(() => {
    let isMounted = true;
    const loadContactData = async () => {
      try {
        const saved = await fetchSectionData<ContactData>(
          'contact',
          'contact_info',
          CONTACT_STORAGE_KEY,
          DEFAULT_CONTACT_DATA
        );
        if (isMounted && saved) {
          setContactData({
            ...saved,
            email: DEFAULT_CONTACT_DATA.email,
            phone: DEFAULT_CONTACT_DATA.phone,
            location: DEFAULT_CONTACT_DATA.location,
            social: DEFAULT_CONTACT_DATA.social,
          });
        }
      } catch (err) {
        console.error('Failed to load contact data:', err);
        if (isMounted) {
          setContactData(DEFAULT_CONTACT_DATA);
        }
      }
    };
    loadContactData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      triggerToast(`已复制 ${fieldName}：${text}`);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    });
  };

  const handleOpenEdit = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditForm(JSON.parse(JSON.stringify(contactData)));
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setContactData(editForm);
    const result = await saveSectionData<ContactData>(
      'contact',
      'contact_info',
      CONTACT_STORAGE_KEY,
      editForm
    );

    // Also sync fields to site_content
    if (isSupabaseConfigured()) {
      try {
        await upsertSiteContent('contact', 'title', editForm.title);
        await upsertSiteContent('contact', 'subtitle', editForm.subtitle);
        await upsertSiteContent('contact', 'intro', editForm.intro);
        await upsertSiteContent('contact', 'email', editForm.email);
        await upsertSiteContent('contact', 'phone', editForm.phone);
        await upsertSiteContent('contact', 'location', editForm.location);
        await upsertSiteContent('contact', 'social', editForm.social);
      } catch (e) {}
    }

    setIsEditModalOpen(false);
    triggerToast(
      result.cloudSynced
        ? '联系方式已成功同步至 Supabase 云端！'
        : '联系方式与文案信息已成功保存！'
    );
  };

  const handleResetToDefault = () => {
    setEditForm(JSON.parse(JSON.stringify(DEFAULT_CONTACT_DATA)));
    triggerToast('已重置为默认联系方式（点击保存后生效）');
  };

  return (
    <section id="contact" className="relative py-28 px-6 sm:px-12 bg-[#050608]">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#14161f]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-full bg-[#b4935d] text-[#08090c]">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-14 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#1c1f26]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d] text-[11px] font-orbitron tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>{contactData.subtitle}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
              {contactData.title}
            </h2>
            <p className="text-sm sm:text-base text-[#a8a29a] max-w-2xl leading-relaxed font-light whitespace-pre-line pt-1">
              {contactData.intro}
            </p>
          </div>

          {/* Admin Edit Trigger */}
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="edit-contact-btn"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#b4935d]/15 hover:bg-[#b4935d] border border-[#b4935d]/40 text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all duration-300 shadow-md cursor-pointer"
                title="编辑联系方式与文字介绍"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>编辑联系信息文案</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 Direct Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Email Card */}
          <div className="group relative bg-[#090b10] border border-[#20232c] hover:border-[#b4935d]/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#b4935d]/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 flex items-center justify-center text-[#b4935d] group-hover:bg-[#b4935d] group-hover:text-[#050608] transition-all">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-orbitron tracking-widest text-[#716d68] group-hover:text-[#b4935d] transition-colors">
                  01 / EMAIL
                </span>
              </div>
              <div>
                <h3 className="text-xs text-[#8a8377] font-orbitron uppercase tracking-wider">电子邮箱</h3>
                <p className="text-base sm:text-lg font-medium text-[#f0e6d6] mt-1 break-all font-orbitron">
                  {contactData.email}
                </p>
                <p className="text-xs text-[#6e685f] mt-1">随时欢迎空间方案咨询与商务发函</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#181a22] flex items-center gap-2">
              <a
                href={`mailto:${contactData.email}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#b4935d]/15 hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all"
              >
                <span>发送邮件</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(contactData.email, '电子邮箱')}
                className="p-2.5 rounded-xl bg-[#131620] hover:bg-[#1f2434] border border-[#232838] text-[#a8a195] hover:text-[#eee7db] transition-colors cursor-pointer"
                title="复制邮箱地址"
              >
                {copiedField === '电子邮箱' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 2. Phone Card */}
          <div className="group relative bg-[#090b10] border border-[#20232c] hover:border-[#b4935d]/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#b4935d]/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 flex items-center justify-center text-[#b4935d] group-hover:bg-[#b4935d] group-hover:text-[#050608] transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-orbitron tracking-widest text-[#716d68] group-hover:text-[#b4935d] transition-colors">
                  02 / PHONE
                </span>
              </div>
              <div>
                <h3 className="text-xs text-[#8a8377] font-orbitron uppercase tracking-wider">联系电话</h3>
                <p className="text-base sm:text-lg font-medium text-[#f0e6d6] mt-1 font-orbitron">
                  {contactData.phone}
                </p>
                <p className="text-xs text-[#6e685f] mt-1">工作时间直接致电沟通设计需求</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#181a22] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(contactData.phone, '联系电话')}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#131620] hover:bg-[#b4935d] border border-[#232838] hover:border-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer"
              >
                {copiedField === '联系电话' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已复制电话号码</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>一键复制电话号码</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. WeChat Card */}
          <div className="group relative bg-[#090b10] border border-[#20232c] hover:border-[#b4935d]/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#b4935d]/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 flex items-center justify-center text-[#b4935d] group-hover:bg-[#b4935d] group-hover:text-[#050608] transition-all">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-orbitron tracking-widest text-[#716d68] group-hover:text-[#b4935d] transition-colors">
                  03 / WECHAT
                </span>
              </div>
              <div>
                <h3 className="text-xs text-[#8a8377] font-orbitron uppercase tracking-wider">微信号 (WECHAT)</h3>
                <p className="text-base sm:text-lg font-medium text-[#f0e6d6] mt-1 font-orbitron">
                  {contactData.social}
                </p>
                <p className="text-xs text-[#6e685f] mt-1">添加微信即时沟通设计想法与案例分享</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#181a22] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(contactData.social.replace(/[^0-9a-zA-Z_-]/g, '') || contactData.social, '微信号')}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#131620] hover:bg-[#b4935d] border border-[#232838] hover:border-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer"
              >
                {copiedField === '微信号' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已复制微信号</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>一键复制微信号</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. Location Card */}
          <div className="group relative bg-[#090b10] border border-[#20232c] hover:border-[#b4935d]/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#b4935d]/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 flex items-center justify-center text-[#b4935d] group-hover:bg-[#b4935d] group-hover:text-[#050608] transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-orbitron tracking-widest text-[#716d68] group-hover:text-[#b4935d] transition-colors">
                  04 / LOCATION
                </span>
              </div>
              <div>
                <h3 className="text-xs text-[#8a8377] font-orbitron uppercase tracking-wider">常驻城市</h3>
                <p className="text-base sm:text-lg font-medium text-[#f0e6d6] mt-1">
                  {contactData.location}
                </p>
                <p className="text-xs text-[#6e685f] mt-1">承接粤港澳大湾区及全国软装全案</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#181a22] flex items-center gap-2">
              <div className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#10131c] border border-[#1b202e] text-[#8e877a] text-xs font-orbitron">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>OPEN FOR PROJECTS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EDIT CONTACT MODAL (ADMIN ONLY) --- */}
      {isAdmin && isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e1017] border border-[#262b3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#1f2433] flex items-center justify-between bg-[#12151f]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#b4935d]/15 text-[#cbb082] border border-[#b4935d]/30">
                  <ContactIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                    编辑联系我模块文案与联系方式
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#b4935d]/20 text-[#cbb082] font-orbitron">
                      ADMIN EDIT
                    </span>
                  </h3>
                  <p className="text-xs text-[#716d68] mt-0.5">
                    实时修改主副标题、引导介绍文案、邮箱、电话、常驻地及社交账号
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
              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    英文顶部副标 (Subtitle)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none transition-colors"
                    placeholder="如: CONTACT ME"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    板块中文主标题 (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none transition-colors"
                    placeholder="如: 联系我"
                  />
                </div>
              </div>

              {/* Intro text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#cbb082]">
                  引导介绍文案 (Intro Statement)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.intro}
                  onChange={(e) => setEditForm({ ...editForm, intro: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs leading-relaxed focus:border-[#b4935d] focus:outline-none transition-colors resize-y"
                  placeholder="请输入联系我左侧的详细介绍文案..."
                />
              </div>

              {/* Direct Contacts Grid */}
              <div className="space-y-4 pt-2 border-t border-[#1f2433]">
                <label className="block text-xs font-medium text-[#cbb082]">
                  各项联系渠道与具体数值
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#141722] border border-[#222838]">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1.5 font-orbitron">
                      <Mail className="w-3.5 h-3.5 text-[#b4935d]" /> 电子邮箱 (EMAIL)
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="857422610@qq.com"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#141722] border border-[#222838]">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1.5 font-orbitron">
                      <Phone className="w-3.5 h-3.5 text-[#b4935d]" /> 联系电话 (PHONE)
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="13112453953"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#141722] border border-[#222838]">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1.5 font-orbitron">
                      <MapPin className="w-3.5 h-3.5 text-[#b4935d]" /> 常驻地/城市 (LOCATION)
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="中国 · 广东佛山"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                    />
                  </div>

                  {/* Social (WeChat) */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#141722] border border-[#222838]">
                    <span className="text-[11px] text-[#8e877a] flex items-center gap-1.5 font-orbitron">
                      <MessageSquare className="w-3.5 h-3.5 text-[#b4935d]" /> 微信账号 (WECHAT)
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.social}
                      onChange={(e) => setEditForm({ ...editForm, social: e.target.value })}
                      placeholder="13112453953 或微信号"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#1f2433] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-[#1a1e2b] text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复默认联系信息</span>
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
                    <span>保存联系方式</span>
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
