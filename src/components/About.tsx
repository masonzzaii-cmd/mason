import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  MapPin, 
  User, 
  Award, 
  ExternalLink, 
  Edit3, 
  X, 
  Check, 
  RotateCcw, 
  FileText, 
  Link as LinkIcon,
  Sparkles,
  Save
} from 'lucide-react';
import { LanyardCard } from './LanyardCard';
import { useAdmin } from '../context/AdminContext';
import { AboutData, AboutFact } from '../types';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import { fetchSectionData, saveSectionData, upsertSiteContent, isSupabaseConfigured } from '../utils/supabaseClient';
// ✅ 核心修复：默认值改为从 src/data/aboutData.ts 导入（您同步的最新内容）
import { DEFAULT_ABOUT_DATA as __FILE_DEFAULT_ABOUT_DATA__ } from '../data/aboutData';

const ABOUT_STORAGE_KEY = 'mason_portfolio_about_data';

export const DEFAULT_ABOUT_DATA: AboutData = __FILE_DEFAULT_ABOUT_DATA__;

const renderFactIcon = (iconName: string) => {
  switch (iconName) {
    case 'calendar':
      return <Calendar className="w-3.5 h-3.5 text-[#b4935d]" />;
    case 'mapPin':
      return <MapPin className="w-3.5 h-3.5 text-[#b4935d]" />;
    case 'compass':
      return <Compass className="w-3.5 h-3.5 text-[#b4935d]" />;
    case 'award':
      return <Award className="w-3.5 h-3.5 text-[#b4935d]" />;
    case 'user':
      return <User className="w-3.5 h-3.5 text-[#b4935d]" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-[#b4935d]" />;
  }
};

export const About: React.FC = () => {
  const { isAdmin, openLoginModal } = useAdmin();
  const [aboutData, setAboutData] = useState<AboutData>(DEFAULT_ABOUT_DATA);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<AboutData>(DEFAULT_ABOUT_DATA);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('个人介绍信息已成功保存！');

  // Load persistent data from Supabase & local storage
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await fetchSectionData<AboutData>(
          'about',
          'about_data',
          ABOUT_STORAGE_KEY,
          DEFAULT_ABOUT_DATA
        );
        if (isMounted && data && data.title) {
          setAboutData(data);
        }
      } catch (err) {
        console.error('Failed to load about data:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEdit = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditForm(JSON.parse(JSON.stringify(aboutData)));
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setAboutData(editForm);
    const result = await saveSectionData<AboutData>(
      'about',
      'about_data',
      ABOUT_STORAGE_KEY,
      editForm
    );

    // Also sync plain text to section: 'about', field_name: 'text'
    if (isSupabaseConfigured()) {
      await upsertSiteContent(
        'about',
        'text',
        `${editForm.title}\n${editForm.paragraph1}\n${editForm.paragraph2}`
      );
    }

    setIsEditModalOpen(false);
    
    setToastMessage(
      result.cloudSynced
        ? '“关于我”个人资料已成功保存并同步至 Supabase 云端数据库！'
        : '“关于我”个人资料已成功保存至本地！'
    );
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleResetToDefault = () => {
    setEditForm(JSON.parse(JSON.stringify(DEFAULT_ABOUT_DATA)));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleFactChange = (index: number, field: 'label' | 'value', val: string) => {
    const updatedFacts = [...editForm.facts];
    updatedFacts[index] = {
      ...updatedFacts[index],
      [field]: val,
    };
    setEditForm({ ...editForm, facts: updatedFacts });
  };

  return (
    <section id="about" className="relative py-28 px-6 sm:px-12 bg-radial from-[#9c763f]/10 via-transparent to-transparent border-t border-[#17191c]">
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#14161f]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-full bg-[#b4935d] text-[#08090c]">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Interactive Lanyard Card with Mason's Portrait */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start w-full">
          <LanyardCard />
        </div>

        {/* Right Section Copy */}
        <div className="lg:col-span-7 space-y-6 relative group/about">
          {/* Admin Edit Floating Action Button */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                id="edit-about-btn"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b4935d]/15 hover:bg-[#b4935d] border border-[#b4935d]/40 text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all duration-300 shadow-md cursor-pointer"
                title="编辑关于我板块文字与简介"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>编辑文案资料</span>
              </button>
            </div>
          )}

          <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965]">
            {aboutData.subtitle}
          </p>

          <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
            {aboutData.title}
          </h2>

          <div className="w-20 h-[1px] bg-[#b79560]" />

          <div className="space-y-4 text-sm sm:text-base text-[#a9a29a] leading-relaxed font-light whitespace-pre-line">
            <p>{aboutData.paragraph1}</p>
            {aboutData.paragraph2 && <p>{aboutData.paragraph2}</p>}
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-[#2c2a26]/80 my-8">
            {aboutData.facts.map((fact) => (
              <div key={fact.id} className="space-y-1">
                <span className="flex items-center gap-1.5 text-xs text-[#716d68]">
                  {renderFactIcon(fact.icon)} {fact.label}
                </span>
                <b className="block text-sm text-[#e4d7c2] font-semibold">{fact.value}</b>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              id="download-resume-btn"
              href={aboutData.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#a78654] text-[#f2dfbf] hover:bg-[#a78654] hover:text-[#050608] text-xs font-orbitron tracking-wider transition-all duration-300 rounded-sm cursor-pointer"
            >
              {aboutData.resumeText} <ExternalLink className="w-4 h-4" />
            </a>

            {isAdmin && (
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-sm border border-[#3a342b] text-[#938c80] hover:text-[#cbb082] hover:border-[#b4935d]/40 text-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>修改简介与事实数据</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit About Modal (Admin Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e1017] border border-[#262b3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#1f2433] flex items-center justify-between bg-[#12151f]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#b4935d]/15 text-[#cbb082] border border-[#b4935d]/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                    编辑“关于我”文字与个人资料
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#b4935d]/20 text-[#cbb082] font-orbitron">
                      ADMIN EDIT
                    </span>
                  </h3>
                  <p className="text-xs text-[#716d68] mt-0.5">
                    实时修改自我介绍文案、工作年限、出生日期、职业标签及简历链接
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

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Titles Section */}
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
                    placeholder="如: ABOUT ME"
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
                    placeholder="如: 关于我"
                  />
                </div>
              </div>

              {/* Bio Paragraphs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    自我介绍 · 第一段文案 (核心经验与项目类型)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.paragraph1}
                    onChange={(e) => setEditForm({ ...editForm, paragraph1: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs leading-relaxed focus:border-[#b4935d] focus:outline-none transition-colors resize-y"
                    placeholder="请输入第一段介绍文案..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#cbb082]">
                    自我介绍 · 第二段文案 (工作态度与思维方式)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.paragraph2}
                    onChange={(e) => setEditForm({ ...editForm, paragraph2: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs leading-relaxed focus:border-[#b4935d] focus:outline-none transition-colors resize-y"
                    placeholder="请输入第二段介绍文案..."
                  />
                </div>
              </div>

              {/* 4 Key Facts */}
              <div className="space-y-3 pt-2 border-t border-[#1f2433]">
                <label className="block text-xs font-medium text-[#cbb082]">
                  4 栏核心履历标签与数值 (Key Facts)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {editForm.facts.map((fact, index) => (
                    <div key={fact.id} className="p-3 rounded-xl bg-[#141722] border border-[#222838] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#8e877a]">
                        <span className="flex items-center gap-1.5">
                          {renderFactIcon(fact.icon)} 栏目 {index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={fact.label}
                          onChange={(e) => handleFactChange(index, 'label', e.target.value)}
                          placeholder="标签名 (如: 出生日期)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                        />
                        <input
                          type="text"
                          required
                          value={fact.value}
                          onChange={(e) => handleFactChange(index, 'value', e.target.value)}
                          placeholder="数值 (如: 1994/08/12)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#e4d7c2] font-semibold text-xs focus:border-[#b4935d] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume Button & URL */}
              <div className="space-y-3 pt-2 border-t border-[#1f2433]">
                <label className="block text-xs font-medium text-[#cbb082] flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> 简历按钮与 PDF 在线文件链接
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1 space-y-1">
                    <span className="text-[11px] text-[#716d68]">按钮文案</span>
                    <input
                      type="text"
                      required
                      value={editForm.resumeText}
                      onChange={(e) => setEditForm({ ...editForm, resumeText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      placeholder="下载简历"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[11px] text-[#716d68]">在线 PDF 链接 (URL)</span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        value={editForm.resumeUrl}
                        onChange={(e) => setEditForm({ ...editForm, resumeUrl: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#141722] border border-[#242a3a] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none font-mono"
                        placeholder="https://maipdf.cn/file/xxx/pdf"
                      />
                      {editForm.resumeUrl && (
                        <a
                          href={editForm.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-[#1f2433] hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs flex items-center gap-1 transition-colors"
                          title="测试在新标签页中打开此链接"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>测试</span>
                        </a>
                      )}
                    </div>
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
                  <span>恢复初始文案</span>
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
                    <span>保存并更新</span>
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
