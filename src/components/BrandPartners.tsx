import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  MoveHorizontal,
  Layers,
} from 'lucide-react';
import { BrandPartner } from '../types';
import { DEFAULT_BRAND_PARTNERS } from '../data/brandPartnersData';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  uploadAssetToStorage,
  isSupabaseConfigured,
} from '../utils/supabaseClient';
import { useAdmin } from '../context/AdminContext';

const STORAGE_KEY = 'mason_portfolio_brand_partners_v1';
const FALLBACK_KEYS = ['mason_portfolio_brands', 'user_custom_brand_partners'];

// Sub-component: Luxury Brand Card used in both Marquee and Grid mode
const BrandCard: React.FC<{
  brand: BrandPartner;
  isAdmin: boolean;
  onOpenEdit: (brand: BrandPartner, e?: React.MouseEvent) => void;
  onQuickUpload: (brandId: string, e: React.MouseEvent) => void;
  onRequestDelete: (brand: BrandPartner, e: React.MouseEvent) => void;
  compact?: boolean;
}> = ({ brand, isAdmin, onOpenEdit, onQuickUpload, onRequestDelete, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isAdmin) onOpenEdit(brand);
      }}
      className={`group relative bg-[#0b0e14]/90 border rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-all duration-300 backdrop-blur-md select-none overflow-hidden ${
        compact
          ? 'w-[280px] sm:w-[320px] h-[96px] sm:h-[104px] flex-shrink-0'
          : 'w-full h-full flex-col text-center justify-between'
      } ${
        isHovered
          ? 'border-[#b4935d]/80 bg-[#121620] -translate-y-1 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.9),0_0_20px_rgba(180,147,93,0.2)]'
          : 'border-[#1b202c]'
      } ${isAdmin ? 'cursor-pointer' : ''}`}
    >
      {/* Metallic golden shimmer sweep on hover */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#f2dfbf]/15 to-transparent animate-golden-shimmer" />
      </div>

      {/* Admin Quick Action Bar */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button
            type="button"
            onClick={(e) => onQuickUpload(brand.id, e)}
            className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#b4935d] hover:text-[#08090c] text-[#8e877a] transition-colors cursor-pointer shadow"
            title="上传/更换 Logo 照片"
          >
            <Upload className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => onOpenEdit(brand, e)}
            className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#b4935d] hover:text-[#08090c] text-[#8e877a] transition-colors cursor-pointer shadow"
            title="编辑品牌名称与 Logo"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => onRequestDelete(brand, e)}
            className="p-1.5 rounded-lg bg-[#141824] hover:bg-red-600 hover:text-white text-[#8e877a] transition-colors cursor-pointer shadow"
            title="删除品牌"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Left Logo / Symbol Container */}
      <div
        className={`${
          compact
            ? 'w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0'
            : 'w-full aspect-[4/3] mb-3'
        } rounded-xl bg-[#07090e] border border-[#181c26] group-hover:border-[#b4935d]/40 flex items-center justify-center p-2 overflow-hidden transition-all duration-300 relative`}
      >
        {brand.logoUrl && brand.logoUrl.trim() !== '' ? (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 group-hover:scale-108 transition-all duration-500"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-1">
            <span className="font-orbitron font-bold text-xs sm:text-sm text-[#b4935d] tracking-wider">
              {brand.logoSymbol || brand.name.slice(0, 4)}
            </span>
          </div>
        )}
      </div>

      {/* Right Content / Info */}
      <div className={`flex-1 min-w-0 ${compact ? 'text-left' : 'w-full'}`}>
        {brand.category && (
          <p className="text-[10px] text-[#b4935d] font-orbitron tracking-wider flex items-center gap-1 truncate mb-0.5">
            <span className="w-1 h-1 rounded-full bg-[#b4935d] flex-shrink-0" />
            <span className="truncate">{brand.category}</span>
          </p>
        )}
        <h3
          className="text-xs sm:text-sm font-medium text-[#eee7db] group-hover:text-[#f3e3ca] transition-colors truncate"
          title={brand.name}
        >
          {brand.name}
        </h3>
        {brand.enName ? (
          <p className="text-[10px] text-[#787265] font-orbitron tracking-widest uppercase truncate">
            {brand.enName}
          </p>
        ) : brand.highlightProject ? (
          <p className="text-[10px] text-[#787265] truncate" title={brand.highlightProject}>
            {brand.highlightProject}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export const BrandPartners: React.FC = () => {
  const { isAdmin, showToast } = useAdmin();
  const [brands, setBrands] = useState<BrandPartner[]>(DEFAULT_BRAND_PARTNERS);

  const [viewMode, setViewMode] = useState<'marquee' | 'grid'>('marquee');
  const [editingBrand, setEditingBrand] = useState<BrandPartner | null>(null);
  const [isNewBrand, setIsNewBrand] = useState<boolean>(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandPartner | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadBrandIdRef = useRef<string | null>(null);

  // Sync with Supabase cloud and local storage on load
  useEffect(() => {
    let isMounted = true;
    fetchSectionData<BrandPartner[]>('brands', 'brands_list', STORAGE_KEY, DEFAULT_BRAND_PARTNERS).then((data) => {
      if (isMounted && data && Array.isArray(data) && data.length > 0) {
        setBrands(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to Supabase and storage
  const saveBrandsToStorage = async (newList: BrandPartner[], msg?: string) => {
    setBrands(newList);
    const result = await saveSectionData<BrandPartner[]>('brands', 'brands_list', STORAGE_KEY, newList);
    if (msg) {
      showToast(result.cloudSynced ? `${msg}（已同步至 Supabase 云端）` : msg);
    }
  };

  // Image compression helper
  const compressImage = (file: File, maxDim = 800, quality = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
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

  // Split brands into 2 distinct tracks for dual-direction marquee
  const { track1, track2 } = useMemo(() => {
    const half = Math.ceil(brands.length / 2);
    const t1 = brands.slice(0, half);
    const t2 = brands.slice(half);

    // Repeat elements to ensure continuous smooth infinite marquee
    const repeatedT1 = [...t1, ...t1, ...t1, ...t1];
    const repeatedT2 = [...(t2.length > 0 ? t2 : t1), ...(t2.length > 0 ? t2 : t1), ...(t2.length > 0 ? t2 : t1), ...(t2.length > 0 ? t2 : t1)];
    return { track1: repeatedT1, track2: repeatedT2 };
  }, [brands]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setIsNewBrand(true);
    setEditingBrand({
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: '',
      enName: '',
      category: '合作企业',
      logoUrl: '',
      logoSymbol: '',
    });
  };

  // Handle open edit modal
  const handleOpenEdit = (brand: BrandPartner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsNewBrand(false);
    setEditingBrand({ ...brand });
  };

  // Handle modal image upload
  const handleModalImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBrand) return;

    setIsProcessingImage(true);
    try {
      if (isSupabaseConfigured()) {
        const publicUrl = await uploadAssetToStorage(file, `brand_${editingBrand.id || Date.now()}`);
        if (publicUrl) {
          setEditingBrand({
            ...editingBrand,
            logoUrl: publicUrl,
          });
          return;
        }
      }
      const dataUrl = await compressImage(file);
      setEditingBrand({
        ...editingBrand,
        logoUrl: dataUrl,
      });
    } catch {
      alert('上传 Logo 图片失败，请重试');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Handle quick image file upload directly from card
  const handleQuickUploadTrigger = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    quickUploadBrandIdRef.current = brandId;
    fileInputRef.current?.click();
  };

  const handleQuickFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const brandId = quickUploadBrandIdRef.current;
    if (!file || !brandId) return;

    try {
      let finalUrl = '';
      if (isSupabaseConfigured()) {
        try {
          finalUrl = await uploadAssetToStorage(file, `brand_${brandId}`);
        } catch (e) {}
      }
      if (!finalUrl) {
        finalUrl = await compressImage(file);
      }
      const updated = brands.map((b) => (b.id === brandId ? { ...b, logoUrl: finalUrl } : b));
      await saveBrandsToStorage(updated, '品牌 Logo 已成功更新');
    } catch {
      alert('上传图片失败，请重试');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      quickUploadBrandIdRef.current = null;
    }
  };

  // Save Brand form
  const handleSaveBrandForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    if (!editingBrand.name.trim()) {
      alert('请填写品牌方名字');
      return;
    }

    if (isNewBrand) {
      await saveBrandsToStorage([...brands, editingBrand], '🎉 新合作企业品牌已成功添加');
    } else {
      await saveBrandsToStorage(brands.map((b) => (b.id === editingBrand.id ? editingBrand : b)), '合作企业品牌信息已更新');
    }
    setEditingBrand(null);
  };

  // Delete Brand
  const handleConfirmDelete = () => {
    if (!brandToDelete) return;
    saveBrandsToStorage(brands.filter((b) => b.id !== brandToDelete.id));
    setBrandToDelete(null);
  };

  // Reset to default
  const handleExecuteReset = () => {
    saveBrandsToStorage(DEFAULT_BRAND_PARTNERS);
    setShowResetConfirm(false);
  };

  return (
    <section id="brands" className="py-24 px-4 sm:px-8 lg:px-12 bg-[#06070a] border-b border-[#14161c] relative overflow-hidden">
      {/* Background ambient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#b4935d]/4 blur-[120px] rounded-full pointer-events-none" />

      {/* Hidden file input for quick direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickFileInputChange}
      />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2 sm:px-0">
          <div>
            <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b4935d]" /> BRAND PARTNERS
            </p>
            <h2 className="text-3xl sm:text-4xl font-light tracking-wide text-[#eee7db]">
              合作品牌
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Marquee vs Grid */}
            <div className="flex items-center bg-[#0e111a] border border-[#222736] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('marquee')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-medium transition-all cursor-pointer ${
                  viewMode === 'marquee'
                    ? 'bg-[#b4935d] text-[#08090c] shadow-sm'
                    : 'text-[#8e877a] hover:text-[#eee7db]'
                }`}
                title="双轨流光跑马灯展示"
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">流光跑马灯</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-medium transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#b4935d] text-[#08090c] shadow-sm'
                    : 'text-[#8e877a] hover:text-[#eee7db]'
                }`}
                title="平铺矩阵展示"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">平铺矩阵</span>
              </button>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs font-orbitron flex items-center gap-1.5 transition-all shadow-md shadow-[#b4935d]/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加品牌</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="p-2 rounded-xl bg-[#141722] hover:bg-[#1f2333] border border-[#2a2f42] text-[#8e877a] hover:text-[#eee7db] text-xs font-orbitron transition-all cursor-pointer"
                  title="重置为默认品牌名录"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {brands.length === 0 ? (
          <div className="py-16 px-6 rounded-2xl bg-[#0b0e14] border border-[#1e2330] text-center space-y-3">
            <Building2 className="w-10 h-10 text-[#555046] mx-auto" />
            <p className="text-sm text-[#8e877a]">暂无合作品牌数据</p>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-[#b4935d] text-xs font-semibold text-[#08090c]"
              >
                立即添加第一个品牌
              </button>
            )}
          </div>
        ) : viewMode === 'marquee' ? (
          /* Dual-Track Infinite Marquee Container */
          <div className="relative w-full overflow-hidden pause-on-hover py-4 space-y-5">
            {/* Cinematic Left & Right Feathering Gradient Mask */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#06070a] to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#06070a] to-transparent z-20" />

            {/* Track 1: Leftwards Scrolling Marquee */}
            <div className="overflow-hidden flex w-full">
              <div className="flex gap-4 sm:gap-5 animate-marquee-left">
                {track1.map((brand, idx) => (
                  <BrandCard
                    key={`t1-${brand.id}-${idx}`}
                    brand={brand}
                    isAdmin={isAdmin}
                    compact={true}
                    onOpenEdit={handleOpenEdit}
                    onQuickUpload={handleQuickUploadTrigger}
                    onRequestDelete={(b, e) => {
                      e.stopPropagation();
                      setBrandToDelete(b);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Track 2: Rightwards Scrolling Marquee */}
            <div className="overflow-hidden flex w-full">
              <div className="flex gap-4 sm:gap-5 animate-marquee-right">
                {track2.map((brand, idx) => (
                  <BrandCard
                    key={`t2-${brand.id}-${idx}`}
                    brand={brand}
                    isAdmin={isAdmin}
                    compact={true}
                    onOpenEdit={handleOpenEdit}
                    onQuickUpload={handleQuickUploadTrigger}
                    onRequestDelete={(b, e) => {
                      e.stopPropagation();
                      setBrandToDelete(b);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isAdmin={isAdmin}
                compact={false}
                onOpenEdit={handleOpenEdit}
                onQuickUpload={handleQuickUploadTrigger}
                onRequestDelete={(b, e) => {
                  e.stopPropagation();
                  setBrandToDelete(b);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Simple Edit / Upload Modal */}
      {isAdmin && editingBrand && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingBrand(null)}
        >
          <div
            className="w-full max-w-md bg-[#0e1118] border border-[#b4935d]/50 rounded-2xl p-6 shadow-2xl shadow-black text-[#eee7db] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#222736] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#b4935d]/15 border border-[#b4935d]/40 text-[#b4935d]">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-medium text-[#eee7db]">
                  {isNewBrand ? '添加品牌' : '编辑品牌'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                className="p-1.5 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrandForm} className="space-y-4 text-xs">
              {/* 1. Upload Logo Photo */}
              <div>
                <label className="block text-[#a89f91] mb-1.5 font-medium">品牌 Logo 图片</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#06080c] border border-[#262c3d] flex items-center justify-center p-1.5 overflow-hidden">
                    {editingBrand.logoUrl ? (
                      <img src={editingBrand.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#454c5e]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181d28] hover:bg-[#b4935d] hover:text-[#08090c] text-[#eee7db] border border-[#2a3144] hover:border-[#b4935d] cursor-pointer transition-colors text-xs font-medium">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessingImage ? '处理中...' : '选择本地 Logo 图片'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleModalImageFileChange}
                        disabled={isProcessingImage}
                      />
                    </label>
                    <p className="text-[10px] text-[#6d7588] mt-1">支持 PNG, JPG, WebP 格式图片</p>
                  </div>
                </div>
              </div>

              {/* 2. Brand Name */}
              <div>
                <label className="block text-[#a89f91] mb-1.5 font-medium">品牌名称 *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  placeholder="例如：保利发展控股 / Poliform"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#080a0f] border border-[#262c3d] focus:border-[#b4935d] text-[#eee7db] outline-none text-xs"
                />
              </div>

              {/* 3. English Name / Short Symbol */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a89f91] mb-1.5 font-medium">英文名称</label>
                  <input
                    type="text"
                    value={editingBrand.enName || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, enName: e.target.value })}
                    placeholder="POLY DEVELOPMENTS"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#080a0f] border border-[#262c3d] focus:border-[#b4935d] text-[#eee7db] outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#a89f91] mb-1.5 font-medium">分类类别</label>
                  <input
                    type="text"
                    value={editingBrand.category || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, category: e.target.value })}
                    placeholder="例如：头部央企地产 / 顶奢家居"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#080a0f] border border-[#262c3d] focus:border-[#b4935d] text-[#eee7db] outline-none text-xs"
                  />
                </div>
              </div>

              {/* 4. Highlight Project */}
              <div>
                <label className="block text-[#a89f91] mb-1.5 font-medium">合作代表作 / 简介备注</label>
                <input
                  type="text"
                  value={editingBrand.highlightProject || ''}
                  onChange={(e) => setEditingBrand({ ...editingBrand, highlightProject: e.target.value })}
                  placeholder="例如：保利 · 天悦顶层复式全案"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#080a0f] border border-[#262c3d] focus:border-[#b4935d] text-[#eee7db] outline-none text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222736]">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 rounded-xl bg-[#141722] text-[#8e877a] hover:text-[#eee7db] text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#b4935d]/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存信息</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {brandToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setBrandToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0e1118] border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-black text-[#eee7db] relative text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-[#eee7db]">确认删除该品牌？</h3>
            <p className="text-xs text-[#8e877a]">
              即将移除品牌「<span className="text-[#eee7db] font-medium">{brandToDelete.name}</span>」，此操作将立即更新前台展示。
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#141722] text-[#8e877a] hover:text-[#eee7db] text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-red-600/30"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0e1118] border border-[#b4935d]/40 rounded-2xl p-6 shadow-2xl shadow-black text-[#eee7db] relative text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d] flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-[#eee7db]">恢复默认合作品牌？</h3>
            <p className="text-xs text-[#8e877a]">
              此操作将恢复包含保利、华润、万科、招商蛇口等在内的经典头部品牌名录。
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#141722] text-[#8e877a] hover:text-[#eee7db] text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4 py-2 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] text-xs font-semibold cursor-pointer shadow-lg shadow-[#b4935d]/20"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

