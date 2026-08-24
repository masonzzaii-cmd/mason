import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Compass, Award, User, QrCode, RotateCw, Camera, Upload, RefreshCw, Sparkles, Check, Lock } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  fetchSiteContent,
  upsertSiteContent,
  uploadAssetToStorage,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

export const LanyardCard: React.FC = () => {
  const { isAdmin, openLoginModal, showToast } = useAdmin();
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imgScale, setImgScale] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'closeup'>('cover');

  // Default photo paths with anti-cache query
  const DEFAULT_PHOTO = '/mason-portrait.jpg?v=' + Date.now();
  const DEFAULT_QR = '/wechat-qr.png';

  // Photo state with Supabase & localStorage persistence
  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mason_custom_portrait');
      return saved || DEFAULT_PHOTO;
    } catch {
      return DEFAULT_PHOTO;
    }
  });

  // QR Code state with Supabase & localStorage persistence
  const [qrUrl, setQrUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mason_custom_qr');
      return saved || DEFAULT_QR;
    } catch {
      return DEFAULT_QR;
    }
  });

  // Load cloud photo and QR on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cloudPhoto = await fetchSiteContent('about', 'photo');
        if (isMounted && cloudPhoto && cloudPhoto.trim()) {
          setPhotoUrl(cloudPhoto.trim());
          try {
            localStorage.setItem('mason_custom_portrait', cloudPhoto.trim());
          } catch (e) {}
        }

        const cloudQr = await fetchSiteContent('about', 'qr');
        if (isMounted && cloudQr && cloudQr.trim()) {
          setQrUrl(cloudQr.trim());
          try {
            localStorage.setItem('mason_custom_qr', cloudQr.trim());
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Failed to load cloud photo from Supabase:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotX = -((e.clientY - centerY) / (rect.height / 2)) * 12;
    const rotY = ((e.clientX - centerX) / (rect.width / 2)) * 12;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Handle portrait image file selection and upload to Supabase
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件（JPG, PNG, WEBP等）');
      return;
    }

    // 1. Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPhotoUrl(result);
        try {
          localStorage.setItem('mason_custom_portrait', result);
        } catch {}
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to Supabase Storage assets bucket and update site_content table
    if (isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadAssetToStorage(file, 'mason_portrait');
        if (publicUrl) {
          setPhotoUrl(publicUrl);
          try {
            localStorage.setItem('mason_custom_portrait', publicUrl);
          } catch {}
          await upsertSiteContent('about', 'photo', publicUrl);
          showToast('☁️ 3D 卡片照片已成功上传至 Supabase Storage assets 存储桶并保存！');
        }
      } catch (err: any) {
        console.error('Supabase photo upload error:', err);
        showToast(`⚠️ 图片已保存在本地，云端上传提示: ${err?.message || '请检查 assets 桶'}`);
      }
    } else {
      showToast('3D 卡片照片已更新至本地！');
    }

    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2500);
  };

  // Handle QR code image file selection and upload to Supabase
  const processQrFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件（JPG, PNG, WEBP等）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setQrUrl(result);
        try {
          localStorage.setItem('mason_custom_qr', result);
        } catch {}
      }
    };
    reader.readAsDataURL(file);

    if (isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadAssetToStorage(file, 'mason_wechat_qr');
        if (publicUrl) {
          setQrUrl(publicUrl);
          try {
            localStorage.setItem('mason_custom_qr', publicUrl);
          } catch {}
          await upsertSiteContent('about', 'qr', publicUrl);
          showToast('☁️ 微信二维码已成功上传至 Supabase Storage assets 桶并保存！');
        }
      } catch (err: any) {
        console.error('Supabase QR upload error:', err);
      }
    }

    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2500);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleQrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processQrFile(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (isFlipped) {
        processQrFile(file);
      } else {
        processFile(file);
      }
    }
  };

  const handleResetPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setPhotoUrl(DEFAULT_PHOTO);
    setImgScale(1);
    try {
      localStorage.removeItem('mason_custom_portrait');
    } catch {
      // ignore
    }
  };

  const handleResetQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setQrUrl(DEFAULT_QR);
    try {
      localStorage.removeItem('mason_custom_qr');
    } catch {
      // ignore
    }
  };

  const triggerFilePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    fileInputRef.current?.click();
  };

  const triggerQrFilePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    qrInputRef.current?.click();
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-4 select-none max-w-full">
      {/* Hidden File Input for Avatar Photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden File Input for QR Code */}
      <input
        type="file"
        ref={qrInputRef}
        onChange={handleQrInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Action Control Bar */}
      <div className="flex items-center justify-center gap-2 mb-4 bg-[#0d1017]/90 px-4 py-2 rounded-2xl border border-[#b4935d]/40 shadow-2xl z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(false);
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-orbitron tracking-wider transition-all cursor-pointer ${
            !isFlipped
              ? 'bg-[#b4935d] text-[#050608] font-bold shadow-md'
              : 'text-[#a09483] hover:text-[#f5ebd9]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Front Card</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(true);
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-orbitron tracking-wider transition-all cursor-pointer ${
            isFlipped
              ? 'bg-[#b4935d] text-[#050608] font-bold shadow-md'
              : 'text-[#a09483] hover:text-[#f5ebd9]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>WeChat QR Code</span>
        </button>
      </div>

      {/* Upload Notification Banner */}
      {uploadSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-3 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-orbitron flex items-center gap-1.5 shadow-lg z-30"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>个人照片已成功同步更新并保存！</span>
        </motion.div>
      )}

      {/* Lanyard Rope */}
      <div className="relative w-32 h-16 pointer-events-none z-10 flex flex-col items-center justify-start -mb-8">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80">
          <path
            d="M 20 -40 Q 50 60 80 -40"
            fill="none"
            stroke="url(#strapGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="strapGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b4935d" />
              <stop offset="50%" stopColor="#d4b47d" />
              <stop offset="100%" stopColor="#8c6d3b" />
            </linearGradient>
          </defs>
        </svg>
        {/* Metallic Clip */}
        <div className="absolute top-8 w-6 h-6 bg-gradient-to-b from-[#3a3225] via-[#1a1610] to-[#0d0a07] border border-[#b4935d]/60 rounded-sm shadow-md flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full border border-[#b4935d]/80 bg-[#050608]" />
        </div>
      </div>

      {/* 3D Card Stage */}
      <div
        className="relative w-80 h-[550px] sm:w-[340px] sm:h-[570px] cursor-pointer group"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={toggleFlip}
      >
        {/* Animated Inner Card with Framer Motion */}
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: (isFlipped ? 180 : 0) + tilt.y,
            rotateX: tilt.x,
          }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 20,
            mass: 0.8,
          }}
        >
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14161a] via-[#0d0f12] to-[#060709] border text-[#eee7db] p-5 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(180,147,93,0.08)] transition-all duration-300 ${
              isDragging
                ? 'border-emerald-400 border-2 bg-[#0d141d]'
                : 'border-[#b4935d]/30'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header area */}
            <div className="flex justify-between items-center border-b border-[#b4935d]/20 pb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#b4935d] animate-pulse" />
                <span className="font-orbitron text-[10px] tracking-widest text-[#d8be92] uppercase font-semibold">
                  MASON DESIGN
                </span>
              </div>
              <span className="font-orbitron text-[9px] tracking-wider text-[#8e8577]">
                VIP PASS
              </span>
            </div>

            {/* Photo Section & Card Header */}
            <div className="flex flex-col items-center my-auto">
              <div className="relative my-2 w-full flex flex-col items-center">
                {/* Main Photo Frame (Optimized 2:3 Vertical Aspect Ratio) */}
                <div
                  onClick={triggerFilePicker}
                  className={`relative w-[210px] h-[300px] sm:w-[225px] sm:h-[320px] rounded-xl overflow-hidden border-2 transition-all duration-300 group/photo shadow-2xl bg-[#080808] flex items-center justify-center cursor-pointer ${
                    isDragging
                      ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105'
                      : 'border-[#b4935d]/50 hover:border-[#b4935d] hover:shadow-[#b4935d]/20'
                  }`}
                  title="点击或拖拽照片更换个人形象照"
                >
                  <img
                    src={photoUrl}
                    alt="MASON 个人照片"
                    style={{ transform: `scale(${imgScale})` }}
                    className={`w-full h-full transition-all duration-500 filter saturate-[1.08] contrast-[1.05] group-hover/photo:scale-105 ${
                      fitMode === 'contain'
                        ? 'object-contain bg-[#060709]'
                        : fitMode === 'closeup'
                        ? 'object-cover object-[center_5%] scale-125'
                        : 'object-cover object-[center_10%]'
                    }`}
                    onError={(e) => {
                      // Fallback if custom image breaks
                      (e.target as HTMLImageElement).src = DEFAULT_PHOTO;
                    }}
                  />

                  {/* Gradient Shadow Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                  {/* Hover Upload Overlay Button (Admin Only) */}
                  {isAdmin && (
                    <div className="absolute inset-0 bg-[#080808]/70 backdrop-blur-[2px] opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <div className="p-2.5 rounded-full bg-[#b4935d] text-[#050608] shadow-lg">
                        <Upload className="w-5 h-5 animate-bounce" />
                      </div>
                      <span className="text-xs font-orbitron font-bold text-[#f2dfbf] tracking-wider">
                        点击上传/更换照片
                      </span>
                      <span className="text-[10px] text-[#a89d8c]">
                        支持拖拽本地图片文件
                      </span>
                    </div>
                  )}

                  {/* Drag and Drop Active Overlay (Admin Only) */}
                  {isAdmin && isDragging && (
                    <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-emerald-300 font-orbitron text-xs">
                      <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span>释放以设定为此照片</span>
                    </div>
                  )}

                </div>

                {/* Quick Photo Scale / Switch Controls under image */}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[#a89d8c]">
                  {isAdmin && (
                    <>
                      <button
                        onClick={triggerFilePicker}
                        className="flex items-center gap-1 hover:text-[#b4935d] transition-colors cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-[#b4935d]" />
                        <span>更换照片</span>
                      </button>
                      <span className="text-[#3a342b]">|</span>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitMode((m) => (m === 'cover' ? 'contain' : m === 'contain' ? 'closeup' : 'cover'));
                    }}
                    className="flex items-center gap-1 hover:text-[#f2dfbf] transition-colors cursor-pointer"
                    title="照片呈现方式切换"
                  >
                    <span>裁切: {fitMode === 'cover' ? '半身(填充)' : fitMode === 'contain' ? '全景(无裁)' : '特写'}</span>
                  </button>
                </div>
              </div>

              <h3 className="font-orbitron text-xl font-bold text-[#f5ebd9] tracking-wider mt-1">
                MASON
              </h3>
              <p className="text-xs text-[#b4935d] font-medium tracking-wide">
                资深软装设计师
              </p>
            </div>

            {/* Specs / Tags */}
            <div className="space-y-1.5 border-t border-b border-[#b4935d]/15 py-2.5 text-[10px] text-[#a9a093]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[#7a7267]">
                  <Award className="w-3 h-3 text-[#b4935d]" /> 行业资历
                </span>
                <span className="text-[#e2d5c1] font-semibold">7年室内软装设计</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[#7a7267]">
                  <MapPin className="w-3 h-3 text-[#b4935d]" /> 常驻工作地
                </span>
                <span className="text-[#e2d5c1]">中国 · 广东佛山</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[#7a7267]">
                  <Compass className="w-3 h-3 text-[#b4935d]" /> 专长领域
                </span>
                <span className="text-[#e2d5c1]">样板间 / 别墅私宅 / 商业展厅</span>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between text-[9px] text-[#7a7267]">
              <span className="font-orbitron tracking-widest">VERIFIED CREATIVE</span>
              <span className="px-2.5 py-1 rounded-full bg-[#b4935d]/20 text-[#d8be92] border border-[#b4935d]/40 font-orbitron flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-[#b4935d]" /> 点击翻转名片
              </span>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14161a] via-[#0d0f12] to-[#060709] border border-[#b4935d]/30 text-[#eee7db] p-5 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(180,147,93,0.08)]"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
            }}
          >
            {/* Header area */}
            <div className="flex justify-between items-center border-b border-[#b4935d]/20 pb-2">
              <span className="font-orbitron text-[10px] tracking-widest text-[#f2dfbf] uppercase font-semibold">
                WECHAT CONNECT
              </span>
              <span className="font-orbitron text-[9px] text-[#7a7267]">CARD REVERSE</span>
            </div>

            {/* QR Code Content */}
            <div className="my-auto flex flex-col items-center text-center">
              <div className="bg-[#13151a] px-3 py-1.5 rounded-lg border border-[#b4935d]/20 mb-3 text-[11px] text-[#c9bea8] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#b4935d]" />
                <span>857422610@qq.com</span>
              </div>

              {/* QR Code Frame with Hover Mask & Upload Capabilities */}
              <div
                onClick={triggerQrFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-44 h-44 bg-white rounded-xl p-2 border-2 transition-all duration-300 shadow-xl flex items-center justify-center cursor-pointer group/qr ${
                  isDragging
                    ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105'
                    : 'border-[#b4935d]/60 hover:border-[#b4935d] hover:shadow-[#b4935d]/30'
                }`}
                title="Click or drag to update WeChat QR Code / Image"
              >
                <img
                  src={qrUrl}
                  alt="MASON WeChat QR Code"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/wechat-qr.svg';
                  }}
                />

                {/* Elegant Hover Overlay Mask (Admin Only) */}
                {isAdmin && (
                  <div className="absolute inset-0 bg-[#080808]/85 backdrop-blur-[2px] opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 text-center rounded-xl border border-[#b4935d]/40">
                    <div className="p-2 rounded-full bg-[#b4935d] text-[#050608] shadow-lg">
                      <Upload className="w-5 h-5 animate-bounce" />
                    </div>
                    <span className="text-xs font-orbitron font-bold text-[#f2dfbf] tracking-wider">
                      CLICK / DRAG TO CHANGE QR
                    </span>
                    <span className="text-[10px] text-[#a89d8c]">
                      Upload custom WeChat QR or image
                    </span>
                  </div>
                )}

                {/* Drag and Drop Active Overlay (Admin Only) */}
                {isAdmin && isDragging && (
                  <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-emerald-300 font-orbitron text-xs rounded-xl border border-emerald-400">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>RELEASE TO UPDATE QR CODE</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={triggerQrFilePicker}
                    className="flex items-center gap-1 text-[10px] text-[#b4935d] hover:text-[#f2dfbf] transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>CHANGE QR</span>
                  </button>
                  {qrUrl !== DEFAULT_QR && (
                    <>
                      <span className="text-[#3a342b] text-[10px]">|</span>
                      <button
                        onClick={handleResetQr}
                        className="flex items-center gap-1 text-[10px] text-[#a89d8c] hover:text-[#f2dfbf] transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-[#b4935d]" />
                        <span>RESET QR</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              <p className="text-[10px] text-[#c5b59a] mt-2 font-orbitron tracking-wider font-semibold">
                SCAN TO CONNECT WECHAT
              </p>
            </div>

            <div className="text-center border-t border-[#b4935d]/20 pt-3 text-[9px] text-[#7a7267] flex items-center justify-between">
              <span>MASON portfolio © 2026</span>
              <span className="px-2.5 py-1 rounded-full bg-[#b4935d]/20 text-[#d8be92] border border-[#b4935d]/40 font-orbitron flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-[#b4935d]" /> 点击翻看正面
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LanyardCard;
