import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Award,
  ExternalLink,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Link2,
  Download,
  FileJson,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import { Honor } from '../types';
import { DEFAULT_HONORS_LIST as __FILE_DEFAULT_HONORS_LIST__ } from '../data/honorsData';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  uploadAssetToStorage,
  isSupabaseConfigured,
} from '../utils/supabaseClient';
import { useAdmin } from '../context/AdminContext';

const STORAGE_KEY = 'mason_portfolio_honors_v2';
const FALLBACK_KEYS = ['mason_portfolio_honors', 'user_custom_honors', 'honors_data'];

export const DEFAULT_HONORS_LIST: Honor[] = __FILE_DEFAULT_HONORS_LIST__;

// Sub-component: 3D Tilt & Metallic Shimmer Honor Card
const TiltHonorCard: React.FC<{
  honor: Honor;
  idx: number;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ honor, idx, isAdmin, onSelect, onEdit, onDelete }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number; x: number; y: number }>({
    rotateX: 0,
    rotateY: 0,
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;

    const maxTilt = 8;
    setTilt({
      rotateX: -yPct * maxTilt,
      rotateY: xPct * maxTilt,
      x,
      y,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, x: 0, y: 0 });
  };

  return (
    <div style={{ perspective: 1000 }} className="relative rounded-2xl select-none h-full flex flex-col group/tilt">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        onClick={onSelect}
        className="group relative rounded-2xl bg-[#0c0e14] border border-[#232733] hover:border-[#b4935d]/70 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-black/80 flex-1"
      >
        {/* Certificate Image Frame */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#090b0f] border-b border-[#1f2330]">
          <img
            src={honor.imageUrl}
            alt={honor.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-transparent to-transparent opacity-80" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#b4935d]/50 text-[#f2dfbf] font-orbitron text-[10px] font-semibold flex items-center gap-1 shadow-sm">
              <Award className="w-3 h-3 text-[#b4935d]" />
              <span>0{idx + 1}</span>
            </span>
            {honor.year && (
              <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-orbitron text-[#c2b5a1] border border-white/10">
                {honor.year}
              </span>
            )}
          </div>

          {/* Admin Hover Actions */}
          {isAdmin && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-full bg-black/80 hover:bg-[#b4935d] border border-[#b4935d]/40 text-[#cbb082] hover:text-[#08090c] transition-all shadow-md cursor-pointer"
                title="编辑此荣誉与证书图片"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-full bg-black/80 hover:bg-red-600 border border-white/10 hover:border-red-500 text-[#c2b5a1] hover:text-white transition-all shadow-md cursor-pointer"
                title="删除此荣誉"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom hint on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[#f2dfbf] flex items-center gap-1 text-[10px] font-orbitron">
              <ZoomIn className="w-3 h-3 text-[#b4935d]" />
              <span>查看大图</span>
            </div>
          </div>
        </div>

        {/* Honor Information */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            {honor.issuer && (
              <p className="text-[11px] font-orbitron text-[#b4935d] tracking-wider truncate">
                {honor.issuer}
              </p>
            )}
            <h3 className="text-sm sm:text-base font-medium text-[#eee7db] group-hover:text-[#f2dfbf] transition-colors leading-snug line-clamp-2">
              {honor.title}
            </h3>
          </div>

          <div className="pt-2 border-t border-[#1d202b] flex items-center justify-between">
            <span className="text-[11px] text-[#787165]">荣誉证书</span>
            <span className="text-[11px] text-[#b4935d] font-orbitron flex items-center gap-1">
              <span>查看大图</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Honors: React.FC = () => {
  const { isAdmin, showToast: triggerGlobalToast } = useAdmin();
  const [honors, setHonors] = useState<Honor[]>(DEFAULT_HONORS_LIST);

  // Async load from Supabase and local cache on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedData = await fetchSectionData<Honor[]>(
          'honors',
          'honors_list',
          STORAGE_KEY,
          DEFAULT_HONORS_LIST
        );
        if (isMounted && savedData && Array.isArray(savedData) && savedData.length > 0) {
          setHonors(savedData);
        }
      } catch (err) {
        console.warn('Async load honors error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // State for lightbox preview
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // State for edit / add modal
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingHonor, setEditingHonor] = useState<Honor | null>(null);
  const [honorToDelete, setHonorToDelete] = useState<Honor | null>(null);
  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('荣誉信息与图片已永久保存！');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importJsonInputRef = useRef<HTMLInputElement>(null);

  // Save to both Supabase cloud & local persistence
  const saveHonors = async (newList: Honor[], msg = '荣誉信息与图片已永久保存！') => {
    setHonors(newList);
    const result = await saveSectionData<Honor[]>('honors', 'honors_list', STORAGE_KEY, newList);

    // Also sync individual fields (text_1, image_1, etc.) to site_content
    if (isSupabaseConfigured()) {
      try {
        for (let i = 0; i < newList.length; i++) {
          const item = newList[i];
          await upsertSiteContent('honors', `text_${i + 1}`, `${item.title} | ${item.issuer} | ${item.year}`);
          if (item.imageUrl) {
            await upsertSiteContent('honors', `image_${i + 1}`, item.imageUrl);
          }
        }
      } catch (e) {}
    }

    const finalMsg = result.cloudSynced
      ? `${msg}（已同步至 Supabase 云端）`
      : msg;
    setToastMessage(finalMsg);
    setShowSavedToast(true);
    triggerGlobalToast(finalMsg);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleResetToDefault = () => {
    if (confirm('确定要恢复为初始默认的 4 项荣誉证书吗？')) {
      saveHonors(DEFAULT_HONORS_LIST, '已恢复初始默认荣誉数据');
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(honors, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `陈梅生-获得荣誉数据备份-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      saveHonors(honors, '荣誉数据已成功导出为 JSON 备份文件！');
    } catch (e) {
      alert('导出备份失败');
    }
  };

  // Import JSON backup
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await saveHonors(parsed, '荣誉数据备份已成功导入并保存！');
        } else {
          alert('导入的备份数据格式不匹配');
        }
      } catch (err) {
        alert('解析备份 JSON 文件失败，请确认文件格式');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenAddHonor = () => {
    setIsCreatingNew(true);
    setEditingHonor({
      id: `honor-${Date.now()}`,
      title: '',
      year: `${new Date().getFullYear()}年`,
      issuer: '',
      imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      linkUrl: '',
    });
    setUploadTab('upload');
    setIsEditingModalOpen(true);
  };

  const handleOpenEditHonor = (honor: Honor, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingNew(false);
    setEditingHonor({ ...honor });
    setUploadTab(honor.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setIsEditingModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!honorToDelete) return;
    const updated = honors.filter((h) => h.id !== honorToDelete.id);
    await saveHonors(updated, '荣誉奖项已成功删除');
    setHonorToDelete(null);
  };

  const closeEditModal = () => {
    setIsEditingModalOpen(false);
    setEditingHonor(null);
    setIsCreatingNew(false);
    setIsProcessingImage(false);
  };

  // Image compressor & reader
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片格式文件 (JPG, PNG, WebP等)');
      return;
    }

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setEditingHonor((prev) => (prev ? { ...prev, imageUrl: compressedDataUrl } : null));
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        alert('解析图片失败，请重试');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      alert('读取文件失败');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHonor || !editingHonor.title.trim()) {
      alert('请填写荣誉标题');
      return;
    }

    let finalHonor = { ...editingHonor };
    // If image is a local base64 data URL and Supabase is configured, upload to Storage assets bucket
    if (finalHonor.imageUrl?.startsWith('data:') && isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadAssetToStorage(finalHonor.imageUrl, `honor_${finalHonor.id || Date.now()}`);
        if (publicUrl) {
          finalHonor.imageUrl = publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Honor image upload to Supabase failed, saving locally:', uploadErr);
      }
    }

    let updated: Honor[];
    if (isCreatingNew) {
      updated = [finalHonor, ...honors];
    } else {
      updated = honors.map((h) => (h.id === finalHonor.id ? finalHonor : h));
    }

    await saveHonors(updated, isCreatingNew ? '🎉 新荣誉奖项已成功添加并保存！' : '荣誉信息与图片已成功更新并保存！');
    closeEditModal();
  };

  const activeHonor = selectedImageIndex !== null ? honors[selectedImageIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + honors.length) % honors.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % honors.length);
    }
  };

  return (
    <section id="honors" className="py-24 px-6 sm:px-12 bg-[#08090c] border-t border-b border-[#1b1d22] relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#b4935d]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d0f14] border border-[#b4935d] text-[#eee7db] shadow-2xl shadow-black/80 animate-fade-in">
          <Check className="w-4 h-4 text-[#b4935d]" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Importing JSON Backup */}
      <input
        ref={importJsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImportBackup(e.target.files[0]);
          }
        }}
      />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Heading & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#b4935d]" /> HONORS & AWARDS
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#b4935d]/10 border border-[#b4935d]/30 text-[10px] font-orbitron text-[#b4935d]">
                <ShieldCheck className="w-3 h-3 text-[#b4935d]" /> 编辑内容永久保存
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
              获得荣誉
            </h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Add New Honor Button */}
              <button
                id="honors-add-new-btn"
                onClick={handleOpenAddHonor}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] text-xs font-orbitron font-semibold transition-all shadow-md shadow-[#b4935d]/20 cursor-pointer"
                title="新增一项获奖荣誉或证书"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增荣誉</span>
              </button>

              <button
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171f] hover:bg-[#1c202a] border border-[#262a35] hover:border-[#b4935d]/40 text-[#c2b5a1] hover:text-[#eee7db] text-xs font-orbitron transition-colors"
                title="导出当前荣誉数据备份为 JSON 文件"
              >
                <Download className="w-3.5 h-3.5 text-[#b4935d]" />
                <span>备份数据</span>
              </button>

              <button
                onClick={() => importJsonInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171f] hover:bg-[#1c202a] border border-[#262a35] hover:border-[#b4935d]/40 text-[#c2b5a1] hover:text-[#eee7db] text-xs font-orbitron transition-colors"
                title="导入之前备份的荣誉数据文件"
              >
                <FileJson className="w-3.5 h-3.5 text-[#b4935d]" />
                <span>导入备份</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171f] hover:bg-[#1c202a] border border-[#262a35] hover:border-[#b4935d]/40 text-[#8e877a] hover:text-[#eee7db] text-xs transition-colors"
                title="恢复初始默认数据"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复初始</span>
              </button>
            </div>
          )}
        </div>

        {/* Honors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {honors.map((honor, idx) => (
            <TiltHonorCard
              key={honor.id || idx}
              honor={honor}
              idx={idx}
              isAdmin={isAdmin}
              onSelect={() => setSelectedImageIndex(idx)}
              onEdit={(e) => handleOpenEditHonor(honor, e)}
              onDelete={(e) => {
                e.stopPropagation();
                setHonorToDelete(honor);
              }}
            />
          ))}
        </div>
      </div>

      {/* Edit & Upload Modal (Admin Only) */}
      {isAdmin && isEditingModalOpen && editingHonor && (
        <div
          onClick={closeEditModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-[#0e1017] border border-[#b4935d]/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#212530] bg-[#12141c]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d]">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-medium text-[#eee7db]">
                    {isCreatingNew ? '新增荣誉奖项' : '编辑荣誉与证书图片'}
                  </h3>
                  <p className="text-[11px] text-[#8e877a]">支持上传本地荣誉证书照片或输入网络图片，并修改文字描述</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Image Preview & Upload Section */}
              <div className="space-y-3">
                <label className="block text-xs font-orbitron tracking-wider text-[#b4935d] uppercase">
                  荣誉照片 / 证书图片 *
                </label>

                {/* Upload Mode Tabs */}
                <div className="flex items-center gap-2 p-1 bg-[#141720] border border-[#262a36] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadTab('upload')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      uploadTab === 'upload'
                        ? 'bg-[#b4935d] text-[#08090c]'
                        : 'text-[#8e877a] hover:text-[#eee7db]'
                    }`}
                  >
                    本地证书上传
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadTab('url')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      uploadTab === 'url'
                        ? 'bg-[#b4935d] text-[#08090c]'
                        : 'text-[#8e877a] hover:text-[#eee7db]'
                    }`}
                  >
                    网络图片链接
                  </button>
                </div>

                {uploadTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#292d3c] hover:border-[#b4935d]/60 rounded-xl p-5 text-center cursor-pointer bg-[#11131b] hover:bg-[#151822] transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5 text-[#b4935d]" />
                      <p className="text-xs text-[#eee7db]">
                        {isProcessingImage ? '正在处理与压缩图片...' : '点击选择本地荣誉证书图片并自动编码保存'}
                      </p>
                      <span className="text-[10px] text-[#716d66]">
                        支持 JPG, PNG, WebP 格式（自动按比例压缩至最佳画质）
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editingHonor.imageUrl}
                      onChange={(e) => setEditingHonor({ ...editingHonor, imageUrl: e.target.value })}
                      placeholder="请输入图片外链 URL (https://...)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#262a36] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                    />
                  </div>
                )}

                {/* Thumbnail Preview */}
                {editingHonor.imageUrl && (
                  <div className="relative aspect-[16/9] w-full max-h-48 rounded-xl overflow-hidden bg-black border border-[#262a36]">
                    <img
                      src={editingHonor.imageUrl}
                      alt="预览"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-orbitron text-[#c2b5a1]">
                  荣誉奖项名称 *
                </label>
                <input
                  type="text"
                  required
                  value={editingHonor.title}
                  onChange={(e) => setEditingHonor({ ...editingHonor, title: e.target.value })}
                  placeholder="例如：2023 中国软装年度十佳空间设计奖"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#262a36] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                />
              </div>

              {/* Issuer & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-orbitron text-[#c2b5a1]">
                    颁发机构 / 评奖组织
                  </label>
                  <input
                    type="text"
                    value={editingHonor.issuer || ''}
                    onChange={(e) => setEditingHonor({ ...editingHonor, issuer: e.target.value })}
                    placeholder="例如：中国室内装饰协会"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#262a36] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-orbitron text-[#c2b5a1]">
                    获得年份 / 学年度
                  </label>
                  <input
                    type="text"
                    value={editingHonor.year || ''}
                    onChange={(e) => setEditingHonor({ ...editingHonor, year: e.target.value })}
                    placeholder="例如：2023年"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#262a36] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                  />
                </div>
              </div>

              {/* Official Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-orbitron text-[#c2b5a1]">
                  官方获奖公示或证明网址 (选填)
                </label>
                <input
                  type="text"
                  value={editingHonor.linkUrl || ''}
                  onChange={(e) => setEditingHonor({ ...editingHonor, linkUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141720] border border-[#262a36] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#1f2330] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl bg-[#171a24] hover:bg-[#202432] text-xs text-[#8e877a] hover:text-[#eee7db] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isProcessingImage}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] font-medium text-xs transition-colors shadow-lg shadow-[#b4935d]/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreatingNew ? '确认新增' : '保存修改'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {honorToDelete && (
        <div
          onClick={() => setHonorToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0e1017] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-[#eee7db]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">确认删除此项荣誉？</h4>
                <p className="text-xs text-[#8e877a]">删除后将从网站荣誉列表中移除</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141720] border border-[#232734] text-xs text-[#cbb082]">
              <strong>{honorToDelete.title}</strong>
              <p className="text-[#8e877a] mt-0.5">{honorToDelete.issuer}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setHonorToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#171a24] text-xs text-[#8e877a] hover:text-[#eee7db]"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Preview Modal */}
      {activeHonor && selectedImageIndex !== null && (
        <div
          onClick={() => setSelectedImageIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xl animate-fade-in"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-[#eee7db] hover:text-white transition-colors z-20"
            title="关闭大图 (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nav Prev */}
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 border border-[#b4935d]/40 text-[#eee7db] hover:text-[#b4935d] transition-all z-20 cursor-pointer"
            title="上一张"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Nav Next */}
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 border border-[#b4935d]/40 text-[#eee7db] hover:text-[#b4935d] transition-all z-20 cursor-pointer"
            title="下一张"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Card Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#0d0f14] border border-[#b4935d]/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image Box */}
            <div className="md:w-3/5 bg-black flex items-center justify-center p-2 relative overflow-hidden min-h-[260px] md:min-h-[420px]">
              <img
                src={activeHonor.imageUrl}
                alt={activeHonor.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Info Sidebar Box */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#0f1117] border-t md:border-t-0 md:border-l border-[#22252e]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#b4935d]/10 border border-[#b4935d]/40 text-xs font-orbitron text-[#b4935d] font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> 荣誉证书 0{selectedImageIndex + 1}
                  </span>
                  {activeHonor.year && (
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-orbitron text-[#c2b5a1]">
                      {activeHonor.year}
                    </span>
                  )}
                </div>

                {activeHonor.issuer && (
                  <p className="text-xs text-[#b4935d] font-orbitron tracking-widest uppercase">
                    {activeHonor.issuer}
                  </p>
                )}

                <h3 className="text-xl sm:text-2xl font-light text-[#eee7db] leading-relaxed">
                  {activeHonor.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#22252e] space-y-3">
                {activeHonor.linkUrl && activeHonor.linkUrl !== '#' && activeHonor.linkUrl.trim() !== '' && (
                  <a
                    href={activeHonor.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs font-orbitron tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#b4935d]/20"
                  >
                    <span>访问官方获奖证明页面</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      const current = activeHonor;
                      setSelectedImageIndex(null);
                      handleOpenEditHonor(current, e);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1b1f2b] hover:bg-[#b4935d] text-[#b4935d] hover:text-[#08090c] text-xs font-orbitron font-medium flex items-center justify-center gap-1.5 transition-colors border border-[#2b3142] hover:border-[#b4935d] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>编辑此荣誉与图片</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#a8a195] hover:text-[#eee7db] text-xs font-medium transition-colors cursor-pointer"
                >
                  关闭大图
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
