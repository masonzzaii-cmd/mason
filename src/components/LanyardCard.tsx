import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MapPin,
  Compass,
  Award,
  User,
  QrCode,
  RotateCw,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react';

export interface LanyardCardProps {
  initialPhotoUrl?: string;
  initialQrUrl?: string;
}

export const LanyardCard: React.FC<LanyardCardProps> = ({
  initialPhotoUrl = '/mason-portrait.jpg',
  initialQrUrl = '/wechat-qr.png',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imgScale, setImgScale] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'closeup'>('cover');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_portrait') || initialPhotoUrl;
    } catch {
      return initialPhotoUrl;
    }
  });

  const [qrUrl, setQrUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_qr') || initialQrUrl;
    } catch {
      return initialQrUrl;
    }
  });

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

  const processImageFile = (file: File, isQr = false) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件（JPG, PNG, WEBP等）');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (isQr) {
          setQrUrl(result);
          try {
            localStorage.setItem('custom_qr', result);
          } catch {}
        } else {
          setPhotoUrl(result);
          try {
            localStorage.setItem('custom_portrait', result);
          } catch {}
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, isFlipped);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-4 select-none max-w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0], false)}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={qrInputRef}
        onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0], true)}
        accept="image/*"
        className="hidden"
      />

      {uploadSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-3 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 shadow-lg z-30"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>图片已更新并保存至本地！</span>
        </motion.div>
      )}

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
        <div className="absolute top-8 w-6 h-6 bg-gradient-to-b from-[#3a3225] via-[#1a1610] to-[#0d0a07] border border-[#b4935d]/60 rounded-sm shadow-md flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full border border-[#b4935d]/80 bg-[#050608]" />
        </div>
      </div>

      <div
        className="relative w-80 h-[550px] sm:w-[340px] sm:h-[570px] cursor-pointer group"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={toggleFlip}
      >
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
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14161a] via-[#0d0f12] to-[#060709] border text-[#eee7db] p-5 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(180,147,93,0.08)] transition-all duration-300 ${
              isDragging
                ? 'border-emerald-400 border-2 bg-[#0d141d]'
                : 'border-[#b4935d]/30 hover:border-[#b4935d]/60'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center border-b border-[#b4935d]/20 pb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#b4935d] animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest text-[#d8be92] uppercase font-semibold">
                  MASON DESIGN
                </span>
              </div>
              <span className="font-mono text-[9px] tracking-wider text-[#8e8577]">
                VIP PASS
              </span>
            </div>

            <div className="flex flex-col items-center my-auto">
              <div className="relative my-2 w-full flex flex-col items-center">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={`relative w-[210px] h-[300px] sm:w-[225px] sm:h-[320px] rounded-xl overflow-hidden border-2 transition-all duration-300 group/photo shadow-2xl bg-[#080808] flex items-center justify-center cursor-pointer ${
                    isDragging
                      ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105'
                      : 'border-[#b4935d]/50 hover:border-[#b4935d]'
                  }`}
                  title="点击或拖拽更换肖像照片"
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
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent opacity-60 pointer-events-none" />

                  <div className="absolute inset-0 bg-[#080808]/70 backdrop-blur-[2px] opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 text-center">
                    <div className="p-2.5 rounded-full bg-[#b4935d] text-[#050608] shadow-lg">
                      <Upload className="w-5 h-5 animate-bounce" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#f2dfbf] tracking-wider">
                      点击更换肖像照片
                    </span>
                    <span className="text-[10px] text-[#a89d8c]">
                      支持拖拽本地图片放入
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-[#a89d8c]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1 hover:text-[#b4935d] transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-[#b4935d]" />
                    <span>更换照片</span>
                  </button>
                  <span className="text-[#3a342b]">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitMode((m) => (m === 'cover' ? 'contain' : m === 'contain' ? 'closeup' : 'cover'));
                    }}
                    className="flex items-center gap-1 hover:text-[#f2dfbf] transition-colors cursor-pointer"
                  >
                    <span>裁切: {fitMode === 'cover' ? '半身(填充)' : fitMode === 'contain' ? '全景(无裁)' : '特写'}</span>
                  </button>
                </div>
              </div>

              <h3 className="font-mono text-xl font-bold text-[#f5ebd9] tracking-wider mt-1">
                MASON
              </h3>
              <p className="text-xs text-[#b4935d] font-medium tracking-wide">
                资深软装设计师
              </p>
            </div>

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

            <div className="flex items-center justify-between text-[9px] text-[#7a7267]">
              <span className="font-mono tracking-widest">VERIFIED CREATIVE</span>
              <span className="px-2.5 py-1 rounded-full bg-[#b4935d]/20 text-[#d8be92] border border-[#b4935d]/40 font-mono flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-[#b4935d]" /> 点击翻转名片
              </span>
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14161a] via-[#0d0f12] to-[#060709] border border-[#b4935d]/30 text-[#eee7db] p-5 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(180,147,93,0.08)]"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
            }}
          >
            <div className="flex justify-between items-center border-b border-[#b4935d]/20 pb-2">
              <span className="font-mono text-[10px] tracking-widest text-[#f2dfbf] uppercase font-semibold">
                WECHAT CONNECT
              </span>
              <span className="font-mono text-[9px] text-[#7a7267]">CARD REVERSE</span>
            </div>

            <div className="my-auto flex flex-col items-center text-center">
              <div className="bg-[#13151a] px-3 py-1.5 rounded-lg border border-[#b4935d]/20 mb-3 text-[11px] text-[#c9bea8] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#b4935d]" />
                <span>857422610@qq.com</span>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  qrInputRef.current?.click();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-44 h-44 bg-white rounded-xl p-2 border-2 transition-all duration-300 shadow-xl flex items-center justify-center cursor-pointer group/qr ${
                  isDragging
                    ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105'
                    : 'border-[#b4935d]/60 hover:border-[#b4935d]'
                }`}
                title="点击或拖拽更换微信二维码"
              >
                <img
                  src={qrUrl}
                  alt="微信二维码"
                  className="w-full h-full object-contain rounded-lg"
                />

                <div className="absolute inset-0 bg-[#080808]/85 backdrop-blur-[2px] opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 text-center rounded-xl border border-[#b4935d]/40">
                  <div className="p-2 rounded-full bg-[#b4935d] text-[#050608] shadow-lg">
                    <Upload className="w-5 h-5 animate-bounce" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#f2dfbf] tracking-wider">
                    点击更换微信二维码
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#c5b59a] mt-3 font-mono tracking-wider font-semibold">
                SCAN TO CONNECT WECHAT
              </p>
            </div>

            <div className="text-center border-t border-[#b4935d]/20 pt-3 text-[9px] text-[#7a7267] flex items-center justify-between">
              <span>MASON portfolio © 2026</span>
              <span className="px-2.5 py-1 rounded-full bg-[#b4935d]/20 text-[#d8be92] border border-[#b4935d]/40 font-mono flex items-center gap-1">
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
