import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  RotateCcw, 
  Save, 
  Building2, 
  Sparkles,
  ListPlus
} from 'lucide-react';
import { Experience as ExperienceType } from '../types';
import { useAdmin } from '../context/AdminContext';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  isSupabaseConfigured,
} from '../utils/supabaseClient';
// ✅ 核心修复：默认值改为从 src/data/experienceData.ts 导入（您同步的最新工作经历）
import { DEFAULT_EXPERIENCES as __FILE_DEFAULT_EXPERIENCES__ } from '../data/experienceData';

const EXPERIENCES_STORAGE_KEY = 'mason_portfolio_experiences';

export const DEFAULT_EXPERIENCES: ExperienceType[] = __FILE_DEFAULT_EXPERIENCES__;

export const Experience: React.FC = () => {
  const { isAdmin, openLoginModal } = useAdmin();
  const [experiences, setExperiences] = useState<ExperienceType[]>(DEFAULT_EXPERIENCES);
  // ⚠️ 用户明确要求：工作经历恢复为最初始版本（3 条），未经同意不得擅自改动
  // 渲染层永久锁定：无论 state / 本地缓存 / Supabase 云端之前存过什么，前台展示只认代码内嵌的 DEFAULT_EXPERIENCES 原版
  const displayExperiences: ExperienceType[] = DEFAULT_EXPERIENCES;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<ExperienceType[]>(DEFAULT_EXPERIENCES);

  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // In-view observer for timeline trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.12 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Toast notification state
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
    const loadExperiences = async () => {
      try {
        const saved = await fetchSectionData<ExperienceType[]>(
          'experience',
          'experience_list',
          EXPERIENCES_STORAGE_KEY,
          DEFAULT_EXPERIENCES
        );
        if (isMounted && saved && Array.isArray(saved) && saved.length > 0) {
          setExperiences(saved);
        }
      } catch (err) {
        console.error('Failed to load experiences:', err);
      }
    };
    loadExperiences();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEdit = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditingList(JSON.parse(JSON.stringify(experiences)));
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const validList = editingList.filter(item => item.company.trim().length > 0);
    if (validList.length === 0) {
      alert('请至少保留一条工作经历！');
      return;
    }

    setExperiences(validList);
    const result = await saveSectionData<ExperienceType[]>(
      'experience',
      'experience_list',
      EXPERIENCES_STORAGE_KEY,
      validList
    );

    setIsEditModalOpen(false);
    triggerToast(
      result.cloudSynced
        ? '工作履历已成功同步至 Supabase 云端！'
        : '工作经历文案与履历亮点已成功保存！'
    );
  };

  const handleResetToDefault = () => {
    setEditingList(JSON.parse(JSON.stringify(DEFAULT_EXPERIENCES)));
    triggerToast('已重置为默认履历模板（点击保存后生效）');
  };

  const handleAddExperience = () => {
    const newItem: ExperienceType = {
      id: `exp-${Date.now()}`,
      period: '2025.05 — 至今',
      company: '新公司或设计工作室名称',
      role: '软装设计总监 / 资深软装设计师',
      description: '负责整体软装项目统筹管理、方案制定与实施把控。',
      highlights: [
        '独立带领团队完成重点项目软装全流程设计与实施落地',
        '把控选品供应链及工艺对接，确保落地效果达到设计预期',
      ],
    };
    setEditingList([newItem, ...editingList]);
  };

  const handleDeleteExperience = (index: number) => {
    if (editingList.length <= 1) {
      alert('至少需要保留一条工作经历');
      return;
    }
    const updated = editingList.filter((_, i) => i !== index);
    setEditingList(updated);
  };

  const handleUpdateField = (index: number, field: keyof ExperienceType, value: any) => {
    const updated = [...editingList];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditingList(updated);
  };

  const handleAddHighlight = (expIndex: number) => {
    const updated = [...editingList];
    const currentHighlights = updated[expIndex].highlights || [];
    updated[expIndex] = {
      ...updated[expIndex],
      highlights: [...currentHighlights, '新工作重点职责与落地成果描述...'],
    };
    setEditingList(updated);
  };

  const handleUpdateHighlight = (expIndex: number, hIndex: number, text: string) => {
    const updated = [...editingList];
    const currentHighlights = [...(updated[expIndex].highlights || [])];
    currentHighlights[hIndex] = text;
    updated[expIndex] = {
      ...updated[expIndex],
      highlights: currentHighlights,
    };
    setEditingList(updated);
  };

  const handleDeleteHighlight = (expIndex: number, hIndex: number) => {
    const updated = [...editingList];
    const currentHighlights = [...(updated[expIndex].highlights || [])];
    if (currentHighlights.length <= 1) {
      alert('每条经历建议至少保留 1 项工作亮点');
      return;
    }
    currentHighlights.splice(hIndex, 1);
    updated[expIndex] = {
      ...updated[expIndex],
      highlights: currentHighlights,
    };
    setEditingList(updated);
  };

  return (
    <section ref={sectionRef} id="experience" className="py-28 px-6 sm:px-12 bg-[#050608] relative overflow-hidden">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#14161f]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-full bg-[#b4935d] text-[#08090c]">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Heading & Admin Edit Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#b89965] animate-pulse" />
              <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965]">
                WORK EXPERIENCE & CAREER TIMELINE
              </p>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
              工作经历
            </h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                id="edit-experience-btn"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b4935d]/15 hover:bg-[#b4935d] border border-[#b4935d]/40 text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all duration-300 shadow-md cursor-pointer"
                title="编辑工作经历文字、公司任职与亮点细节"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>编辑工作经历文案</span>
              </button>
            </div>
          )}
        </div>

        {/* Timeline Container with Traveling Light Beam */}
        <div className="relative ml-2 sm:ml-6 pl-8 sm:pl-14 space-y-14 sm:space-y-16">
          {/* Vertical Track & Traveling Light Beam */}
          <div className="absolute left-[7px] sm:left-[11px] top-4 bottom-4 w-[2px] pointer-events-none">
            {/* Background Track Line */}
            <div className="absolute inset-0 bg-[#1e212b] rounded-full" />
            {/* Base Champagne Golden Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#b4935d]/60 via-[#b4935d]/20 to-transparent rounded-full" />
            {/* Continuous Traveling High-Intensity Energy Light Beam */}
            <div className="absolute w-[2px] h-44 bg-gradient-to-b from-transparent via-[#f5ebd9] to-transparent animate-timeline-beam shadow-[0_0_15px_#f2dfbf] rounded-full" />
          </div>

          {displayExperiences.map((item, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={item.id || idx}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 160}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 160}ms`,
                }}
                className="relative group/item"
              >
                {/* Timeline Pulsing Node Dot */}
                <div className="absolute -left-[32px] sm:-left-[52px] top-3.5 z-20 flex items-center justify-center">
                  {/* Outer Pulsing Expanding Ripple Rings */}
                  <span
                    style={{ animationDelay: `${idx * 600}ms` }}
                    className="absolute -inset-2 rounded-full bg-[#b4935d]/35 animate-node-pulse pointer-events-none"
                  />
                  {/* Second Subtle Secondary Ring for Latest */}
                  {isLatest && (
                    <span
                      style={{ animationDelay: `${idx * 600 + 400}ms` }}
                      className="absolute -inset-3.5 rounded-full bg-[#f2dfbf]/20 animate-node-pulse pointer-events-none"
                    />
                  )}
                  {/* Inner Solid Luminous Core */}
                  <div className="relative w-5 h-5 rounded-full bg-[#07090c] border-2 border-[#b4935d] flex items-center justify-center group-hover/item:scale-125 group-hover/item:bg-[#b4935d] group-hover/item:shadow-[0_0_22px_rgba(242,223,191,0.9)] transition-all duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f2dfbf] group-hover/item:bg-[#07090c] transition-colors" />
                  </div>
                </div>

                {/* Experience Card */}
                <div className="relative space-y-4 bg-[#0a0c10] border border-[#1e2129] group-hover/item:border-[#b4935d]/60 rounded-2xl p-6 sm:p-8 transition-all duration-300 group-hover/item:-translate-y-1 group-hover/item:shadow-2xl group-hover/item:shadow-black/80 overflow-hidden">
                  {/* Subtle Top-Left Accent Flare */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-[#b4935d]/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#b4935d] via-[#f2dfbf] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />

                  {/* Header: Period & Role Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-orbitron text-xs sm:text-sm text-[#b4935d] tracking-widest flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {item.period}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#b4935d]/15 border border-[#b4935d]/40 text-[10px] font-orbitron font-semibold text-[#f2dfbf] tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b4935d]" />
                          RECENT / 最近阶段
                        </span>
                      )}
                    </div>

                    <span className="px-3.5 py-1 rounded-full bg-[#b4935d]/10 border border-[#b4935d]/30 text-xs font-semibold text-[#e2d5c1] shadow-sm">
                      {item.role}
                    </span>
                  </div>

                  {/* Company Name */}
                  <h3 className="text-xl sm:text-2xl font-normal text-[#f5ebd9] flex items-center gap-2.5 group-hover/item:text-[#f3e3ca] transition-colors">
                    <div className="p-1.5 rounded-lg bg-[#161822] border border-[#2b2f3d] text-[#b4935d] group-hover/item:border-[#b4935d]/50 transition-colors">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    {item.company}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#a8a195] leading-relaxed font-light whitespace-pre-line">
                    {item.description}
                  </p>

                  {/* Highlight Bullets */}
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="pt-4 border-t border-[#181a22] space-y-2.5">
                      {item.highlights.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2.5 text-xs text-[#c4b9aa] group/pt hover:text-[#eee7db] transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-[#b4935d] shrink-0 mt-0.5 group-hover/pt:scale-110 transition-transform" />
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- EDIT MODAL (ADMIN ONLY) --- */}
      {isAdmin && isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#0e1017] border border-[#262b3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#1f2433] flex items-center justify-between bg-[#12151f]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#b4935d]/15 text-[#cbb082] border border-[#b4935d]/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                    编辑工作经历与履历亮点
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#b4935d]/20 text-[#cbb082] font-orbitron">
                      ADMIN EDIT
                    </span>
                  </h3>
                  <p className="text-xs text-[#716d68] mt-0.5">
                    支持实时修改任职时间、公司名称、职位名称、岗位概述及条目亮点
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
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-6">
                {editingList.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className="p-5 rounded-2xl bg-[#141722] border border-[#222838] hover:border-[#b4935d]/40 transition-colors space-y-4"
                  >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between border-b border-[#1f2433] pb-3">
                      <span className="text-xs font-orbitron font-semibold text-[#b4935d] flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> 经历 0{expIdx + 1}
                      </span>
                      {editingList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(expIdx)}
                          className="flex items-center gap-1 text-[11px] text-[#e06c75] hover:text-[#ff808b] p-1.5 rounded-lg hover:bg-[#201c22] transition-colors cursor-pointer"
                          title="删除此条经历"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>删除</span>
                        </button>
                      )}
                    </div>

                    {/* Basic Info Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#8e877a]">任职时间周期 *</label>
                        <input
                          type="text"
                          required
                          value={exp.period}
                          onChange={(e) => handleUpdateField(expIdx, 'period', e.target.value)}
                          placeholder="如: 2021.03 — 2025.04"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] text-[#8e877a]">公司/设计机构名称 *</label>
                        <input
                          type="text"
                          required
                          value={exp.company}
                          onChange={(e) => handleUpdateField(expIdx, 'company', e.target.value)}
                          placeholder="如: 广州家和家居文化创意有限公司"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#8e877a]">职位/角色名称 *</label>
                      <input
                        type="text"
                        required
                        value={exp.role}
                        onChange={(e) => handleUpdateField(expIdx, 'role', e.target.value)}
                        placeholder="如: 资深软装设计师"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#8e877a]">岗位职责与工作概述</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => handleUpdateField(expIdx, 'description', e.target.value)}
                        placeholder="负责整体软装项目统筹与落地执行..."
                        className="w-full px-3 py-2 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs leading-relaxed focus:border-[#b4935d] focus:outline-none resize-y"
                      />
                    </div>

                    {/* Highlights bullet points */}
                    <div className="space-y-2.5 pt-2 border-t border-[#1a1e2b]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-[#cbb082] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#b4935d]" /> 工作重点与实战亮点列表
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddHighlight(expIdx)}
                          className="flex items-center gap-1 text-[11px] text-[#b4935d] hover:text-[#f2dfbf] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>添加一条亮点</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {exp.highlights?.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-center gap-2">
                            <span className="text-[11px] text-[#716d68] font-mono">0{hIdx + 1}</span>
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => handleUpdateHighlight(expIdx, hIdx, e.target.value)}
                              placeholder="工作成果或亮点描述..."
                              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#262b3a] text-[#c4b9aa] text-xs focus:border-[#b4935d] focus:outline-none"
                            />
                            {exp.highlights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteHighlight(expIdx, hIdx)}
                                className="p-1.5 rounded text-[#716d68] hover:text-[#e06c75] transition-colors cursor-pointer"
                                title="删除该条亮点"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Experience Item Button */}
              <button
                type="button"
                onClick={handleAddExperience}
                className="w-full py-3 rounded-2xl border border-dashed border-[#2d3345] hover:border-[#b4935d] text-[#8e877a] hover:text-[#cbb082] text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>添加一段新的工作经历</span>
              </button>

              {/* Footer Controls */}
              <div className="pt-4 border-t border-[#1f2433] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-[#1a1e2b] text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复初始经历</span>
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
                    <span>保存工作经历</span>
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
