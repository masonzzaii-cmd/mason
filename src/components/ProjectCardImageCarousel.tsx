import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Building, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardImageCarouselProps {
  project: Project;
  isAdmin?: boolean;
  onOpenProject: (project: Project) => void;
  onOpenEdit?: (project: Project) => void;
  onRequestDelete?: (project: Project) => void;
}

export const ProjectCardImageCarousel: React.FC<ProjectCardImageCarouselProps> = ({
  project,
  isAdmin = false,
  onOpenProject,
  onOpenEdit,
  onRequestDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Combine cover image with gallery images without duplicates
  const images = useMemo(() => {
    const list: string[] = [];
    if (project.imageUrl && project.imageUrl.trim()) {
      list.push(project.imageUrl.trim());
    }
    if (Array.isArray(project.galleryImages)) {
      project.galleryImages.forEach((img) => {
        if (img && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list.length > 0
      ? list
      : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'];
  }, [project.imageUrl, project.galleryImages]);

  const total = images.length;

  const handlePrev = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance) {
      // Swiped Left -> Next
      handleNext(e);
    } else if (diff < -minSwipeDistance) {
      // Swiped Right -> Prev
      handlePrev(e);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative h-56 sm:h-60 w-full overflow-hidden bg-[#12141a] select-none group/carousel cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onOpenProject(project)}
    >
      {/* Images Slider Container */}
      <div className="w-full h-full relative overflow-hidden">
        {images.map((imgUrl, idx) => (
          <div
            key={`${imgUrl}-${idx}`}
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              idx === currentIndex
                ? 'opacity-100 scale-100 z-0'
                : 'opacity-0 scale-105 pointer-events-none z-0'
            }`}
          >
            <img
              src={imgUrl}
              alt={`${project.title} - 实景照片 ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-all duration-700 ease-out"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        ))}
      </div>

      {/* Subtle Bottom & Top Dark Gradient Overlays for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-transparent to-black/30 pointer-events-none z-[1]" />

      {/* Top Left Badges: Project Number & Category */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#b4935d]/40 font-orbitron text-[10px] text-[#b4935d] font-semibold tracking-wider shadow-sm">
          NO. {project.number}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-orbitron text-[#c2b5a1] border border-white/10">
          {project.category}
        </span>
      </div>

      {/* Top Right: Image Counter Badge & Admin Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {/* Photo Counter Pill (shown if 2+ photos) */}
        {total > 1 && (
          <div
            className={`px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-[#b4935d]/30 text-[#d8c39e] text-[10px] font-orbitron flex items-center gap-1 transition-opacity duration-300 ${
              isHovered || total > 1 ? 'opacity-100' : 'opacity-80'
            }`}
            title="左右滑动或点击箭头切换落地照片"
          >
            <ImageIcon className="w-2.5 h-2.5 text-[#b4935d]" />
            <span>
              {currentIndex + 1}/{total}
            </span>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit?.(project);
              }}
              className="p-1.5 rounded-full bg-black/80 hover:bg-[#b4935d] border border-[#b4935d]/40 hover:border-[#b4935d] text-[#c2b5a1] hover:text-[#08090c] transition-all shadow-md cursor-pointer"
              title="编辑项目信息与落地照片"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete?.(project);
              }}
              className="p-1.5 rounded-full bg-black/80 hover:bg-red-600 border border-white/10 hover:border-red-500 text-[#c2b5a1] hover:text-white transition-all shadow-md cursor-pointer"
              title="删除此代表作"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Left Navigation Chevron Button (if multiple images) */}
      {total > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Photo"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-[#b4935d] text-[#eee7db] hover:text-[#08090c] backdrop-blur-md border border-white/15 hover:border-[#b4935d] flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 sm:opacity-0 focus:opacity-100 z-20 shadow-lg cursor-pointer hover:scale-110"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Right Navigation Chevron Button (if multiple images) */}
      {total > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Photo"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-[#b4935d] text-[#eee7db] hover:text-[#08090c] backdrop-blur-md border border-white/15 hover:border-[#b4935d] flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 sm:opacity-0 focus:opacity-100 z-20 shadow-lg cursor-pointer hover:scale-110"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Floating Bar: Brand & Year */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-orbitron text-[#d6c7b2] bg-black/65 backdrop-blur-md px-2.5 py-1.2 rounded-lg border border-white/10 z-10">
        <span className="flex items-center gap-1.5 truncate max-w-[150px]">
          <Building className="w-3 h-3 text-[#b4935d] shrink-0" />
          <span className="truncate">{project.brand}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0 text-[#b4935d]">
          <Calendar className="w-3 h-3" />
          <span>{project.year}</span>
        </span>
      </div>

      {/* Carousel Progress Indicator Dots (Bottom center above brand bar on hover) */}
      {total > 1 && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 transition-opacity duration-300 opacity-0 group-hover/carousel:opacity-100">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              className={`rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-3 h-1 bg-[#b4935d] shadow-[0_0_8px_rgba(180,147,93,0.8)]'
                  : 'w-1 h-1 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Jump to photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
