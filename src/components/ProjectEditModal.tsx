import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Upload,
  Link2,
  Trash2,
  Plus,
  FileText,
  Image as ImageIcon,
  Calendar,
  Building,
  MapPin,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Project } from '../types';
import { useAdmin } from '../context/AdminContext';
import { uploadAssetToStorage, isSupabaseConfigured } from '../utils/supabaseClient';

interface ProjectEditModalProps {
  project: Project | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
  onDelete?: (projectId: string) => void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  project,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const { isAdmin } = useAdmin();
  if (!project || !isAdmin) return null;

  const [form, setForm] = useState<Project>({ ...project });

  // ========================================================================
  // 📅 年月选择器 (自动按最新年份排序的关键：保证 year 字段格式统一为 YYYY.MM)
  //   - ymYear / ymMonth 是 select 下拉中的"年/月"选项值
  //   - ymCustomMode: 当原有数据无法解析（如只写 2023 或格式特殊）时，切回原自由文本框
  // ========================================================================
  const YEAR_OPTIONS = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const start = Math.min(2015, thisYear - 10);
    const end = thisYear + 3;
    const arr: number[] = [];
    for (let y = end; y >= start; y--) arr.push(y);
    return arr;
  }, []);

  const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12

  const parseYearMonth = (
    yearStr?: string
  ): { year: number | null; month: number | null; custom: boolean } => {
    if (!yearStr || typeof yearStr !== 'string') {
      return { year: null, month: null, custom: false };
    }
    const trimmed = yearStr.trim();
    if (!trimmed) return { year: null, month: null, custom: false };

    // 匹配：YYYY.MM / YYYY-MM / YYYY/MM / YYYY年MM月 / 或仅 YYYY
    const strict = trimmed.match(
      /^(\d{4})(?:[.\-\/年]\s*(\d{1,2})(?:[.\-\/月]\s*\d{1,2}\s*日?)?)?$/
    );
    if (strict) {
      const y = parseInt(strict[1], 10);
      const m = strict[2] ? parseInt(strict[2], 10) : null;
      if (y >= 1900 && y <= 2100 && (!m || (m >= 1 && m <= 12))) {
        return { year: y, month: m, custom: false };
      }
    }
    // 范围格式："2023.08 - 2024.05" 用末端的年月
    const rangeMatch = [...trimmed.matchAll(/(\d{4})(?:[.\-\/年](\d{1,2}))?/g)];
    if (rangeMatch.length > 0) {
      const last = rangeMatch[rangeMatch.length - 1];
      const y = parseInt(last[1], 10);
      const m = last[2] ? parseInt(last[2], 10) : null;
      if (y >= 1900 && y <= 2100 && (!m || (m >= 1 && m <= 12))) {
        return { year: y, month: m, custom: false };
      }
    }
    // 无法解析：保留原字符串，交给用户手改
    return { year: null, month: null, custom: true };
  };

  const initialYm = useMemo(() => parseYearMonth(project.year), [project.year]);
  const [ymYear, setYmYear] = useState<number | ''>(initialYm.year ?? '');
  const [ymMonth, setYmMonth] = useState<number | ''>(initialYm.month ?? '');
  const [ymCustomMode, setYmCustomMode] = useState<boolean>(initialYm.custom || false);

  // 当 project 变化（比如从 A 切到 B 编辑）时重新回填
  useEffect(() => {
    const ym = parseYearMonth(project?.year);
    setYmYear(ym.year ?? '');
    setYmMonth(ym.month ?? '');
    setYmCustomMode(ym.custom || false);
  }, [project?.id]);

  // 当年月选择变化时，自动把 form.year 合并成 "YYYY.MM"（标准格式 → 排序正确）
  useEffect(() => {
    if (ymCustomMode) return; // 自定义模式下，不自动覆盖
    if (ymYear === '' && ymMonth === '') return;

    setForm((prev) => {
      const y = typeof ymYear === 'number' ? ymYear : null;
      const m = typeof ymMonth === 'number' ? ymMonth : null;
      let nextYearStr = prev.year;
      if (y && m) {
        nextYearStr = `${y}.${String(m).padStart(2, '0')}`;
      } else if (y && !m) {
        // 只有年份没有月份：默认 12 月（排序时放在该年份最末尾）
        nextYearStr = `${y}.12`;
      } else if (y) {
        nextYearStr = String(y);
      }
      if (nextYearStr === prev.year) return prev;
      return { ...prev, year: nextYearStr };
    });
    // 依赖只需要下拉值变化，不需要 form.year（避免循环）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymYear, ymMonth, ymCustomMode]);
  const [coverTab, setCoverTab] = useState<'upload' | 'url'>('upload');
  const [pdfTab, setPdfTab] = useState<'url' | 'upload'>('url');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Compress and handle image file
  const compressImage = (file: File, maxDim = 1400, quality = 0.88): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  // Handle Cover Upload
  // 容错策略：Supabase 上传成功 → 用云端 CDN URL；任何失败（桶不存在/RLS/网络/CSP沙盒）→ 自动降级压缩成本地 DataURL；最后才报错
  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    setIsProcessing(true);
    let lastError: any = null;
    try {
      // 1. 先尝试上传到 Supabase 云端 (带独立 try/catch，失败不影响降级)
      if (isSupabaseConfigured()) {
        try {
          const publicUrl = await uploadAssetToStorage(file, `proj_cover_${form.id || Date.now()}`);
          if (publicUrl) {
            setForm((prev) => ({ ...prev, imageUrl: publicUrl }));
            return;
          }
        } catch (supErr) {
          lastError = supErr;
          console.warn('[Cover] Supabase 上传失败，自动降级为本地压缩图:', supErr);
        }
      }
      // 2. 降级方案：本地压缩为 DataURL（保证任何情况下都能上传成功）
      const dataUrl = await compressImage(file, 1400, 0.9);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (e) {
      lastError = e;
      const detail =
        lastError?.message || lastError?.code || '';
      alert(
        `处理图片失败，请重试。\n\n可能原因：${
          detail
            ? `(${detail})`
            : '文件过大 / 格式不支持 / 浏览器沙盒限制'
        }\n\n建议：① 把图片改为 JPG 格式再试；② 或改用「粘贴图片链接」Tab 直接输入已上传的图片网址。`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Gallery Images Upload (Multiple)
  const handleGalleryUpload = async (files: FileList | File[]) => {
    setIsProcessing(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        let uploaded = false;
        // 1) 优先 Supabase
        if (isSupabaseConfigured()) {
          try {
            const publicUrl = await uploadAssetToStorage(file, `proj_gallery_${form.id || Date.now()}_${i}`);
            if (publicUrl) {
              newImages.push(publicUrl);
              uploaded = true;
            }
          } catch (err) {
            console.warn(`[Gallery ${i}] Supabase 上传失败，降级本地压缩:`, err);
          }
        }
        // 2) 降级本地压缩
        if (!uploaded) {
          try {
            const dataUrl = await compressImage(file, 1400, 0.88);
            newImages.push(dataUrl);
          } catch (compressErr) {
            console.warn(`[Gallery ${i}] 压缩失败，尝试直接读取原文件 DataURL`);
            // 3) 终极降级：FileReader 直接读原文件
            try {
              const rawDataUrl = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = (e) => resolve(e.target?.result as string);
                r.onerror = () => reject(new Error('File read fallback failed'));
                r.readAsDataURL(file);
              });
              newImages.push(rawDataUrl);
            } catch (fallbackErr) {
              alert(`图集图片「${file.name || '第' + (i + 1) + '张'}」处理失败，已跳过。`);
            }
          }
        }
      }
      if (newImages.length > 0) {
        setForm((prev) => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...newImages],
        }));
      } else {
        alert('没有成功添加任何图片，请检查文件格式后重试');
      }
    } catch (e) {
      console.error('图集上传总体异常:', e);
      alert('上传落地实景图片失败：' + (e?.message || '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Add Gallery URL
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      galleryImages: [...(prev.galleryImages || []), newGalleryUrl.trim()],
    }));
    setNewGalleryUrl('');
  };

  // Remove single gallery image
  const handleRemoveGalleryImage = (idxToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  // Handle PDF Upload
  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('请上传 PDF 格式文件');
      return;
    }
    // 简易大文件保护：超过 25MB 提示（避免 base64 炸内存 / 页面卡顿）
    if (file.size > 25 * 1024 * 1024) {
      if (
        !confirm(
          '您选择的 PDF 超过 25MB，建议先压缩或改用「粘贴 PDF 链接」Tab。\n是否仍要继续（可能较慢）？'
        )
      ) {
        return;
      }
    }
    setIsProcessing(true);
    let lastError: any = null;
    try {
      // 1) 先尝试上传到 Supabase 云端（带独立 try/catch）
      if (isSupabaseConfigured()) {
        try {
          const publicUrl = await uploadAssetToStorage(file, `proj_pdf_${form.id || Date.now()}`);
          if (publicUrl) {
            setForm((prev) => ({
              ...prev,
              pdfUrl: publicUrl,
              pdfFileName: file.name,
            }));
            return;
          }
        } catch (supErr) {
          lastError = supErr;
          console.warn('[PDF] Supabase 上传失败，降级为本地 DataURL:', supErr);
        }
      }
      // 2) 降级：FileReader 读为 DataURL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('读取 PDF 文件失败'));
        reader.readAsDataURL(file);
      });
      setForm((prev) => ({
        ...prev,
        pdfUrl: dataUrl,
        pdfFileName: file.name,
      }));
    } catch (err) {
      const detail = err?.message || lastError?.message || '';
      alert(
        `上传 PDF 文件失败，请重试。\n\n${detail ? '原因：' + detail + '\n\n' : ''}建议：改用「粘贴 PDF 链接」Tab，输入已在公网可访问的 PDF 网址（例如腾讯文档 / 坚果云直链）。`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c0e15] border border-[#b4935d]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-[#eee7db]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202430] bg-[#12151e]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d] font-orbitron text-xs font-semibold">
              {isNew ? 'NEW PROJECT' : `NO. ${form.number}`}
            </span>
            <div>
              <h3 className="text-base font-medium text-[#eee7db]">
                {isNew ? '新增精选代表作项目' : '编辑项目作品与落地资源'}
              </h3>
              <p className="text-[11px] text-[#8e877a]">
                {isNew 
                  ? '填写项目年份、服务品牌、空间类别及落地资源，保存后将自动按最新年份排列'
                  : '可编辑项目年份、服务品牌、空间类别及落地照片图集'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Basic Info: Year, Brand, Category, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
            {/* Project Year / Date */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-orbitron text-[#b4935d] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 项目年份 / 月份 *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8e877a]">
                    自动按最新年月置顶排序，NO. 01 即最新作品
                  </span>
                  <button
                    type="button"
                    onClick={() => setYmCustomMode((v) => !v)}
                    className={[
                      'px-2 py-0.5 rounded text-[10px] font-orbitron transition-colors border cursor-pointer',
                      ymCustomMode
                        ? 'bg-[#b4935d]/10 border-[#b4935d]/40 text-[#d3b277]'
                        : 'bg-[#14171f] border-[#2a2f3e] text-[#8e877a] hover:text-[#eee7db] hover:border-[#b4935d]/40',
                    ].join(' ')}
                  >
                    {ymCustomMode ? '✅ 使用选择器' : '✏️ 自定义格式'}
                  </button>
                </div>
              </div>

              {!ymCustomMode ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[#6b665c]">年份</span>
                    <select
                      required
                      value={ymYear}
                      onChange={(e) => {
                        const v = e.target.value;
                        setYmYear(v === '' ? '' : parseInt(v, 10));
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">-- 请选年份 --</option>
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          {y} 年
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-8 bg-[#2a2f3e]" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[#6b665c]">月份（不选 = 该年 12 月）</span>
                    <select
                      value={ymMonth}
                      onChange={(e) => {
                        const v = e.target.value;
                        setYmMonth(v === '' ? '' : parseInt(v, 10));
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">全年（默认 12 月排序）</option>
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} 月
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-[#6b665c]">当前保存值</span>
                    <div className="px-3.5 py-2 rounded-lg bg-[#0d0f14] border border-[#232734] text-[#d3b277] text-xs font-orbitron tracking-wider truncate">
                      {form.year || '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="如：2025.04、2024年6月、或范围 2023.08 — 2024.05"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-[#6b665c]">
                    自定义模式：支持 2025.05、2024.06、2024年4月，或范围"2023.08 - 2024.05"（自动取末端日期排序）
                  </p>
                </div>
              )}
            </div>

            {/* Service Brand */}
            <div className="space-y-1.5">
              <label className="block text-xs font-orbitron text-[#b4935d] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 服务品牌 / 客户名称 *
              </label>
              <input
                type="text"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="例如：保利发展 / POLY 或 广州家和家居"
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-orbitron text-[#c2b5a1]">
                项目全称 / 作品标题 *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例如：昆明铂尼斯·艺术家 艺术生活馆全案软装"
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              />
            </div>

            {/* Category & Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-orbitron text-[#8e877a]">
                空间类型 / 类别
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              >
                <option value="别墅私宅">别墅私宅</option>
                <option value="商业展厅">商业展厅</option>
                <option value="房地产样板房">房地产样板房</option>
                <option value="私人客户">私人客户</option>
                <option value="品牌单店">品牌单店</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-orbitron text-[#8e877a] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 项目地点
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="例如：广东 · 广州"
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Cover Photo Management */}
          <div className="space-y-3 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
            <label className="block text-xs font-orbitron text-[#b4935d] uppercase flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> 项目封面大图
            </label>

            <div className="flex items-center gap-2 p-1 bg-[#161922] border border-[#282d3b] rounded-lg">
              <button
                type="button"
                onClick={() => setCoverTab('upload')}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                  coverTab === 'upload' ? 'bg-[#b4935d] text-[#08090c]' : 'text-[#8e877a]'
                }`}
              >
                本地图片上传
              </button>
              <button
                type="button"
                onClick={() => setCoverTab('url')}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                  coverTab === 'url' ? 'bg-[#b4935d] text-[#08090c]' : 'text-[#8e877a]'
                }`}
              >
                网络图片链接
              </button>
            </div>

            {coverTab === 'upload' ? (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-[#2b3040] hover:border-[#b4935d]/60 rounded-xl p-4 text-center cursor-pointer bg-[#141722] hover:bg-[#181c28] transition-all flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCoverUpload(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-5 h-5 text-[#b4935d]" />
                <p className="text-xs text-[#eee7db]">点击选择或拖拽封面照片 (JPG/PNG)</p>
              </div>
            ) : (
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              />
            )}

            {/* Current Cover Preview */}
            {form.imageUrl && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[#161922] border border-[#262b38]">
                <img
                  src={form.imageUrl}
                  alt="封面预览"
                  className="w-16 h-12 object-cover rounded"
                />
                <span className="text-xs text-[#b4935d] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 封面就绪
                </span>
              </div>
            )}
          </div>

          {/* Landing Photos Gallery Management (落地实景照片) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-orbitron text-[#b4935d] uppercase flex items-center gap-2">
                <Layers className="w-4 h-4" /> 可浏览的项目落地照片图集 ({form.galleryImages?.length || 0} 张)
              </label>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b4935d]/15 hover:bg-[#b4935d] border border-[#b4935d]/40 text-xs text-[#b4935d] hover:text-[#08090c] font-orbitron font-medium transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>批量上传落地照片</span>
              </button>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleGalleryUpload(e.target.files);
                }
              }}
            />

            {/* URL quick add */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="或输入单张落地实景图片 URL 地址并点击添加..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddGalleryUrl}
                className="px-4 py-2 rounded-lg bg-[#1e222d] hover:bg-[#282d3c] text-xs text-[#eee7db] font-orbitron font-medium border border-[#303648] transition-colors"
              >
                添加图片
              </button>
            </div>

            {/* Gallery Thumbnail Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {form.galleryImages &&
                form.galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-[#2a2f3d] bg-black aspect-video flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt={`落地照片 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                        title="删除该照片"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-orbitron text-white">
                      0{idx + 1}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Proposal PDF Document Management (方案PDF设置与在线链接) */}
          <div className="space-y-3.5 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-orbitron text-[#b4935d] uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> 方案汇报 PDF 文档设置
              </label>
              {form.pdfUrl && (
                <a
                  href={form.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#b4935d] hover:text-[#cbb082] font-orbitron transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>测试浏览当前PDF</span>
                </a>
              )}
            </div>

            {/* Editable PDF Document Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-orbitron text-[#c2b5a1]">
                PDF 方案文档名称 / 标题 (可自由编辑)
              </label>
              <input
                type="text"
                value={form.pdfFileName || ''}
                onChange={(e) => setForm({ ...form, pdfFileName: e.target.value })}
                placeholder={`例如：${form.title || '项目'}-全案软装设计汇报方案.pdf`}
                className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors font-sans"
              />
            </div>

            {/* PDF Source Tabs */}
            <div className="flex items-center gap-2 p-1 bg-[#161922] border border-[#282d3b] rounded-lg">
              <button
                type="button"
                onClick={() => setPdfTab('url')}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                  pdfTab === 'url' ? 'bg-[#b4935d] text-[#08090c]' : 'text-[#8e877a]'
                }`}
              >
                网络 PDF 浏览链接 (支持 MaiPDF / OSS / 直链)
              </button>
              <button
                type="button"
                onClick={() => setPdfTab('upload')}
                className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                  pdfTab === 'upload' ? 'bg-[#b4935d] text-[#08090c]' : 'text-[#8e877a]'
                }`}
              >
                本地 PDF 上传
              </button>
            </div>

            {pdfTab === 'url' ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={form.pdfUrl || ''}
                  onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                  placeholder="请输入 PDF 在线链接，例如：https://maipdf.cn/file/xxx 或 https://example.com/proposal.pdf"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-[#7a7368]">
                  输入有效的 PDF 网址后，用户点击项目即可直接在内置大屏阅读器或新窗口中在线流畅翻阅。
                </p>
              </div>
            ) : (
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="border-2 border-dashed border-[#2b3040] hover:border-[#b4935d]/60 rounded-xl p-4 text-center cursor-pointer bg-[#141722] hover:bg-[#181c28] transition-all flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePdfUpload(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-5 h-5 text-[#b4935d]" />
                <p className="text-xs text-[#eee7db]">点击选择本地方案 PDF 文件进行上传</p>
              </div>
            )}

            {/* Current PDF Status indicator */}
            {form.pdfUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161922] border border-[#262b38]">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-[#b4935d] shrink-0" />
                  <span className="text-xs text-[#eee7db] truncate">
                    {form.pdfFileName || `${form.title}-方案.pdf`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pdfUrl: '', pdfFileName: '' })}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                >
                  清空文档
                </button>
              </div>
            )}
          </div>

          {/* Detailed Concept / Design Philosophy */}
          <div className="space-y-4 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
            <div className="space-y-1.5">
              <label className="block text-xs font-orbitron text-[#c2b5a1]">
                全案设计深度阐述 / 方案理念
              </label>
              <textarea
                rows={4}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="详细记录设计构思、动线规划、家具选型与空间美学落地细节..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-[#2a2f3e] focus:border-[#b4935d] text-[#eee7db] text-xs focus:outline-none transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!isNew && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(form.id);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 hover:border-red-600 text-red-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除此代表作</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#171a22] hover:bg-[#222632] text-[#a8a195] text-xs font-medium transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-7 py-2.5 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs font-orbitron tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#b4935d]/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isNew ? '创建并保存代表作' : '保存所有修改'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
