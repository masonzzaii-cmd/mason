import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Code2,
  Copy,
  Download,
  Check,
  Sparkles,
  Layers,
  Trophy,
  Sliders,
  FileText,
  ShieldCheck,
  Image as ImageIcon,
  Home,
  User,
  Briefcase,
  Handshake,
  Mail,
  Github,
  Key,
  UserCircle2,
  FolderGit2,
  GitBranch,
  RefreshCw,
  CloudUpload,
  Link as LinkIcon,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  fetchAllPortfolioData,
  generateCodeByTab,
  buildAllSyncFiles,
  AllPortfolioExportData,
} from '../utils/supabaseClient';
import {
  GitHubConfig,
  saveGitHubConfig,
  loadGitHubConfig,
  clearGitHubConfig,
  isGitHubConfigComplete,
  validateGitHubAccess,
  syncFilesToGitHub,
  pushSingleFileToGitHub,
} from '../utils/githubSync';
import { DEFAULT_HERO_DATA } from './Hero';
import { DEFAULT_ABOUT_DATA } from './About';
import { DEFAULT_CORE_SKILLS, DEFAULT_SOFTWARE_SKILLS } from './Skills';
import { DEFAULT_EXPERIENCES } from './Experience';
import { DEFAULT_HONORS_LIST } from './Honors';
import { DEFAULT_PROJECTS_LIST } from '../data/projectsData';
import { DEFAULT_BRAND_PARTNERS } from '../data/brandPartnersData';
import { DEFAULT_CONTACT_DATA } from './Contact';

type TabName =
  | 'hero'
  | 'about'
  | 'skills'
  | 'experience'
  | 'honors'
  | 'projects'
  | 'brandPartners'
  | 'contact'
  | 'all';

const TABS: Array<{
  id: TabName;
  label: string;
  filename: string;
  icon: React.FC<any>;
  hint: string;
}> = [
  { id: 'hero', label: '首页 Hero', filename: 'heroData.ts', icon: Home, hint: '问候语、姓名、标语、按钮' },
  { id: 'about', label: '关于我', filename: 'aboutData.ts', icon: User, hint: '个人介绍、事实卡、简历链接' },
  { id: 'skills', label: '技能与软件', filename: 'skillsData.ts', icon: Sliders, hint: '专业技能熟练度+设计软件' },
  { id: 'experience', label: '工作经历', filename: 'experienceData.ts', icon: Briefcase, hint: '职业时间线与亮点' },
  { id: 'honors', label: '获奖荣誉', filename: 'honorsData.ts', icon: Trophy, hint: '奖项证书、颁发机构、图片' },
  { id: 'projects', label: '项目作品', filename: 'projectsData.ts', icon: Layers, hint: '代表作、图集、PDF链接' },
  { id: 'brandPartners', label: '合作品牌', filename: 'brandPartnersData.ts', icon: Handshake, hint: '品牌方 Logo 与合作概述' },
  { id: 'contact', label: '联系信息', filename: 'contactData.ts', icon: Mail, hint: '邮箱、电话、地址、社交' },
  { id: 'all', label: '全量数据包', filename: 'allPortfolioData.ts', icon: FileText, hint: '全站打包备份' },
];

export const AdminCodeSyncModal: React.FC = () => {
  const { isCodeSyncOpen, closeCodeSync, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabName>('projects');

  // ---------------- 全站云端数据状态 ----------------
  const [allData, setAllData] = useState<AllPortfolioExportData | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // ---------------- 剪贴板复制状态 ----------------
  const [copied, setCopied] = useState(false);

  // ---------------- GitHub 配置与同步面板 ----------------
  const [showGithubPanel, setShowGithubPanel] = useState(false);
  const [ghConfig, setGhConfig] = useState<Partial<GitHubConfig>>({ branch: 'main' });
  const [ghValidating, setGhValidating] = useState(false);
  const [ghValidateResult, setGhValidateResult] = useState<
    null | { ok: boolean; msg: string; userName?: string; defaultBranch?: string }
  >(null);
  const [ghSyncing, setGhSyncing] = useState(false);
  const [ghSyncProgress, setGhSyncProgress] = useState<{
    current: number;
    total: number;
    filePath: string;
  } | null>(null);
  const [ghSyncResult, setGhSyncResult] = useState<
    null | { ok: boolean; msg: string; commitUrl?: string; files?: string[] }
  >(null);
  const [ghTokenVisible, setGhTokenVisible] = useState(false);

  // 初始化：加载本地 GitHub 配置 & 从 Supabase 拉取全量数据
  useEffect(() => {
    if (!isCodeSyncOpen) return;
    setGhConfig(loadGitHubConfig());
    setGhValidateResult(null);
    setGhSyncResult(null);
    void loadAllDataFromCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCodeSyncOpen]);

  const loadAllDataFromCloud = async () => {
    setLoadingCloud(true);
    setCloudError(null);
    try {
      const data = await fetchAllPortfolioData({
        hero: DEFAULT_HERO_DATA,
        about: DEFAULT_ABOUT_DATA,
        coreSkills: DEFAULT_CORE_SKILLS,
        softwareSkills: DEFAULT_SOFTWARE_SKILLS,
        experiences: DEFAULT_EXPERIENCES,
        honors: DEFAULT_HONORS_LIST,
        projects: DEFAULT_PROJECTS_LIST,
        brandPartners: DEFAULT_BRAND_PARTNERS,
        contact: DEFAULT_CONTACT_DATA,
      });
      setAllData(data);
      setLastSyncTime(new Date().toLocaleString('zh-CN'));
    } catch (e: any) {
      console.error(e);
      setCloudError(e?.message || '从 Supabase 云端拉取数据失败，将使用上一次本地缓存。');
    } finally {
      setLoadingCloud(false);
    }
  };

  if (!isCodeSyncOpen) return null;

  // ---------------- 代码生成与统计 ----------------
  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;
  const { code, filename } = useMemo(() => {
    if (!allData) return { code: '', filename: activeTabMeta.filename };
    return generateCodeByTab(activeTab, allData);
  }, [activeTab, allData, activeTabMeta.filename]);

  const stats = useMemo(() => {
    if (!allData) return { embeddedImages: 0, projects: 0, honors: 0, skills: 0, brands: 0 };
    let embedded = 0;
    const countUrl = (u?: string) => u && (u.startsWith('data:') || u.startsWith('http')) ? 1 : 0;
    embedded += countUrl((allData.hero as any)?.imageUrl as string);
    allData.projects?.forEach((p: any) => {
      embedded += countUrl(p?.imageUrl);
      if (Array.isArray(p?.galleryImages)) {
        p.galleryImages.forEach((img: string) => (embedded += countUrl(img)));
      }
      if (p?.pdfUrl) embedded += 1;
    });
    allData.honors?.forEach((h: any) => (embedded += countUrl(h?.imageUrl)));
    allData.softwareSkills?.forEach((s: any) => (embedded += countUrl(s?.iconUrl)));
    allData.brandPartners?.forEach((b: any) => (embedded += countUrl(b?.logoUrl)));
    return {
      embeddedImages: embedded,
      projects: allData.projects?.length ?? 0,
      honors: allData.honors?.length ?? 0,
      skills: (allData.coreSkills?.length ?? 0) + (allData.softwareSkills?.length ?? 0),
      brands: allData.brandPartners?.length ?? 0,
    };
  }, [allData]);

  // ---------------- 复制 / 下载 ----------------
  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(`📋 [${activeTabMeta.label}] 最新代码（含图片与PDF链接）已复制到剪贴板！`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`💾 已下载代码文件: ${filename}`);
  };

  // ---------------- GitHub 配置操作 ----------------
  const handleGhConfigChange = (key: keyof GitHubConfig, value: string) => {
    const next = { ...ghConfig, [key]: value };
    setGhConfig(next);
    saveGitHubConfig(next);
    setGhValidateResult(null);
  };

  const handleValidateGhConfig = async () => {
    if (!isGitHubConfigComplete(ghConfig as GitHubConfig)) {
      setGhValidateResult({ ok: false, msg: '请先完整填写 Token、用户名、仓库名与分支。' });
      return;
    }
    setGhValidating(true);
    setGhValidateResult(null);
    try {
      const result = await validateGitHubAccess(ghConfig as GitHubConfig);
      if (result.valid) {
        setGhValidateResult({
          ok: true,
          userName: result.userName,
          defaultBranch: result.defaultBranch,
          msg: `✅ 连接成功！身份：${result.userName}，仓库默认分支：${result.defaultBranch || '未知'}`,
        });
        // 自动将默认分支填入（若用户未设置）
        if (result.defaultBranch && !ghConfig.branch) {
          const next = { ...ghConfig, branch: result.defaultBranch };
          setGhConfig(next);
          saveGitHubConfig(next);
        }
      } else {
        setGhValidateResult({ ok: false, msg: `❌ ${result.error || '验证失败'}` });
      }
    } catch (e: any) {
      setGhValidateResult({ ok: false, msg: `❌ ${e?.message || '验证请求异常'}` });
    } finally {
      setGhValidating(false);
    }
  };

  // ---------------- GitHub 同步：当前单文件 ----------------
  const handleSyncCurrentFile = async () => {
    if (!allData) return;
    if (!isGitHubConfigComplete(ghConfig as GitHubConfig)) {
      showToast('⚠️ 请先在 GitHub 配置面板完整填写并验证您的凭据。');
      setShowGithubPanel(true);
      return;
    }
    const { path, content } =
      activeTab === 'all'
        ? { path: 'src/data/allPortfolioData.ts', content: code }
        : (() => {
            const arr = buildAllSyncFiles(allData);
            const found = arr.find((f) => f.path.endsWith(`/${filename}`)) || arr[arr.length - 1];
            return { path: found.path, content: code };
          })();

    setGhSyncing(true);
    setGhSyncResult(null);
    setGhSyncProgress({ current: 1, total: 1, filePath: path });
    try {
      const result = await pushSingleFileToGitHub({
        config: ghConfig as GitHubConfig,
        filePath: path,
        content,
      });
      setGhSyncResult({
        ok: true,
        msg: `🎉 已成功将「${activeTabMeta.label}」(${filename}) 推送到 GitHub。`,
        commitUrl: result.htmlUrl,
        files: [path],
      });
      showToast(`🚀 同步成功：${filename} 已推送到 GitHub 仓库 ${ghConfig.owner}/${ghConfig.repo}@${ghConfig.branch}`);
    } catch (e: any) {
      setGhSyncResult({ ok: false, msg: `❌ 同步失败：${e?.message || '未知错误'}` });
    } finally {
      setGhSyncing(false);
      setGhSyncProgress(null);
    }
  };

  // ---------------- GitHub 同步：全部 9 个数据文件 ----------------
  const handleSyncAllFiles = async () => {
    if (!allData) return;
    if (!isGitHubConfigComplete(ghConfig as GitHubConfig)) {
      showToast('⚠️ 请先在 GitHub 配置面板完整填写并验证您的凭据。');
      setShowGithubPanel(true);
      return;
    }
    const files = buildAllSyncFiles(allData);
    setGhSyncing(true);
    setGhSyncResult(null);
    try {
      const result = await syncFilesToGitHub({
        config: ghConfig as GitHubConfig,
        files,
        commitMessage: `chore(data): sync portfolio all sections from admin cloud storage at ${new Date().toISOString()}`,
        onProgress: (current, total, filePath) => {
          setGhSyncProgress({ current, total, filePath });
        },
      });
      setGhSyncResult({
        ok: true,
        msg: `🎉 全站 7 大板块共 ${files.length} 个数据文件已全部推送到 GitHub！最新 commit SHA：${result.sha.slice(0, 7)}`,
        commitUrl: result.htmlUrl,
        files: result.updatedFiles,
      });
      showToast(
        `🚀 全站 ${files.length} 个数据文件已同步到 GitHub → ${ghConfig.owner}/${ghConfig.repo}@${ghConfig.branch}`
      );
    } catch (e: any) {
      setGhSyncResult({ ok: false, msg: `❌ ${e?.message || '批量同步异常终止'}` });
    } finally {
      setGhSyncing(false);
      setGhSyncProgress(null);
    }
  };

  return (
    <div
      onClick={closeCodeSync}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-[#eee7db]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1280px] max-h-[94vh] bg-[#0c0e15] border border-[#b4935d]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        {/* ============== Header ============== */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#202534] bg-[#121520]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-xl bg-[#b4935d]/10 border border-[#b4935d]/30 text-[#b4935d]">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-medium">
                  云存储 · 代码同步中心
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#b4935d]/15 text-[#cbb082] text-[10px] font-orbitron font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#b4935d]" /> Supabase → GitHub
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#8e877a] mt-0.5 max-w-xl">
                在各板块编辑的文字 / 上传的照片 / PDF 链接已自动存入 Supabase 云端；在这里一键导出 TypeScript 数据文件，或直接推送到 GitHub 仓库实现上线即时可浏览。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowGithubPanel((v) => !v)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-medium transition-colors border cursor-pointer ${
                showGithubPanel
                  ? 'bg-[#b4935d] text-[#08090c] border-[#b4935d]'
                  : 'bg-[#141824] text-[#cbb082] border-[#2b3144] hover:border-[#b4935d]/60'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              {showGithubPanel ? '关闭 GitHub 面板' : 'GitHub 同步配置'}
            </button>
            <button
              onClick={loadAllDataFromCloud}
              disabled={loadingCloud}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] text-[#cbb082] text-xs border border-[#2b3144] transition-colors disabled:opacity-50 cursor-pointer"
              title="从 Supabase 云端重新拉取所有板块最新数据"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCloud ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">从云端刷新</span>
            </button>
            <button
              onClick={closeCodeSync}
              className="p-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============== Feature Banner / Stats ============== */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#111420] border-b border-[#1f2434] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#cbb082]">
              <ImageIcon className="w-3.5 h-3.5 text-[#b4935d]" />
              <span>
                图片 / PDF 资源: <strong>{stats.embeddedImages}</strong>
              </span>
            </span>
            <span className="text-[#3c435a] hidden sm:inline">|</span>
            <span className="text-[#a8a195]">作品: <strong>{stats.projects}</strong></span>
            <span className="text-[#a8a195]">荣誉: <strong>{stats.honors}</strong></span>
            <span className="text-[#a8a195]">技能: <strong>{stats.skills}</strong></span>
            <span className="text-[#a8a195]">品牌: <strong>{stats.brands}</strong></span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[10px] text-[#6d685c]">
              {loadingCloud
                ? '⏳ 正在从 Supabase 云端拉取最新数据...'
                : cloudError
                ? `⚠️ ${cloudError}`
                : lastSyncTime
                ? `✅ 云端同步时间：${lastSyncTime}`
                : '准备就绪'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                disabled={!code}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] text-xs font-orbitron font-semibold transition-colors shadow-md shadow-[#b4935d]/20 disabled:opacity-50 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? '已复制' : '一键复制'}</span>
                <span className="sm:hidden">复制</span>
              </button>
              <button
                onClick={handleDownloadFile}
                disabled={!code}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#191d2c] hover:bg-[#252b3e] text-[#cbb082] hover:text-[#eee7db] text-xs font-orbitron font-medium transition-colors border border-[#2b3144] disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#b4935d]" />
                <span className="hidden sm:inline">下载代码文件</span>
                <span className="sm:hidden">下载</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============== Body: GitHub 配置面板 + Tab + Code ============== */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row bg-[#0c0e15]">
          {/* GitHub 侧边配置面板 */}
          {showGithubPanel && (
            <aside className="w-full sm:w-[360px] shrink-0 border-b sm:border-b-0 sm:border-r border-[#1f2434] bg-[#0f111a] overflow-y-auto">
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-orbitron font-semibold flex items-center gap-2 text-[#f2dfbf]">
                    <Settings2 className="w-4 h-4 text-[#b4935d]" />
                    GitHub 仓库自动同步配置
                  </h4>
                  <button
                    onClick={() => setShowGithubPanel(false)}
                    className="p-1 text-[#787165] hover:text-[#eee7db] cursor-pointer sm:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-[#787165] leading-relaxed">
                  填写后点击「验证」，通过后即可将当前板块或全站 9 个数据文件直接 commit & push 到您的 GitHub 仓库。
                </p>

                {/* Token */}
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-[#cbb082] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Personal Access Token
                  </span>
                  <div className="relative">
                    <input
                      type={ghTokenVisible ? 'text' : 'password'}
                      value={ghConfig.token || ''}
                      onChange={(e) => handleGhConfigChange('token', e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-lg bg-[#06070a] border border-[#2b3144] focus:border-[#b4935d] focus:outline-none text-xs text-[#eee7db] placeholder-[#4b453c] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setGhTokenVisible((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#787165] hover:text-[#eee7db] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#8e7047] hover:text-[#b4935d] underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> 创建 Fine-grained Token（选 Contents: Read & Write）
                  </a>
                </label>

                {/* Owner */}
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-[#cbb082] flex items-center gap-1.5">
                    <UserCircle2 className="w-3.5 h-3.5" /> 仓库所有者 (Owner)
                  </span>
                  <input
                    type="text"
                    value={ghConfig.owner || ''}
                    onChange={(e) => handleGhConfigChange('owner', e.target.value.trim())}
                    placeholder="例如: your-github-username"
                    className="w-full px-3 py-2 rounded-lg bg-[#06070a] border border-[#2b3144] focus:border-[#b4935d] focus:outline-none text-xs text-[#eee7db] placeholder-[#4b453c] transition-colors"
                  />
                </label>

                {/* Repo */}
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-[#cbb082] flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5" /> 仓库名称 (Repo)
                  </span>
                  <input
                    type="text"
                    value={ghConfig.repo || ''}
                    onChange={(e) => handleGhConfigChange('repo', e.target.value.trim())}
                    placeholder="例如: my-portfolio-website"
                    className="w-full px-3 py-2 rounded-lg bg-[#06070a] border border-[#2b3144] focus:border-[#b4935d] focus:outline-none text-xs text-[#eee7db] placeholder-[#4b453c] transition-colors"
                  />
                </label>

                {/* Branch */}
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-[#cbb082] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" /> 目标分支 (Branch)
                  </span>
                  <input
                    type="text"
                    value={ghConfig.branch || 'main'}
                    onChange={(e) => handleGhConfigChange('branch', e.target.value.trim())}
                    placeholder="main / master / gh-pages"
                    className="w-full px-3 py-2 rounded-lg bg-[#06070a] border border-[#2b3144] focus:border-[#b4935d] focus:outline-none text-xs text-[#eee7db] placeholder-[#4b453c] transition-colors"
                  />
                </label>

                {/* 验证按钮 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleValidateGhConfig}
                    disabled={ghValidating || ghSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#191d2c] hover:bg-[#252b3e] text-[#cbb082] text-xs font-medium border border-[#2b3144] hover:border-[#b4935d]/60 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {ghValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    验证连接
                  </button>
                  <button
                    onClick={() => {
                      clearGitHubConfig();
                      setGhConfig({ branch: 'main' });
                      setGhValidateResult(null);
                      showToast('已清除本地保存的 GitHub 配置与 Token');
                    }}
                    className="px-3 py-2 rounded-lg bg-[#141824] hover:bg-red-950/40 text-[#787165] hover:text-red-300 text-xs border border-[#2b3144] hover:border-red-500/30 transition-colors cursor-pointer"
                    title="清除本地保存的 Token 与配置"
                  >
                    清除
                  </button>
                </div>

                {/* 验证结果 */}
                {ghValidateResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                      ghValidateResult.ok
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-950/30 border-red-500/30 text-red-200'
                    }`}
                  >
                    {ghValidateResult.ok ? (
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{ghValidateResult.msg}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{ghValidateResult.msg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 操作分割线 */}
                <div className="pt-2 border-t border-[#1f2434] space-y-2">
                  <button
                    onClick={handleSyncCurrentFile}
                    disabled={ghSyncing || !allData || !code}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#141824] hover:bg-[#1e2536] text-[#cbb082] text-xs font-medium border border-[#2b3144] hover:border-[#b4935d]/60 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-[#b4935d]" />
                    同步当前板块 → {activeTabMeta.filename}
                  </button>
                  <button
                    onClick={handleSyncAllFiles}
                    disabled={ghSyncing || !allData}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#8e7047] via-[#b4935d] to-[#cbb082] hover:brightness-110 text-[#08090c] text-xs font-orbitron font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#b4935d]/20 cursor-pointer"
                  >
                    {ghSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                    {ghSyncing
                      ? ghSyncProgress
                        ? `同步中 ${ghSyncProgress.current}/${ghSyncProgress.total}`
                        : '同步中...'
                      : '🚀 一键同步全站 7 大板块到 GitHub'}
                  </button>
                </div>

                {/* 进度条 */}
                {ghSyncing && ghSyncProgress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-[#787165]">
                      <span className="truncate max-w-[220px]" title={ghSyncProgress.filePath}>
                        {ghSyncProgress.filePath}
                      </span>
                      <span>{ghSyncProgress.current}/{ghSyncProgress.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#151720] rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="h-full bg-gradient-to-r from-[#8e7047] to-[#f2dfbf] rounded-full transition-all"
                        style={{ width: `${(ghSyncProgress.current / ghSyncProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 同步结果 */}
                {ghSyncResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-2 ${
                      ghSyncResult.ok
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-950/30 border-red-500/30 text-red-200'
                    }`}
                  >
                    {ghSyncResult.ok ? (
                      <>
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{ghSyncResult.msg}</span>
                        </div>
                        {ghSyncResult.commitUrl && (
                          <a
                            href={ghSyncResult.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#cbb082] hover:text-[#f2dfbf] underline-offset-2 underline text-[10px]"
                          >
                            <LinkIcon className="w-3 h-3" /> 在 GitHub 上查看本次提交
                          </a>
                        )}
                        {ghSyncResult.files && (
                          <details className="text-[10px]">
                            <summary className="cursor-pointer text-[#787165] hover:text-[#eee7db]">
                              本次写入的 {ghSyncResult.files.length} 个文件
                            </summary>
                            <ul className="mt-1.5 space-y-0.5 pl-3 font-mono text-[#9c9385]">
                              {ghSyncResult.files.map((f) => (
                                <li key={f}>• {f}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{ghSyncResult.msg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 移动端一键同步入口（小屏幕上也能直接看到 GitHub 按钮） */}
              </div>
            </aside>
          )}

          {/* 主区域：Tabs + 代码 */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Tab 选择 */}
            <div className="flex items-center gap-1 px-3 sm:px-6 pt-3 pb-2 overflow-x-auto border-b border-[#1c202d] bg-[#0c0e15] custom-scrollbar">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                    }}
                    title={t.hint}
                    className={`shrink-0 pb-2 text-[10px] sm:text-xs font-orbitron font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer px-2 sm:px-0 ${
                      activeTab === t.id
                        ? 'border-[#b4935d] text-[#f2dfbf] sm:mr-3'
                        : 'border-transparent text-[#787165] hover:text-[#eee7db] sm:mr-3'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* 代码预览 */}
            <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col bg-[#08090d] min-h-0">
              <div className="flex items-center justify-between pb-2 text-[10px] sm:text-xs text-[#787165] font-mono flex-wrap gap-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  TypeScript · <span className="text-[#cbb082]">{filename}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#b4935d]" />
                  {activeTabMeta.hint}
                </span>
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-[#06070a] border border-[#1d212e] p-3 sm:p-4 custom-scrollbar">
                {loadingCloud && !allData ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-[#787165]">
                    <Loader2 className="w-7 h-7 animate-spin text-[#b4935d]" />
                    <div className="text-xs">正在从 Supabase 云端同步 7 大板块最新编辑内容...</div>
                  </div>
                ) : !allData ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-[#787165]">
                    <AlertCircle className="w-7 h-7 text-red-400/70" />
                    <div className="text-xs">暂无可用数据，请检查网络或点击右上角「从云端刷新」。</div>
                  </div>
                ) : (
                  <pre className="font-mono text-[10px] sm:text-[11px] leading-relaxed text-[#c2b5a1] selection:bg-[#b4935d] selection:text-[#08090c] whitespace-pre-wrap break-all">
                    {code}
                  </pre>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* ============== Footer ============== */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#1f2434] bg-[#0f111a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowGithubPanel((v) => !v)}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-medium transition-colors border cursor-pointer ${
                showGithubPanel
                  ? 'bg-[#b4935d] text-[#08090c] border-[#b4935d]'
                  : 'bg-[#141824] text-[#cbb082] border-[#2b3144] hover:border-[#b4935d]/60'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              {showGithubPanel ? '关闭 GitHub 面板' : '打开 GitHub 同步'}
            </button>
            {!showGithubPanel && (
              <button
                onClick={handleSyncAllFiles}
                disabled={ghSyncing || !allData}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8e7047] via-[#b4935d] to-[#cbb082] hover:brightness-110 text-[#08090c] text-xs font-orbitron font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#b4935d]/20 cursor-pointer"
              >
                <Github className="w-4 h-4" /> 🚀 一键同步全站 7 大板块到 GitHub（共 9 个数据文件）
              </button>
            )}
            {!showGithubPanel && !ghSyncing && (
              <button
                onClick={handleSyncCurrentFile}
                disabled={!allData || !code}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141824] hover:bg-[#1e2536] text-[#cbb082] text-xs font-medium border border-[#2b3144] hover:border-[#b4935d]/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5 text-[#b4935d]" />
                仅同步当前板块 ({filename})
              </button>
            )}
            <p className="text-[10px] sm:text-xs text-[#787165] max-w-md">
              💡 提示：编辑内容先自动存入 Supabase 云端；点击 GitHub 同步即可将数据文件 commit & push 到仓库，重新构建上线后即可在公网浏览到最新内容。
            </p>
          </div>
          <button
            onClick={closeCodeSync}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#1b1f2d] hover:bg-[#252b3e] text-xs text-[#eee7db] font-medium transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
