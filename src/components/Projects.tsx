import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { DEFAULT_PROJECTS_LIST } from '../data/projectsData';
import { ProjectModal } from './ProjectModal';
import { ProjectGalleryModal } from './ProjectGalleryModal';
import { ProjectPdfModal } from './ProjectPdfModal';
import { ProjectEditModal } from './ProjectEditModal';
import { ProjectCardImageCarousel } from './ProjectCardImageCarousel';
import { useAdmin } from '../context/AdminContext';
import {
  fetchSectionData,
  saveSectionData,
} from '../utils/supabaseClient';
import { sortProjectsByDateDesc } from '../utils/projectSorter';
import {
  Calendar,
  Building,
  FileText,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  Eye,
  Check,
  ZoomIn,
  Layers,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const STORAGE_KEY = 'mason_portfolio_projects_v2';

// Sub-component: Magnetic Spotlight & 3D Tilt Project Card
const MagneticProjectCard: React.FC<{
  project: Project;
  isAdmin: boolean;
  onOpenProject: (project: Project) => void;
  onOpenGallery: (project: Project, initialIndex: number) => void;
  onOpenPdf: (project: Project) => void;
  onOpenEdit: (project: Project) => void;
  onRequestDelete: (project: Project) => void;
}> = ({
  project,
  isAdmin,
  onOpenProject,
  onOpenGallery,
  onOpenPdf,
  onOpenEdit,
  onRequestDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; rotateX: number; rotateY: number }>({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;
    const maxTilt = 6;

    setMousePos({
      x,
      y,
      rotateX: -yPct * maxTilt,
      rotateY: xPct * maxTilt,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  };

  return (
    <div style={{ perspective: 1000 }} className="relative rounded-2xl select-none h-full flex flex-col">
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${mousePos.rotateX}deg) rotateY(${mousePos.rotateY}deg) translateZ(10px) translateY(-6px) scale3d(1.015, 1.015, 1.015)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(0px) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 0.08s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
            : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s ease, box-shadow 0.5s ease',
          boxShadow: isHovered
            ? '0 24px 45px -12px rgba(0, 0, 0, 0.95), 0 0 26px rgba(180, 147, 93, 0.22)'
            : '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
        className={`group bg-[#0d0f14] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between relative h-full w-full ${
          isHovered ? 'border-[#b4935d]/75' : 'border-[#22252c]'
        }`}
      >
        {/* Magnetic Spotlight Glow following cursor */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300 z-30"
            style={{
              background: `radial-gradient(340px circle at ${mousePos.x}px ${mousePos.y}px, rgba(210, 185, 138, 0.18), transparent 70%)`,
            }}
          />
        )}

        {/* Card Multi-photo Interactive Carousel */}
        <ProjectCardImageCarousel
          project={project}
          isAdmin={isAdmin}
          onOpenProject={onOpenProject}
          onOpenEdit={onOpenEdit}
          onRequestDelete={onRequestDelete}
        />

        {/* Card Main Info */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="min-h-[3rem] flex items-start">
            <h3
              onClick={() => onOpenProject(project)}
              className="text-base font-medium text-[#eee7db] leading-snug group-hover:text-[#f3e3ca] transition-colors line-clamp-2 cursor-pointer"
            >
              {project.title}
            </h3>
          </div>

          {/* Location & Tags row */}
          <div className="pt-2 border-t border-[#1b1e25] flex items-center justify-between text-[11px] text-[#787265]">
            <span>{project.location}</span>
            {project.galleryImages && project.galleryImages.length > 0 && (
              <span className="font-orbitron text-[#b4935d]">
                {project.galleryImages.length} 张落地照片
              </span>
            )}
          </div>

          {/* Action Buttons Toolbar for Each Card */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 mt-auto">
            {/* 1. 落地实景 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGallery(project, 0);
              }}
              className="py-1.5 px-2 rounded-lg bg-[#141720] hover:bg-[#b4935d] border border-[#262b3a] hover:border-[#b4935d] text-[11px] text-[#b4935d] hover:text-[#08090c] font-orbitron font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="浏览项目落地实景照片"
            >
              <ImageIcon className="w-3 h-3" />
              <span>实景照片</span>
            </button>

            {/* 2. 方案PDF */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPdf(project);
              }}
              className="py-1.5 px-2 rounded-lg bg-[#141722] hover:bg-[#b4935d] border border-[#262b3a] hover:border-[#b4935d] text-[11px] text-[#c2b5a1] hover:text-[#08090c] font-orbitron font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="在线浏览方案PDF"
            >
              <FileText className="w-3 h-3" />
              <span>方案PDF</span>
            </button>

            {/* 3. 完整详情 */}
            <button
              onClick={() => onOpenProject(project)}
              className="py-1.5 px-2 rounded-lg bg-[#1b1f2b] hover:bg-[#b4935d] text-[11px] text-[#eee7db] hover:text-[#08090c] font-orbitron font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="查看全案设计概述与工艺"
            >
              <Eye className="w-3 h-3" />
              <span>详情</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export const Projects: React.FC = () => {
  const { isAdmin, openPdfManager, refreshTrigger, showToast: triggerGlobalToast } = useAdmin();
  const [projects, setProjects] = useState<Project[]>(() => sortProjectsByDateDesc(DEFAULT_PROJECTS_LIST));

  // Async load from local cache on mount or refreshTrigger
  useEffect(() => {
    let isMounted = true;
    // 访客（非管理员）：直接使用代码中已固化的默认数据，确保国内秒开、内容确定
    if (!isAdmin) {
      setProjects(sortProjectsByDateDesc(DEFAULT_PROJECTS_LIST));
      return;
    }
    // 管理员：从本地 IndexedDB 读取编辑后的数据（不查云端，快且可靠）
    (async () => {
      try {
        const savedData = await fetchSectionData<Project[]>(
          'projects',
          'projects_list',
          STORAGE_KEY,
          DEFAULT_PROJECTS_LIST
        );
        if (isMounted && savedData && Array.isArray(savedData) && savedData.length > 0) {
          const sorted = sortProjectsByDateDesc(savedData);
          setProjects(sorted);
        }
      } catch (err) {
        console.warn('Projects load error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, isAdmin]);

  // Modals state
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [galleryProject, setGalleryProject] = useState<Project | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState<number>(0);
  const [pdfProject, setPdfProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('项目信息已成功保存并同步！');

  // Collapse / Expand state (Default to top 8 featured projects)
  const INITIAL_SHOW_COUNT = 8;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const displayedProjects = isExpanded ? projects : projects.slice(0, INITIAL_SHOW_COUNT);
  const hasMore = projects.length > INITIAL_SHOW_COUNT;

  const saveProjects = async (newList: Project[]) => {
    const sortedList = sortProjectsByDateDesc(newList);
    setProjects(sortedList);
    await saveSectionData<Project[]>('projects', 'projects_list', STORAGE_KEY, sortedList);
    triggerGlobalToast('✅ 项目代表作已保存到本地，刷新不丢！');
  };

  const handleExecuteReset = () => {
    saveProjects(DEFAULT_PROJECTS_LIST);
    setShowResetConfirm(false);
    setToastMessage('已恢复初始 20 套代表作数据！');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleAddNewProject = () => {
    if (!isAdmin) return;
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const newDraft: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      number: 'NEW',
      title: '新设计代表作项目名称',
      category: '别墅私宅',
      brand: '知名品牌 / 业主客户',
      year: `${currentYear}.${currentMonth}`,
      location: '中国 · 广东',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      description: '全案软装设计与实施落地，融合当代空间美学与高品质工艺，营造兼具艺术感染力与商业价值的高端空间体验。',
      details: '本案从建筑与自然光影的关系切入，通过极简利落的空间动线、定制化艺术家具、专属软装选型打样以及精细化施工验收，实现高还原度实景交付。',
      scope: ['全案软装设计深化', '定制家具选型与打样', '艺术装置与灯具选配', '现场陈设与摆场验收'],
      materials: ['天然奢石', '哑光金属', '进口棉麻', '艺术手工玻璃', '定制原木'],
      tags: ['商业空间', '售楼处', '高端软装', '全案落地'],
      galleryImages: [],
      pdfUrl: '',
      pdfFileName: '',
      gradient: 'bg-gradient-to-br from-[#191e28] via-[#0d1017] to-[#06080c]',
    };
    setIsCreatingNew(true);
    setEditingProject(newDraft);
  };

  const handleSaveProject = (updated: Project) => {
    let updatedList: Project[];
    const exists = projects.some((p) => p.id === updated.id);
    if (exists) {
      updatedList = projects.map((p) => (p.id === updated.id ? updated : p));
      setToastMessage('项目信息已成功保存并同步！');
    } else {
      updatedList = [updated, ...projects];
      setToastMessage(`代表作「${updated.title}」已成功添加并自动按年份排序！`);
    }

    const sortedList = sortProjectsByDateDesc(updatedList);
    saveProjects(sortedList);

    // If currently open in detail modal, update activeProject too
    if (activeProject && activeProject.id === updated.id) {
      const refreshedInList = sortedList.find((p) => p.id === updated.id) || updated;
      setActiveProject(refreshedInList);
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleRequestDelete = (project: Project) => {
    if (!isAdmin) return;
    setProjectToDelete(project);
  };

  const handleRequestDeleteById = (projectId: string) => {
    if (!isAdmin) return;
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      setProjectToDelete(target);
    }
  };

  const handleExecuteDelete = () => {
    if (!projectToDelete || !isAdmin) return;

    if (projects.length <= 1) {
      setToastMessage('作品库中至少需保留 1 套代表作！');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      setProjectToDelete(null);
      return;
    }

    const deletedTitle = projectToDelete.title;
    const deletedId = projectToDelete.id;
    const filtered = projects.filter((p) => p.id !== deletedId);
    const sortedList = sortProjectsByDateDesc(filtered);
    saveProjects(sortedList);

    if (activeProject && activeProject.id === deletedId) {
      setActiveProject(null);
    }
    if (editingProject && editingProject.id === deletedId) {
      setEditingProject(null);
    }

    setProjectToDelete(null);
    setToastMessage(`代表作「${deletedTitle}」已成功从作品库中移除！`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleOpenGallery = (project: Project, initialIndex = 0) => {
    setGalleryProject(project);
    setGalleryInitialIndex(initialIndex);
  };

  const handleOpenPdf = (project: Project) => {
    setPdfProject(project);
  };

  const handleOpenEdit = (project: Project) => {
    if (!isAdmin) return;
    setIsCreatingNew(false);
    setEditingProject(project);
  };

  return (
    <section id="projects" className="py-28 px-6 sm:px-12 bg-[#080a0c] border-b border-[#17191c] relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-[#b4935d]/3 blur-[140px] pointer-events-none rounded-full" />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d0f14] border border-[#b4935d] text-[#eee7db] shadow-2xl shadow-black/80 animate-fade-in">
          <Check className="w-4 h-4 text-[#b4935d]" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b4935d]" /> FEATURED PROJECTS
            </p>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
              项目作品
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="projects-add-new-btn"
                  onClick={handleAddNewProject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs font-orbitron transition-all shadow-md shadow-[#b4935d]/20 cursor-pointer"
                  title="新增一套代表作项目"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>新增代表作</span>
                </button>

                <button
                  onClick={() => openPdfManager()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14171f] hover:bg-[#1c202a] border border-[#262a35] hover:border-[#b4935d]/40 text-[#cbb082] hover:text-[#eee7db] text-xs font-orbitron transition-colors cursor-pointer"
                  title="打开全站 PDF 链接与名称管理中心"
                >
                  <FileText className="w-3.5 h-3.5 text-[#b4935d]" />
                  <span>PDF 管理中心</span>
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14171f] hover:bg-[#1c202a] border border-[#262a35] hover:border-[#b4935d]/40 text-[#8e877a] hover:text-[#eee7db] text-xs transition-colors cursor-pointer"
                  title="恢复初始代表作数据"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复初始</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Cards Grid */}
        {projects.length === 0 ? (
          <div className="py-16 px-6 rounded-2xl bg-[#0d0f14] border border-[#22252c] text-center space-y-3">
            <p className="text-sm text-[#8e877a]">
              暂无代表作项目
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {displayedProjects.map((project) => (
                <MagneticProjectCard
                  key={project.id}
                  project={project}
                  isAdmin={isAdmin}
                  onOpenProject={setActiveProject}
                  onOpenGallery={handleOpenGallery}
                  onOpenPdf={handleOpenPdf}
                  onOpenEdit={handleOpenEdit}
                  onRequestDelete={handleRequestDelete}
                />
              ))}
            </div>

            {/* Expand / Collapse Drawer Action Bar */}
            {hasMore && (
              <div className="pt-4 flex flex-col items-center justify-center space-y-3">
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setIsExpanded(false);
                      const el = document.getElementById('projects');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    } else {
                      setIsExpanded(true);
                    }
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#12151d] hover:bg-[#1a1e29] border border-[#b4935d]/50 hover:border-[#b4935d] text-[#eee7db] font-orbitron text-xs sm:text-sm font-medium tracking-wider shadow-xl shadow-black/80 hover:shadow-[#b4935d]/15 transition-all duration-300 hover:scale-102 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#b4935d] animate-pulse" />
                  <span>
                    {isExpanded
                      ? `收起代表作 (仅展示精选 ${INITIAL_SHOW_COUNT} 套)`
                      : `展开全部代表作 (共 ${projects.length} 套)`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[11px] text-[#c8a873] font-semibold">
                    {isExpanded ? '收起' : `+${projects.length - INITIAL_SHOW_COUNT} 套`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#b4935d] group-hover:-translate-y-0.5 transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#b4935d] group-hover:translate-y-0.5 transition-transform" />
                  )}
                </button>

                <p className="text-[11px] text-[#787265] font-orbitron tracking-widest">
                  {isExpanded
                    ? `已展示全部 ${projects.length} 套代表作`
                    : `当前已收拢 · 精选展示前 ${INITIAL_SHOW_COUNT} 套 / 共 ${projects.length} 套代表作`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Full Project Modal */}
      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onOpenGallery={(proj, idx) => handleOpenGallery(proj, idx)}
          onOpenPdf={(proj) => handleOpenPdf(proj)}
          onOpenEdit={isAdmin ? (proj) => handleOpenEdit(proj) : undefined}
          onDelete={isAdmin ? (proj) => handleRequestDelete(proj) : undefined}
        />
      )}

      {/* Browse Landing Photos Modal (落地照片) */}
      {galleryProject && (
        <ProjectGalleryModal
          project={galleryProject}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryProject(null)}
        />
      )}

      {/* Browse Proposal PDF Modal (方案PDF) */}
      {pdfProject && (
        <ProjectPdfModal
          project={pdfProject}
          onClose={() => setPdfProject(null)}
        />
      )}

      {/* Edit Project Info & Resources Modal (Admin Only) */}
      {isAdmin && editingProject && (
        <ProjectEditModal
          project={editingProject}
          isNew={isCreatingNew}
          onClose={() => setEditingProject(null)}
          onSave={handleSaveProject}
          onDelete={handleRequestDeleteById}
        />
      )}

      {/* In-App Custom Delete Project Confirmation Modal */}
      {isAdmin && projectToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md bg-[#0e1017] border border-red-500/40 rounded-2xl p-6 shadow-2xl shadow-black text-[#eee7db] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Red Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                  <span>确认删除代表作</span>
                  <span className="text-[11px] font-orbitron px-2 py-0.5 rounded bg-red-950/50 border border-red-800/40 text-red-300">
                    NO. {projectToDelete.number}
                  </span>
                </h3>
                <p className="text-xs text-[#8e877a] mt-1">
                  您正在从前台作品库中永久移除该项目。
                </p>
              </div>
              <button
                onClick={() => setProjectToDelete(null)}
                className="p-1.5 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Project Mini Card Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141722] border border-[#262a38] mb-5">
              <img
                src={projectToDelete.imageUrl}
                alt={projectToDelete.title}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-medium text-[#eee7db] truncate">
                  {projectToDelete.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8e877a]">
                  <span className="truncate">{projectToDelete.brand}</span>
                  <span>·</span>
                  <span className="font-orbitron text-[#b4935d]">{projectToDelete.year}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#888175] mb-6 leading-relaxed">
              确认删除后，作品库将自动按最新年份重新排列，其余代表作将自动从 <span className="text-[#cbb082] font-orbitron">NO. 01</span> 递推重排序号。
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#171a24] hover:bg-[#222635] text-[#a8a195] text-xs font-medium transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs font-orbitron flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Custom Reset Confirmation Modal */}
      {isAdmin && showResetConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md bg-[#0e1017] border border-[#b4935d]/40 rounded-2xl p-6 shadow-2xl shadow-black text-[#eee7db] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 rounded-xl bg-[#b4935d]/15 border border-[#b4935d]/40 text-[#b4935d] shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-[#eee7db]">
                  确认恢复初始代表作数据？
                </h3>
                <p className="text-xs text-[#8e877a] mt-1">
                  将重置为系统预置的 20 套精选代表作全案设计与落地照片资源。
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="p-1.5 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#888175] mb-6 leading-relaxed">
              恢复后系统将自动按各项目的年份降序（最新年份优先）重新排列全量作品。
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#171a24] hover:bg-[#222635] text-[#a8a195] text-xs font-medium transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-5 py-2 rounded-xl bg-[#b4935d] hover:bg-[#c8a873] text-[#08090c] font-semibold text-xs font-orbitron flex items-center gap-1.5 transition-all shadow-lg shadow-[#b4935d]/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认恢复</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
