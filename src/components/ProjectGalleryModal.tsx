import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Project } from '../types';

interface ProjectGalleryModalProps {
  project: Project | null;
  initialIndex?: number;
  onClose: () => void;
}

export const ProjectGalleryModal: React.FC<ProjectGalleryModalProps> = ({
  project,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, project]);

  if (!project) return null;

  const images = project.galleryImages && project.galleryImages.length > 0
    ? project.galleryImages
    : [project.imageUrl];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/92 backdrop-blur-xl animate-fade-in"
    >
      {/* Top Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-[#b4935d]/20 border border-[#b4935d]/40 text-[#b4935d] text-xs font-orbitron font-semibold">
            NO. {project.number} 落地实景
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-medium text-[#eee7db] truncate max-w-[200px] sm:max-w-md">
              {project.title}
            </h3>
            <p className="text-[11px] text-[#b4935d] font-orbitron">
              服务品牌：{project.brand} · 年份：{project.year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-orbitron text-[#c2b5a1]">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-[#b4935d] border border-white/20 hover:border-[#b4935d] text-[#eee7db] hover:text-[#08090c] transition-all"
            title="关闭照片预览 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[65vh] sm:h-[75vh] flex items-center justify-center select-none"
      >
        {/* Prev Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#b4935d] border border-white/20 hover:border-[#b4935d] text-[#eee7db] hover:text-[#08090c] transition-all z-20 shadow-xl"
            title="上一张 (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Current Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center p-2">
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${project.title} 落地实景 ${currentIndex + 1}`}
            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#b4935d] border border-white/20 hover:border-[#b4935d] text-[#eee7db] hover:text-[#08090c] transition-all z-20 shadow-xl"
            title="下一张 (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4 z-30"
        >
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 max-w-[90vw] overflow-x-auto custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  currentIndex === idx
                    ? 'border-[#b4935d] scale-105 shadow-md shadow-[#b4935d]/30'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`缩略图 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
