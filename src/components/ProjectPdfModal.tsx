import React, { useState } from 'react';
import { X, ExternalLink, FileText, Sparkles, BookOpen } from 'lucide-react';
import { Project } from '../types';

interface ProjectPdfModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectPdfModal: React.FC<ProjectPdfModalProps> = ({ project, onClose }) => {
  const [loadError, setLoadError] = useState(false);

  if (!project) return null;

  const pdfUrl = project.pdfUrl || '/陈梅生-资深软装设计师-个人简历.pdf';
  const pdfTitle = project.pdfFileName || `${project.title}-软装方案汇报.pdf`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/90 backdrop-blur-xl animate-fade-in"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[88vh] bg-[#0c0e14] border border-[#b4935d]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-[#eee7db]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#222632] bg-[#12151e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d] flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#b4935d]/15 text-[#b4935d] font-orbitron text-[10px] font-semibold">
                  PDF 方案文档
                </span>
                <span className="text-[11px] text-[#8e877a] font-orbitron">
                  {project.brand} · {project.year}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-medium text-[#eee7db] truncate">
                {pdfTitle}
              </h3>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#c8a873] text-xs text-[#08090c] font-orbitron font-semibold transition-all shadow-md shadow-[#b4935d]/20"
              title="新窗口全屏打开浏览"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">新窗口全屏浏览</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors ml-1"
              title="关闭预览 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-[#090a0f] relative overflow-hidden flex flex-col">
          {!loadError ? (
            <div className="w-full h-full relative">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                title={pdfTitle}
                className="w-full h-full border-0 bg-[#161822]"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* Fallback Card if iframe has difficulty rendering */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="p-4 rounded-2xl bg-[#141722] border border-[#b4935d]/30 text-[#b4935d]">
                <BookOpen className="w-12 h-12" />
              </div>
              <div className="max-w-md space-y-2">
                <h4 className="text-lg font-medium text-[#eee7db]">{pdfTitle}</h4>
                <p className="text-xs text-[#8e877a] leading-relaxed">
                  当前支持直接在线预览方案 PDF 文件。点击下方按钮即可在新标签页全屏打开该全案设计汇报。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-[#b4935d] text-[#08090c] text-xs font-orbitron font-semibold flex items-center gap-2 hover:bg-[#c8a873] transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>立即在新标签页全屏打开方案</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Strip */}
        <div className="px-6 py-3 border-t border-[#1c202a] bg-[#0e1017] flex items-center justify-between text-[11px] text-[#787265]">
          <div className="flex items-center gap-4">
            <span className="text-[#b4935d] font-orbitron">
              项目编号：NO. {project.number}
            </span>
            <span>地点：{project.location}</span>
            <span>类别：{project.category}</span>
          </div>
          <div className="flex items-center gap-2 font-orbitron text-[#a8a092]">
            <Sparkles className="w-3.5 h-3.5 text-[#b4935d]" />
            <span>CHEN MEISHENG · SOFT FURNISHING PORTFOLIO</span>
          </div>
        </div>
      </div>
    </div>
  );
};
