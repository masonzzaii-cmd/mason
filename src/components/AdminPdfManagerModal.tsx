import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Search,
  ExternalLink,
  Edit3,
  Upload,
  Check,
  Link2,
  Copy,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
  Save,
  CheckCircle2,
  Sparkles,
  Building,
  Calendar,
} from 'lucide-react';
import { Project } from '../types';
import { useAdmin } from '../context/AdminContext';
import { DEFAULT_PROJECTS_LIST } from '../data/projectsData';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  uploadAssetToStorage,
  isSupabaseConfigured,
} from '../utils/supabaseClient';
import { sortProjectsByDateDesc } from '../utils/projectSorter';

const STORAGE_KEY = 'mason_portfolio_projects_v2';
const FALLBACK_KEYS = ['mason_portfolio_projects', 'user_custom_projects'];

export const AdminPdfManagerModal: React.FC = () => {
  const { isPdfManagerOpen, closePdfManager, showToast, triggerRefresh } = useAdmin();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<{
    pdfFileName: string;
    pdfUrl: string;
  }>({
    pdfFileName: '',
    pdfUrl: '',
  });
  const [activeUploadTab, setActiveUploadTab] = useState<'url' | 'upload'>('url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPdfProject, setPreviewPdfProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from persistent storage / Supabase
  useEffect(() => {
    if (!isPdfManagerOpen) return;

    let isMounted = true;
    (async () => {
      try {
        const savedData = await fetchSectionData<Project[]>(
          'projects',
          'projects_list',
          STORAGE_KEY,
          DEFAULT_PROJECTS_LIST
        );
        if (isMounted && savedData && Array.isArray(savedData) && savedData.length > 0) {
          setProjects(sortProjectsByDateDesc(savedData));
        } else if (isMounted) {
          setProjects(sortProjectsByDateDesc(DEFAULT_PROJECTS_LIST));
        }
      } catch (e) {
        if (isMounted) {
          setProjects(sortProjectsByDateDesc(DEFAULT_PROJECTS_LIST));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isPdfManagerOpen]);

  if (!isPdfManagerOpen) return null;

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      (p.pdfFileName && p.pdfFileName.toLowerCase().includes(query)) ||
      (p.pdfUrl && p.pdfUrl.toLowerCase().includes(query)) ||
      p.year.includes(query)
    );
  });

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingForm({
      pdfFileName: project.pdfFileName || `${project.title}-全案软装设计汇报方案.pdf`,
      pdfUrl: project.pdfUrl || '/陈梅生-资深软装设计师-个人简历.pdf',
    });
    setActiveUploadTab(project.pdfUrl?.startsWith('data:') ? 'upload' : 'url');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingForm({ pdfFileName: '', pdfUrl: '' });
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('请上传 PDF 格式文件 (.pdf)');
      return;
    }

    setIsProcessing(true);
    try {
      if (isSupabaseConfigured()) {
        const publicUrl = await uploadAssetToStorage(file, `proj_pdf_${editingProjectId || Date.now()}`);
        if (publicUrl) {
          setEditingForm((prev) => ({
            ...prev,
            pdfUrl: publicUrl,
            pdfFileName: file.name,
          }));
          showToast('☁️ PDF 方案已成功上传至 Supabase Storage assets 存储桶！点击保存即可同步。');
          setIsProcessing(false);
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingForm((prev) => ({
          ...prev,
          pdfUrl: e.target?.result as string,
          pdfFileName: file.name,
        }));
        setIsProcessing(false);
        showToast('本地 PDF 文件已成功读取，点击保存即可生效');
      };
      reader.onerror = () => {
        alert('读取 PDF 文件失败');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('上传 PDF 失败');
      setIsProcessing(false);
    }
  };

  const handleSaveItem = async (projectId: string) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          pdfFileName: editingForm.pdfFileName.trim() || `${p.title}-软装设计方案.pdf`,
          pdfUrl: editingForm.pdfUrl.trim(),
        };
      }
      return p;
    });

    setProjects(updated);
    const result = await saveSectionData<Project[]>('projects', 'projects_list', STORAGE_KEY, updated);
    setEditingProjectId(null);
    triggerRefresh();
    showToast(
      result.cloudSynced
        ? '📄 PDF 文档已成功保存并同步至 Supabase 云端！'
        : '📄 PDF 文档名称与链接已成功更新并保存！'
    );
  };

  const handleCopyLink = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      showToast('当前为本地嵌入式 PDF 数据');
      return;
    }
    navigator.clipboard.writeText(url);
    showToast('🔗 PDF 链接已复制到剪贴板！');
  };

  const totalPdfs = projects.filter((p) => p.pdfUrl && p.pdfUrl.trim().length > 0).length;

  return (
    <div
      onClick={closePdfManager}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-[#eee7db]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c0e15] border border-[#b4935d]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#202534] bg-[#121520]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-[#eee7db]">
                  PDF 链接与名称统一管理中心
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#b4935d]/15 text-[#cbb082] text-[10px] font-orbitron font-semibold">
                  {totalPdfs} / {projects.length} 个方案文档
                </span>
              </div>
              <p className="text-xs text-[#8e877a] mt-0.5">
                可统一管理各代表作项目的方案汇报 PDF 文件名、在线浏览链接 (MaiPDF/直链) 或上传替换本地 PDF
              </p>
            </div>
          </div>

          <button
            onClick={closePdfManager}
            className="p-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Summary */}
        <div className="px-6 py-3 border-b border-[#1c202d] bg-[#0f111a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#787165] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目名称、品牌、年份或 PDF 标题..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#151824] border border-[#252a3a] text-xs text-[#eee7db] placeholder-[#6b6559] focus:outline-none focus:border-[#b4935d] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#a8a195]">
            <span className="flex items-center gap-1 text-[11px] text-[#b4935d]">
              <Sparkles className="w-3 h-3" /> 修改即时自动同步到网站与前端大屏阅读器
            </span>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-[#787165] space-y-2">
              <FileText className="w-10 h-10 mx-auto text-[#4a453c]" />
              <p className="text-sm">未找到匹配的项目或 PDF 文档</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const isEditing = editingProjectId === project.id;
                const hasPdf = Boolean(project.pdfUrl && project.pdfUrl.trim());
                const isDataUrl = project.pdfUrl?.startsWith('data:');

                return (
                  <div
                    key={project.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-[#141724] border-[#b4935d]'
                        : 'bg-[#10121a] border-[#222736] hover:border-[#383e52]'
                    }`}
                  >
                    {/* Top Row: Project Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1c202d]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d] font-orbitron text-[10px] font-semibold flex-shrink-0">
                          NO. {project.number}
                        </span>
                        <h4 className="text-sm font-medium text-[#eee7db] truncate">
                          {project.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#8e877a] font-orbitron flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-[#b4935d]" />
                          <span>{project.brand}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#b4935d]" />
                          <span>{project.year}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content Section: View mode or Edit mode */}
                    {isEditing ? (
                      /* EDITING FORM FOR THIS ROW */
                      <div className="pt-3 space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-orbitron text-[#cbb082]">
                            PDF 文档名称 / 显示标题 *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingForm.pdfFileName}
                            onChange={(e) =>
                              setEditingForm({ ...editingForm, pdfFileName: e.target.value })
                            }
                            placeholder="例如：保利天悦顶层复式-软装全案落地汇报.pdf"
                            className="w-full px-3.5 py-2 rounded-lg bg-[#0b0d14] border border-[#2b3144] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                          />
                        </div>

                        {/* Upload tab switch */}
                        <div className="flex items-center gap-2 p-1 bg-[#0b0d14] border border-[#262b3a] rounded-lg">
                          <button
                            type="button"
                            onClick={() => setActiveUploadTab('url')}
                            className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                              activeUploadTab === 'url'
                                ? 'bg-[#b4935d] text-[#08090c]'
                                : 'text-[#8e877a] hover:text-[#eee7db]'
                            }`}
                          >
                            网络在线链接 (MaiPDF / 腾讯云 / OSS)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveUploadTab('upload')}
                            className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${
                              activeUploadTab === 'upload'
                                ? 'bg-[#b4935d] text-[#08090c]'
                                : 'text-[#8e877a] hover:text-[#eee7db]'
                            }`}
                          >
                            本地 PDF 上传
                          </button>
                        </div>

                        {activeUploadTab === 'url' ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editingForm.pdfUrl}
                              onChange={(e) =>
                                setEditingForm({ ...editingForm, pdfUrl: e.target.value })
                              }
                              placeholder="https://maipdf.cn/file/xxx 或 https://..."
                              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0d14] border border-[#2b3144] focus:border-[#b4935d] text-xs text-[#eee7db] focus:outline-none"
                            />
                            <p className="text-[10px] text-[#716d66]">
                              用户点击即可在大屏阅览器中畅读，无广告，且兼容电脑与移动端
                            </p>
                          </div>
                        ) : (
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="application/pdf,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(e.target.files[0]);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="w-full py-3 px-4 border border-dashed border-[#31384e] hover:border-[#b4935d] rounded-xl bg-[#0b0d14] text-xs text-[#cbb082] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{isProcessing ? '正在处理文件...' : '点击选择本地 PDF 文件并上传'}</span>
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 rounded-lg bg-[#191d2a] hover:bg-[#23283a] text-xs text-[#9e978b] transition-colors"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveItem(project.id)}
                            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#cbb082] text-xs text-[#08090c] font-medium transition-colors shadow-md shadow-[#b4935d]/20"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>保存文档配置</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE FOR THIS ROW */
                      <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-[#191d29] text-[#b4935d] flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-[#f2dfbf] truncate">
                                {project.pdfFileName || `${project.title}-方案汇报.pdf`}
                              </p>
                              {isDataUrl ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-orbitron border border-blue-500/20 shrink-0">
                                  本地文件已嵌入
                                </span>
                              ) : hasPdf ? (
                                <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-orbitron border border-green-500/20 shrink-0">
                                  在线链接已就绪
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[9px] font-orbitron border border-yellow-500/20 shrink-0">
                                  未配置PDF
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#787165] truncate font-mono mt-0.5">
                              {project.pdfUrl || '暂无PDF链接'}
                            </p>
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasPdf && (
                            <>
                              <button
                                onClick={() => setPreviewPdfProject(project)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#171b26] hover:bg-[#23283a] text-xs text-[#cbb082] font-orbitron transition-colors border border-[#272d3e]"
                                title="在线预览"
                              >
                                <Eye className="w-3 h-3" />
                                <span>预览</span>
                              </button>

                              <button
                                onClick={() => handleCopyLink(project.pdfUrl || '')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#171b26] hover:bg-[#23283a] text-xs text-[#a8a195] font-orbitron transition-colors border border-[#272d3e]"
                                title="复制链接"
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleStartEdit(project)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#b4935d]/15 hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all border border-[#b4935d]/40"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>编辑名称与链接</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1f2434] bg-[#0f111a] flex items-center justify-between">
          <p className="text-xs text-[#787165]">
            点击“编辑名称与链接”后可修改对应文档标题或替换为最新 PDF 方案。
          </p>
          <button
            onClick={closePdfManager}
            className="px-5 py-2 rounded-xl bg-[#1b1f2d] hover:bg-[#252b3e] text-xs text-[#eee7db] font-medium transition-colors"
          >
            完成并关闭
          </button>
        </div>
      </div>

      {/* PDF Inline Preview Modal */}
      {previewPdfProject && (
        <div
          onClick={() => setPreviewPdfProject(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[85vh] bg-[#0c0e14] border border-[#b4935d]/50 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212634] bg-[#121520]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#b4935d]" />
                <h4 className="text-sm font-medium text-[#eee7db] truncate">
                  {previewPdfProject.pdfFileName || `${previewPdfProject.title}-方案汇报.pdf`}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfProject.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#b4935d] text-[#08090c] text-xs font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>新窗口全屏浏览</span>
                </a>
                <button
                  onClick={() => setPreviewPdfProject(null)}
                  className="p-1.5 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#090a0f] relative overflow-hidden">
              <iframe
                src={`${previewPdfProject.pdfUrl}#toolbar=1`}
                title={previewPdfProject.pdfFileName || 'PDF Preview'}
                className="w-full h-full border-0 bg-[#141722]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
