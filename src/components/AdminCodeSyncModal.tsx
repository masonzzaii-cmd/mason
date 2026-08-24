import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Copy,
  Download,
  Check,
  FileCode,
  Sparkles,
  Layers,
  Trophy,
  Sliders,
  FileText,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Project, Honor, Skill, SoftwareSkill } from '../types';
import { getPersistentItem } from '../utils/persistentStorage';
import { DEFAULT_PROJECTS_LIST } from '../data/projectsData';

const PROJECTS_STORAGE_KEY = 'mason_portfolio_projects_v2';
const HONORS_STORAGE_KEY = 'mason_portfolio_honors_v2';
const CORE_SKILLS_STORAGE_KEY = 'mason_portfolio_core_skills';
const SOFTWARE_SKILLS_STORAGE_KEY = 'mason_portfolio_software_skills';

export const AdminCodeSyncModal: React.FC = () => {
  const { isCodeSyncOpen, closeCodeSync, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState<'projects' | 'honors' | 'skills' | 'all'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [honors, setHonors] = useState<Honor[]>([]);
  const [coreSkills, setCoreSkills] = useState<Skill[]>([]);
  const [softwareSkills, setSoftwareSkills] = useState<SoftwareSkill[]>([]);
  const [copied, setCopied] = useState(false);

  // Load all current live data
  useEffect(() => {
    if (!isCodeSyncOpen) return;

    (async () => {
      // 1. Projects
      try {
        const savedProjects = await getPersistentItem<Project[]>(PROJECTS_STORAGE_KEY);
        if (savedProjects && Array.isArray(savedProjects)) {
          setProjects(savedProjects);
        } else {
          setProjects(DEFAULT_PROJECTS_LIST);
        }
      } catch {
        setProjects(DEFAULT_PROJECTS_LIST);
      }

      // 2. Honors
      try {
        const savedHonors = await getPersistentItem<Honor[]>(HONORS_STORAGE_KEY);
        if (savedHonors && Array.isArray(savedHonors)) {
          setHonors(savedHonors);
        }
      } catch (e) {
        console.warn(e);
      }

      // 3. Core Skills
      try {
        const savedCore = await getPersistentItem<Skill[]>(CORE_SKILLS_STORAGE_KEY);
        if (savedCore && Array.isArray(savedCore)) {
          setCoreSkills(savedCore);
        }
      } catch (e) {
        console.warn(e);
      }

      // 4. Software Skills
      try {
        const savedSoft = await getPersistentItem<SoftwareSkill[]>(SOFTWARE_SKILLS_STORAGE_KEY);
        if (savedSoft && Array.isArray(savedSoft)) {
          setSoftwareSkills(savedSoft);
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [isCodeSyncOpen]);

  if (!isCodeSyncOpen) return null;

  // Generate TypeScript Code string for Projects
  const generateProjectsCode = () => {
    return `import { Project } from '../types';
import { sortProjectsByDateDesc } from '../utils/projectSorter';

// 包含所有最新编辑的项目代表作、PDF链接名称与替换后的图片 Base64 / URL
const RAW_DEFAULT_PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};

export const DEFAULT_PROJECTS_LIST: Project[] = sortProjectsByDateDesc(RAW_DEFAULT_PROJECTS);
`;
  };

  // Generate TypeScript Code string for Honors
  const generateHonorsCode = () => {
    return `import { Honor } from '../types';

// 包含所有最新获奖荣誉、证书图片与颁发机构数据
export const DEFAULT_HONORS_LIST: Honor[] = ${JSON.stringify(honors, null, 2)};
`;
  };

  // Generate TypeScript Code string for Skills
  const generateSkillsCode = () => {
    return `import { Skill, SoftwareSkill } from '../types';

// 专业技能熟练度配置
export const DEFAULT_CORE_SKILLS: Skill[] = ${JSON.stringify(coreSkills, null, 2)};

// 掌握的设计软件熟练度与图标配置
export const DEFAULT_SOFTWARE_SKILLS: SoftwareSkill[] = ${JSON.stringify(softwareSkills, null, 2)};
`;
  };

  // Generate Complete All-in-One Data JSON / TS Code
  const generateAllDataCode = () => {
    return `// 全站完整数据备份包（包含代表作、PDF链接、荣誉奖项、技能库与图片代码）
export const PORTFOLIO_ALL_DATA = {
  projects: ${JSON.stringify(projects, null, 2)},
  honors: ${JSON.stringify(honors, null, 2)},
  coreSkills: ${JSON.stringify(coreSkills, null, 2)},
  softwareSkills: ${JSON.stringify(softwareSkills, null, 2)},
  exportedAt: "${new Date().toISOString()}",
};
`;
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'projects':
        return generateProjectsCode();
      case 'honors':
        return generateHonorsCode();
      case 'skills':
        return generateSkillsCode();
      case 'all':
        return generateAllDataCode();
      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    const code = getActiveCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('📋 当前板块的最新代码（含替换图片与文字）已成功复制到剪贴板！');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const code = getActiveCode();
    let filename = 'projectsData.ts';
    if (activeTab === 'honors') filename = 'honorsData.ts';
    if (activeTab === 'skills') filename = 'skillsData.ts';
    if (activeTab === 'all') filename = 'allPortfolioData.ts';

    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`💾 已成功下载代码文件: ${filename}`);
  };

  // Calculate statistics
  const countEmbeddedImages = () => {
    let count = 0;
    projects.forEach((p) => {
      if (p.imageUrl?.startsWith('data:')) count++;
      if (Array.isArray(p.galleryImages)) {
        p.galleryImages.forEach((img) => {
          if (img?.startsWith('data:')) count++;
        });
      }
    });
    honors.forEach((h) => {
      if (h.imageUrl?.startsWith('data:')) count++;
    });
    return count;
  };

  const embeddedImageCount = countEmbeddedImages();

  return (
    <div
      onClick={closeCodeSync}
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
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-[#eee7db]">
                  管理面板代码同步与图片持久化中心
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#b4935d]/15 text-[#cbb082] text-[10px] font-orbitron font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#b4935d]" /> 代码与数据同步
                </span>
              </div>
              <p className="text-xs text-[#8e877a] mt-0.5">
                在管理面板替换的图片与编辑的内容，均已自动转码并可直接导出为代码文件保存在工程中
              </p>
            </div>
          </div>

          <button
            onClick={closeCodeSync}
            className="p-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Banner */}
        <div className="px-6 py-3 bg-[#111420] border-b border-[#1f2434] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#cbb082]">
              <ImageIcon className="w-3.5 h-3.5 text-[#b4935d]" />
              <span>
                已嵌入图片: <strong>{embeddedImageCount}</strong> 张
              </span>
            </span>
            <span className="text-[#3c435a]">|</span>
            <span className="text-[#a8a195]">
              作品总数: <strong>{projects.length}</strong>
            </span>
            <span className="text-[#3c435a]">|</span>
            <span className="text-[#a8a195]">
              荣誉总数: <strong>{honors.length}</strong>
            </span>
            <span className="text-[#3c435a]">|</span>
            <span className="text-[#a8a195]">
              技能与软件: <strong>{coreSkills.length + softwareSkills.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] text-xs font-orbitron font-semibold transition-colors shadow-md shadow-[#b4935d]/20 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制代码' : '一键复制代码'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191d2c] hover:bg-[#252b3e] text-[#cbb082] hover:text-[#eee7db] text-xs font-orbitron font-medium transition-colors border border-[#2b3144] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#b4935d]" />
              <span>下载代码文件</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#1c202d] bg-[#0c0e15]">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 text-xs font-orbitron font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'border-[#b4935d] text-[#f2dfbf]'
                : 'border-transparent text-[#787165] hover:text-[#eee7db]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>项目作品代码 (projectsData.ts)</span>
          </button>

          <button
            onClick={() => setActiveTab('honors')}
            className={`pb-3 text-xs font-orbitron font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'honors'
                ? 'border-[#b4935d] text-[#f2dfbf]'
                : 'border-transparent text-[#787165] hover:text-[#eee7db]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>获奖荣誉代码 (honorsData.ts)</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 text-xs font-orbitron font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'skills'
                ? 'border-[#b4935d] text-[#f2dfbf]'
                : 'border-transparent text-[#787165] hover:text-[#eee7db]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>技能与软件代码 (skillsData.ts)</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs font-orbitron font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#b4935d] text-[#f2dfbf]'
                : 'border-transparent text-[#787165] hover:text-[#eee7db]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>全量数据包 (allPortfolioData.ts)</span>
          </button>
        </div>

        {/* Code Preview Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col bg-[#08090d]">
          <div className="flex items-center justify-between pb-2 text-xs text-[#787165] font-mono">
            <span>TypeScript 代码预览:</span>
            <span>编码格式: UTF-8 / Base64 DataURI</span>
          </div>

          <div className="flex-1 overflow-auto rounded-xl bg-[#06070a] border border-[#1d212e] p-4 custom-scrollbar">
            <pre className="font-mono text-[11px] leading-relaxed text-[#c2b5a1] selection:bg-[#b4935d] selection:text-[#08090c]">
              {getActiveCode()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1f2434] bg-[#0f111a] flex items-center justify-between">
          <p className="text-xs text-[#787165]">
            💡 提示：点击“一键复制代码”后，可将代码直接粘贴替换对应的数据源文件，实现永久代码级保存。
          </p>
          <button
            onClick={closeCodeSync}
            className="px-5 py-2 rounded-xl bg-[#1b1f2d] hover:bg-[#252b3e] text-xs text-[#eee7db] font-medium transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
