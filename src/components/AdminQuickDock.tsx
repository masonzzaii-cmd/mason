import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  FileText,
  Trophy,
  Sliders,
  Code2,
  LogOut,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminQuickDock: React.FC = () => {
  const { isAdmin, openPdfManager, openCodeSync, logout, showToast } = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAdmin) return null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTriggerAddProject = () => {
    scrollToSection('projects');
    const addBtn = document.getElementById('projects-add-new-btn');
    if (addBtn) {
      addBtn.click();
    } else {
      showToast('请在项目作品板块点击“+ 新增代表作”按钮');
    }
  };

  const handleTriggerAddHonor = () => {
    scrollToSection('honors');
    const addBtn = document.getElementById('honors-add-new-btn');
    if (addBtn) {
      addBtn.click();
    } else {
      showToast('请在获奖荣誉板块点击“+ 新增荣誉”按钮');
    }
  };

  const handleTriggerEditSkills = () => {
    scrollToSection('skills');
    const editBtn = document.getElementById('edit-core-skills-btn');
    if (editBtn) {
      editBtn.click();
    }
  };

  return (
    <aside aria-label="管理员快捷操作工具栏" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] transition-all duration-300">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0c0f16]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md hover:bg-[#141824] transition-all group cursor-pointer"
          title="展开管理者控制面板"
        >
          <div className="w-6 h-6 rounded-full bg-[#b4935d]/20 text-[#b4935d] flex items-center justify-center border border-[#b4935d]/40">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-orbitron font-medium tracking-wide">管理者控制面板</span>
          <ChevronUp className="w-4 h-4 text-[#b4935d] group-hover:-translate-y-0.5 transition-transform" />
        </button>
      ) : (
        <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-[#0a0c12]/95 border border-[#b4935d]/50 shadow-2xl shadow-black/90 backdrop-blur-xl text-[#eee7db]">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border-r border-[#202534]">
            <div className="w-2 h-2 rounded-full bg-[#b4935d] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-orbitron font-semibold text-[#f2dfbf] leading-tight flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#b4935d]" /> 管理者控制台
              </span>
              <span className="text-[9px] text-[#8e877a]">全板块编辑已就绪</span>
            </div>
          </div>

          {/* Action 1: Add Project */}
          <button
            onClick={handleTriggerAddProject}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer border border-[#262b3a] hover:border-[#b4935d]"
            title="快速新增代表作项目"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">新增作品</span>
            <span className="sm:hidden">作品</span>
          </button>

          {/* Action 2: PDF Document Manager Modal */}
          <button
            onClick={openPdfManager}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer border border-[#262b3a] hover:border-[#b4935d]"
            title="打开全站 PDF 链接与名称管理中心"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF 管理</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Action 3: Add/Manage Honors */}
          <button
            onClick={handleTriggerAddHonor}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer border border-[#262b3a] hover:border-[#b4935d]"
            title="快速新增获奖荣誉"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">荣誉管理</span>
            <span className="sm:hidden">荣誉</span>
          </button>

          {/* Action 4: Edit Skills & Percentages */}
          <button
            onClick={handleTriggerEditSkills}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#b4935d] text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all cursor-pointer border border-[#262b3a] hover:border-[#b4935d]"
            title="调节专业技能熟练度与软件库"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">技能库</span>
            <span className="sm:hidden">技能</span>
          </button>

          {/* Action 5: In-Code Persistence & Code Sync Modal */}
          <button
            onClick={openCodeSync}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#b4935d]/20 hover:bg-[#b4935d] text-[#f2dfbf] hover:text-[#08090c] text-xs font-orbitron font-semibold transition-all cursor-pointer border border-[#b4935d]/60 shadow-sm"
            title="一键导出代码 / 保存图片与修改至代码库中"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">代码同步与导出</span>
            <span className="md:hidden">代码</span>
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-xl text-[#787165] hover:text-[#eee7db] hover:bg-white/5 transition-colors cursor-pointer"
            title="收起控制条"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer ml-0.5"
            title="退出管理员模式"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
