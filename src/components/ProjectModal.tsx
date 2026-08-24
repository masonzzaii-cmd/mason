import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Layers,
  Sparkles,
  Building,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  ChevronRight,
  ZoomIn,
  Trash2,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onOpenGallery?: (project: Project, initialIndex?: number) => void;
  onOpenPdf?: (project: Project) => void;
  onOpenEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onOpenGallery,
  onOpenPdf,
  onOpenEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'pdf'>('overview');

  if (!project) return null;

  const galleryList = project.galleryImages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0a0c10] border border-[#b4935d]/40 rounded-2xl shadow-2xl z-10 text-[#eee7db] p-5 sm:p-8 flex flex-col justify-between custom-scrollbar">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1c202a] mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#b4935d]/15 border border-[#b4935d]/40 text-[#b4935d] font-orbitron text-xs font-semibold">
              PROJECT NO. {project.number}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#181b24] border border-[#2b3040] text-xs text-[#c2b5a1]">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                onClick={() => onOpenEdit(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#b4935d] border border-[#2b3040] hover:border-[#b4935d] text-xs text-[#c2b5a1] hover:text-[#08090c] font-orbitron font-medium transition-all cursor-pointer"
                title="编辑此项目信息"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">编辑项目</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => {
                  onDelete(project);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/70 border border-red-800/50 hover:border-red-600 text-xs text-red-300 hover:text-white font-orbitron font-medium transition-all cursor-pointer"
                title="删除此代表作"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">删除</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 border border-white/10 text-[#eee7db] hover:text-[#b4935d] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="关闭详情"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          {/* Main Title & Brand Header */}
          <div className="space-y-2 mb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-orbitron text-[#b4935d]">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 服务品牌：
                <strong className="text-[#eee7db] font-normal">{project.brand}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 项目年份：
                <strong className="text-[#eee7db] font-normal">{project.year}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-[#f5ebd9] tracking-wide leading-snug">
              {project.title}
            </h2>
          </div>

          {/* Quick Tabs Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#12151e] border border-[#222734] mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-orbitron font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#b4935d] text-[#08090c] shadow-md shadow-[#b4935d]/20 font-semibold'
                  : 'text-[#8e877a] hover:text-[#eee7db]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>方案概述与工艺</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-orbitron font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'gallery'
                  ? 'bg-[#b4935d] text-[#08090c] shadow-md shadow-[#b4935d]/20 font-semibold'
                  : 'text-[#8e877a] hover:text-[#eee7db]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>落地实景照片{galleryList.length > 0 ? ` (${galleryList.length})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-orbitron font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'pdf'
                  ? 'bg-[#b4935d] text-[#08090c] shadow-md shadow-[#b4935d]/20 font-semibold'
                  : 'text-[#8e877a] hover:text-[#eee7db]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>方案 PDF 文档</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Cover Banner */}
              <div
                onClick={() => onOpenGallery && onOpenGallery(project, 0)}
                className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 bg-[#12151e]"
              >
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-orbitron tracking-widest text-[#b4935d] uppercase">
                      COVER IMAGE
                    </span>
                    <p className="text-xs text-[#eee7db] font-medium line-clamp-1">{project.title}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/70 border border-[#b4935d]/40 text-xs text-[#eee7db] font-orbitron">
                    <ZoomIn className="w-3.5 h-3.5 text-[#b4935d]" />
                    <span>查看全案图集</span>
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#12151e] border border-[#232734] text-xs">
                <div>
                  <span className="text-[#888177] flex items-center gap-1 mb-1 font-orbitron">
                    <Building className="w-3.5 h-3.5 text-[#b4935d]" /> 服务品牌
                  </span>
                  <p className="text-[#e2d5c1] font-semibold truncate">{project.brand}</p>
                </div>
                <div>
                  <span className="text-[#888177] flex items-center gap-1 mb-1 font-orbitron">
                    <Calendar className="w-3.5 h-3.5 text-[#b4935d]" /> 年份日期
                  </span>
                  <p className="text-[#e2d5c1] font-semibold">{project.year}</p>
                </div>
                <div>
                  <span className="text-[#888177] flex items-center gap-1 mb-1 font-orbitron">
                    <MapPin className="w-3.5 h-3.5 text-[#b4935d]" /> 项目地点
                  </span>
                  <p className="text-[#e2d5c1] font-semibold">{project.location}</p>
                </div>
                <div>
                  <span className="text-[#888177] flex items-center gap-1 mb-1 font-orbitron">
                    <Layers className="w-3.5 h-3.5 text-[#b4935d]" /> 方案类别
                  </span>
                  <p className="text-[#e2d5c1] font-semibold">{project.category}</p>
                </div>
              </div>

              {/* Scheme Overview */}
              <div className="space-y-3">
                <h3 className="text-xs font-orbitron tracking-wider text-[#b4935d] uppercase">
                  SCHEME OVERVIEW / 方案概述
                </h3>
                <p className="text-xs sm:text-sm text-[#b8b0a5] leading-relaxed bg-[#12151e]/50 p-4 rounded-xl border border-[#202430]">
                  {project.details}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-4 animate-fade-in">
              {galleryList.length === 0 ? (
                <div className="py-16 px-6 rounded-xl bg-[#12151e]/50 border border-[#202430] text-center space-y-3">
                  <ImageIcon className="w-10 h-10 text-[#545048] mx-auto" />
                  <p className="text-sm text-[#8e877a]">该项目暂未上传落地实景照片</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8e877a]">
                      点击任意照片即可调出高清全屏画廊浏览实景落地细节
                    </p>
                    <button
                      onClick={() => onOpenGallery && onOpenGallery(project, 0)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b4935d] text-[#08090c] text-xs font-orbitron font-semibold hover:bg-[#c8a873] transition-all"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>全屏查看实景图集 ({galleryList.length})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {galleryList.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenGallery && onOpenGallery(project, idx)}
                        className="relative group rounded-xl overflow-hidden aspect-video bg-[#12151e] border border-[#232734] cursor-pointer hover:border-[#b4935d]/50 transition-all shadow-md"
                      >
                        <img
                          src={img}
                          alt={`${project.title} 实景照片 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-full bg-black/80 border border-[#b4935d]/60 text-xs text-[#eee7db] flex items-center gap-1.5">
                            <ZoomIn className="w-3.5 h-3.5 text-[#b4935d]" />
                            <span>放大浏览照片 0{idx + 1}</span>
                          </span>
                        </div>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-orbitron text-[#c2b5a1]">
                          落地照片 0{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 3: PDF Viewer */}
          {activeTab === 'pdf' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#12151e] border border-[#232734]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#b4935d]/10 text-[#b4935d] border border-[#b4935d]/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#eee7db]">
                      {project.pdfFileName || `${project.title}-方案汇报.pdf`}
                    </h4>
                    <p className="text-[11px] text-[#8e877a]">
                      服务品牌：{project.brand} · 年份：{project.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={project.pdfUrl || '/陈梅生-资深软装设计师-个人简历.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-[#181b24] hover:bg-[#252b3a] border border-[#2b3040] text-xs text-[#c2b5a1] hover:text-[#eee7db] font-orbitron font-medium transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>新窗口全屏</span>
                  </a>

                  <button
                    onClick={() => onOpenPdf && onOpenPdf(project)}
                    className="px-4 py-2 rounded-lg bg-[#b4935d] text-[#08090c] text-xs font-orbitron font-semibold hover:bg-[#c8a873] transition-all flex items-center gap-1.5 shadow-md shadow-[#b4935d]/20"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>大屏阅读器</span>
                  </button>
                </div>
              </div>

              {/* Embedded Frame */}
              <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#232734] bg-[#0d0f15]">
                <iframe
                  src={`${project.pdfUrl || '/陈梅生-资深软装设计师-个人简历.pdf'}#toolbar=0`}
                  title={project.title}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-[#1c202a] flex items-center justify-end gap-3">
          <button
            id="modal-browse-gallery-btn"
            onClick={() => onOpenGallery && onOpenGallery(project, 0)}
            className="px-4 py-2 rounded-xl bg-[#141720] hover:bg-[#1c202c] border border-[#282d3c] text-xs font-orbitron text-[#c2b5a1] hover:text-[#eee7db] transition-colors"
          >
            浏览落地照片
          </button>
          <button
            id="modal-close-return-btn"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#b4935d] text-[#050608] font-semibold text-xs font-orbitron hover:bg-[#cbb082] transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    </div>
  );
};
