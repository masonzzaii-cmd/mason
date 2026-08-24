import React, { useState, useEffect, useRef } from 'react';
import { Skill, SoftwareSkill } from '../types';
import {
  DEFAULT_CORE_SKILLS as __FILE_DEFAULT_CORE_SKILLS__,
  DEFAULT_SOFTWARE_SKILLS as __FILE_DEFAULT_SOFTWARE_SKILLS__,
} from '../data/skillsData';
import { 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3,
  Sliders,
  Check,
  RotateCcw,
  Palette,
  Layout,
  Wrench,
  X,
  Laptop,
  Save,
  SlidersHorizontal,
  HelpCircle,
  Zap,
  Upload
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { getPersistentItem, setPersistentItem } from '../utils/persistentStorage';
import {
  fetchSectionData,
  saveSectionData,
  upsertSiteContent,
  uploadAssetToStorage,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

const CORE_SKILLS_STORAGE_KEY = 'mason_portfolio_core_skills';
const SOFTWARE_SKILLS_STORAGE_KEY = 'mason_portfolio_software_skills';

export const DEFAULT_CORE_SKILLS: Skill[] = __FILE_DEFAULT_CORE_SKILLS__;

// Helper hook for smooth number rolling from 0 to target
function useCountUp(end: number, duration: number = 1300, trigger: boolean = false, delay: number = 0) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!trigger) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Exponential ease out
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(eased * end));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, trigger, delay]);

  return count;
}

// Sub-component: Animated Skill Progress Bar with Glowing Head
const AnimatedSkillBar: React.FC<{
  skill: Skill;
  index: number;
  isVisible: boolean;
}> = ({ skill, index, isVisible }) => {
  const animatedValue = useCountUp(skill.percentage, 1200, isVisible, index * 100);

  return (
    <div className="relative space-y-2 group/skill p-3 rounded-xl hover:bg-white/[0.02] transition-all duration-300">
      <div className="flex items-baseline justify-between text-xs sm:text-sm">
        <div>
          <span className="text-[#eee7db] font-medium group-hover/skill:text-[#f2dfbf] transition-colors">
            {skill.name}
          </span>
          {skill.enName && (
            <span className="block text-[10px] text-[#78736a] font-orbitron tracking-wider mt-0.5">
              {skill.enName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-orbitron font-semibold text-[#b99965] text-sm tabular-nums group-hover/skill:text-[#f2dfbf] transition-colors">
            {animatedValue}%
          </span>
        </div>
      </div>

      {/* Progress bar line with glowing charge head */}
      <div className="h-2 w-full bg-[#151720] rounded-full overflow-hidden relative border border-white/[0.04] p-[1px]">
        <div
          className="h-full bg-gradient-to-r from-[#8e7047] via-[#b4935d] to-[#f2dfbf] rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_12px_rgba(180,147,93,0.5)]"
          style={{
            width: isVisible ? `${skill.percentage}%` : '0%',
            transitionDelay: `${index * 100}ms`,
          }}
        >
          {/* Active Glowing Head */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_#ffffff,0_0_16px_#b4935d]" />
        </div>
      </div>
    </div>
  );
};

// Sub-component: Animated SVG Radial Ring
const AnimatedSkillRing: React.FC<{
  ring: Skill;
  index: number;
  isVisible: boolean;
}> = ({ ring, index, isVisible }) => {
  const animatedValue = useCountUp(ring.percentage, 1300, isVisible, index * 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isVisible
    ? circumference - (ring.percentage / 100) * circumference
    : circumference;

  return (
    <div
      className="aspect-square rounded-2xl border border-[#262a36] bg-[#0c0e13]/90 hover:bg-[#12151c] flex flex-col items-center justify-center p-3 relative group hover:border-[#b4935d]/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/70"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          {/* Background subtle ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[#191c26]"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Animated golden gradient stroke */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="url(#skillGoldGrad)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ transitionDelay: `${index * 100}ms` }}
          />
          <defs>
            <linearGradient id="skillGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8e7047" />
              <stop offset="50%" stopColor="#b4935d" />
              <stop offset="100%" stopColor="#f2dfbf" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-orbitron text-xl sm:text-2xl font-light text-[#f2dfbf] group-hover:scale-105 transition-transform tabular-nums">
            {animatedValue}
            <span className="text-xs text-[#b4935d] font-normal">%</span>
          </span>
        </div>
      </div>

      <span className="text-[11px] sm:text-xs text-[#8a857c] group-hover:text-[#eee7db] font-medium mt-1 text-center px-1 truncate max-w-full transition-colors">
        {ring.name}
      </span>
    </div>
  );
};

// Sub-component: Animated Software Skill Card with 3D Tilt & Spotlight Effect
const AnimatedSoftwareCard: React.FC<{
  skill: SoftwareSkill;
  index: number;
  isVisible: boolean;
  isAdmin: boolean;
  onEdit: (skill: SoftwareSkill) => void;
  onDelete: (id: string) => void;
}> = ({ skill, index, isVisible, isAdmin, onEdit, onDelete }) => {
  const numericProficiency = typeof skill.proficiency === 'number' ? skill.proficiency : 85;
  const animatedValue = useCountUp(numericProficiency, 1200, isVisible, index * 80);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number; x: number; y: number }>({
    rotateX: 0,
    rotateY: 0,
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Relative -1 to 1 coordinates from card center
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;

    const maxTilt = 8.5; // subtle, luxurious max tilt degree
    setTilt({
      rotateX: -yPct * maxTilt,
      rotateY: xPct * maxTilt,
      x,
      y,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, x: 0, y: 0 });
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative rounded-2xl select-none"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 0.08s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
            : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s ease, box-shadow 0.5s ease',
          boxShadow: isHovered
            ? '0 20px 35px -10px rgba(0, 0, 0, 0.85), 0 0 25px rgba(180, 147, 93, 0.2)'
            : '0 4px 15px rgba(0, 0, 0, 0.4)',
        }}
        className={`relative p-5 rounded-2xl bg-[#0e1014] border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-default ${
          isHovered ? 'border-[#b89965]/70' : 'border-[#1d2026]'
        }`}
      >
        {/* Dynamic Spotlight Radial Overlay (Follows Mouse Cursor) */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300 z-10"
            style={{
              background: `radial-gradient(280px circle at ${tilt.x}px ${tilt.y}px, rgba(210, 185, 138, 0.18), transparent 70%)`,
            }}
          />
        )}

        {/* Card Main Body */}
        <div style={{ transform: isHovered ? 'translateZ(15px)' : 'translateZ(0px)', transition: 'transform 0.2s ease-out' }}>
          <div className="flex items-start gap-4 mb-3">
            {/* Software Icon */}
            <div
              style={{ transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)', transition: 'transform 0.2s ease-out' }}
              className="w-12 h-12 rounded-xl overflow-hidden bg-[#181a20] border border-[#2a2d36] flex-shrink-0 flex items-center justify-center p-1 shadow-md"
            >
              <img
                src={skill.iconUrl}
                alt={skill.name}
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Software Name & Proficiency */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-medium text-[#f0e8db] truncate group-hover:text-[#f3e3ca] transition-colors">
                  {skill.name}
                </h4>
                <span
                  style={{ transform: isHovered ? 'translateZ(22px)' : 'translateZ(0px)', transition: 'transform 0.2s ease-out' }}
                  className="font-orbitron text-xs font-semibold text-[#b89965] bg-[#b89965]/10 px-2.5 py-0.5 rounded-full border border-[#b89965]/20 tabular-nums shadow-sm"
                >
                  {animatedValue}%
                </span>
              </div>
              <p className="text-[11px] text-[#7a766e] mt-1 line-clamp-2">
                {skill.description || '精通软件常用功能与实战应用'}
              </p>
            </div>
          </div>

          {/* Progress bar with charging glowing energy */}
          <div
            style={{ transform: isHovered ? 'translateZ(16px)' : 'translateZ(0px)', transition: 'transform 0.2s ease-out' }}
            className="h-1.5 w-full bg-[#1b1e24] rounded-full overflow-hidden mt-3 relative border border-white/[0.03] p-[0.5px]"
          >
            <div
              className="h-full bg-gradient-to-r from-[#8e7047] via-[#b4935d] to-[#f2dfbf] rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(180,147,93,0.4)]"
              style={{
                width: isVisible ? `${numericProficiency}%` : '0%',
                transitionDelay: `${index * 80}ms`,
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
            </div>
          </div>
        </div>

        {/* Card Action Buttons (Admin Only) */}
        {isAdmin && (
          <div
            style={{ transform: isHovered ? 'translateZ(18px)' : 'translateZ(0px)', transition: 'transform 0.2s ease-out' }}
            className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#181a20] opacity-80 hover:opacity-100 transition-opacity z-20"
          >
            <button
              type="button"
              onClick={() => onEdit(skill)}
              className="text-[11px] text-[#9e978b] hover:text-[#f0e8db] transition-colors px-2.5 py-1 rounded bg-[#181a20] hover:bg-[#252834] cursor-pointer"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => onDelete(skill.id)}
              className="text-[11px] text-[#a85353] hover:text-[#f27474] transition-colors px-2.5 py-1 rounded bg-[#181a20] hover:bg-red-950/40 cursor-pointer"
            >
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Skills: React.FC = () => {
  const { isAdmin, openLoginModal } = useAdmin();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // In-view observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Core Professional Skills State
  const [coreSkills, setCoreSkills] = useState<Skill[]>(DEFAULT_CORE_SKILLS);
  const [isCoreEditModalOpen, setIsCoreEditModalOpen] = useState(false);
  const [editingCoreSkills, setEditingCoreSkills] = useState<Skill[]>(DEFAULT_CORE_SKILLS);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Load Core Skills Persistent Data from Supabase & local
  useEffect(() => {
    let isMounted = true;
    const loadCoreSkills = async () => {
      try {
        const saved = await fetchSectionData<Skill[]>(
          'skills',
          'core_skills',
          CORE_SKILLS_STORAGE_KEY,
          DEFAULT_CORE_SKILLS
        );
        if (isMounted && saved && Array.isArray(saved) && saved.length > 0) {
          setCoreSkills(saved);
        }
      } catch (err) {
        console.error('Failed to load core skills:', err);
      }
    };
    loadCoreSkills();
    return () => {
      isMounted = false;
    };
  }, []);

  // Software skills state with local and cloud persistence
  const defaultSoftwareSkills: SoftwareSkill[] = __FILE_DEFAULT_SOFTWARE_SKILLS__;

  const [softwareSkills, setSoftwareSkills] = useState<SoftwareSkill[]>(defaultSoftwareSkills);

  // Load Software skills from Supabase and local cache
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await fetchSectionData<SoftwareSkill[]>(
          'skills',
          'software_skills',
          SOFTWARE_SKILLS_STORAGE_KEY,
          defaultSoftwareSkills
        );
        if (isMounted && saved && Array.isArray(saved) && saved.length > 0) {
          setSoftwareSkills(saved);
        }
      } catch (e) {
        console.error('Failed to load software skills:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SoftwareSkill | null>(null);
  const [iconUploadTab, setIconUploadTab] = useState<'upload' | 'url'>('upload');
  const [isProcessingIcon, setIsProcessingIcon] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  // Form state for software skill
  const [formData, setFormData] = useState({
    name: '',
    category: '2d' as SoftwareSkill['category'],
    proficiency: 85,
    iconUrl: '',
    description: ''
  });

  const handleIconFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片格式文件 (PNG, JPG, SVG, WebP)');
      return;
    }
    setIsProcessingIcon(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          setFormData((prev) => ({ ...prev, iconUrl: compressed }));
        }
        setIsProcessingIcon(false);
      };
      img.onerror = () => {
        setIsProcessingIcon(false);
        alert('解析图标失败');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingIcon(false);
      alert('读取文件失败');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    localStorage.setItem(SOFTWARE_SKILLS_STORAGE_KEY, JSON.stringify(softwareSkills));
  }, [softwareSkills]);

  const categories = [
    { id: 'all', label: '全部软件', icon: Layout },
    { id: '2d', label: '二维制图', icon: Layers },
    { id: '3d', label: '三维建模', icon: Wrench },
    { id: 'render', label: '平面设计', icon: Palette },
    { id: 'presentation', label: '提案排版', icon: Laptop },
  ];

  const filteredSkills = activeCategory === 'all' 
    ? softwareSkills 
    : softwareSkills.filter(s => s.category === activeCategory);

  // --- CORE PROFESSIONAL SKILLS ACTIONS ---
  const handleOpenCoreEdit = () => {
    if (!isAdmin) {
      openLoginModal();
      return;
    }
    setEditingCoreSkills(JSON.parse(JSON.stringify(coreSkills)));
    setIsCoreEditModalOpen(true);
  };

  const handleSaveCoreSkills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Filter out completely empty items
    const validSkills = editingCoreSkills.filter(s => s.name.trim().length > 0);
    if (validSkills.length === 0) {
      alert('请至少保留一项专业技能！');
      return;
    }

    setCoreSkills(validSkills);
    const result = await saveSectionData<Skill[]>(
      'skills',
      'core_skills',
      CORE_SKILLS_STORAGE_KEY,
      validSkills
    );

    // Also sync to section: 'skills', field_name: 'text' for raw access
    if (isSupabaseConfigured()) {
      await upsertSiteContent('skills', 'text', JSON.stringify(validSkills));
    }

    setIsCoreEditModalOpen(false);
    triggerToast(
      result.cloudSynced
        ? '专业技能与熟练度已成功保存并同步至 Supabase 云端！'
        : '专业技能与熟练度已成功保存至本地！'
    );
  };

  const handleResetCoreSkills = () => {
    setEditingCoreSkills(JSON.parse(JSON.stringify(DEFAULT_CORE_SKILLS)));
    triggerToast('已重置为默认技能配置（点击保存后生效）');
  };

  const handleAddCoreSkillItem = () => {
    const newItem: Skill = {
      id: Date.now().toString(),
      name: '新专业技能',
      enName: 'New Skill Proficiency',
      percentage: 85
    };
    setEditingCoreSkills([...editingCoreSkills, newItem]);
  };

  const handleDeleteCoreSkillItem = (index: number) => {
    if (editingCoreSkills.length <= 1) {
      alert('至少需要保留 1 项专业技能');
      return;
    }
    const updated = editingCoreSkills.filter((_, i) => i !== index);
    setEditingCoreSkills(updated);
  };

  const handleUpdateCoreSkillItem = (index: number, field: keyof Skill, value: any) => {
    const updated = [...editingCoreSkills];
    updated[index] = {
      ...updated[index],
      [field]: field === 'percentage' ? Math.min(100, Math.max(0, Number(value) || 0)) : value
    };
    setEditingCoreSkills(updated);
  };

  // --- SOFTWARE SKILLS ACTIONS ---
  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingSkill(null);
    setFormData({
      name: '',
      category: '2d',
      proficiency: 85,
      iconUrl: '',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (skill: SoftwareSkill) => {
    if (!isAdmin) return;
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiency: typeof skill.proficiency === 'number' ? skill.proficiency : 85,
      iconUrl: skill.iconUrl || '',
      description: skill.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('确定要删除该软件技能吗？')) {
      const updated = softwareSkills.filter(s => s.id !== id);
      setSoftwareSkills(updated);
      await saveSectionData<SoftwareSkill[]>(
        'skills',
        'software_skills',
        SOFTWARE_SKILLS_STORAGE_KEY,
        updated
      );
      triggerToast('软件技能已删除并同步');
    }
  };

  const handleResetDefault = async () => {
    if (!isAdmin) return;
    if (confirm('确定要重置恢复为默认软件技能列表吗？')) {
      setSoftwareSkills(defaultSoftwareSkills);
      await saveSectionData<SoftwareSkill[]>(
        'skills',
        'software_skills',
        SOFTWARE_SKILLS_STORAGE_KEY,
        defaultSoftwareSkills
      );
      triggerToast('软件技能已恢复默认配置并同步');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let finalIconUrl = formData.iconUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80';

    // If icon is base64 and Supabase is configured, upload to Storage assets bucket
    if (finalIconUrl.startsWith('data:') && isSupabaseConfigured()) {
      try {
        finalIconUrl = await uploadAssetToStorage(finalIconUrl, 'software_icon');
      } catch (err) {
        console.warn('Software icon upload to Supabase failed, using dataURL:', err);
      }
    }

    let updatedList: SoftwareSkill[];
    if (editingSkill) {
      updatedList = softwareSkills.map(s => s.id === editingSkill.id ? {
        ...s,
        ...formData,
        iconUrl: finalIconUrl
      } : s);
      triggerToast('软件技能已更新并同步');
    } else {
      const newSkill: SoftwareSkill = {
        id: Date.now().toString(),
        ...formData,
        iconUrl: finalIconUrl
      };
      updatedList = [...softwareSkills, newSkill];
      triggerToast('新软件技能已添加并同步');
    }

    setSoftwareSkills(updatedList);
    await saveSectionData<SoftwareSkill[]>(
      'skills',
      'software_skills',
      SOFTWARE_SKILLS_STORAGE_KEY,
      updatedList
    );

    setIsAddModalOpen(false);
  };

  return (
    <section ref={sectionRef} id="skills" className="py-28 px-6 sm:px-12 bg-[#07090b] border-y border-[#17191c] relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#14161f]/95 border border-[#b4935d]/60 text-[#f2dfbf] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-full bg-[#b4935d] text-[#08090c]">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-20">
        {/* Top Heading & Core Skills Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#b89965] animate-pulse" />
              <p className="font-orbitron text-xs tracking-[0.4em] text-[#b89965]">
                PROFESSIONAL SKILL PROFICIENCY
              </p>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide text-[#eee7db]">
              专业技能熟练度
            </h2>
          </div>

          {/* Admin Edit Trigger */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                id="edit-core-skills-btn"
                onClick={handleOpenCoreEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b4935d]/15 hover:bg-[#b4935d] border border-[#b4935d]/40 text-[#cbb082] hover:text-[#08090c] text-xs font-orbitron font-medium transition-all duration-300 shadow-md cursor-pointer"
                title="编辑专业技能文字与自由调节百分比数值"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>编辑文字与调节熟练度</span>
              </button>
            </div>
          )}
        </div>

        {/* Core Skills Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Skill Progress Bars (Left Side) */}
          <div className="space-y-3 p-2 sm:p-4 rounded-2xl bg-[#0c0e13]/60 border border-[#1d2029]">
            {coreSkills.map((skill, index) => (
              <AnimatedSkillBar
                key={skill.id || skill.name || index}
                skill={skill}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>

          {/* Circular Skill Radial Rings (Right Side) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-4 sm:gap-6">
            {coreSkills.map((ring, index) => (
              <AnimatedSkillRing
                key={ring.id || ring.name || index}
                ring={ring}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>

        {/* Software & Tools Section */}
        <div className="pt-12 border-t border-[#1a1c20]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="font-orbitron text-xs tracking-[0.3em] text-[#b89965] mb-2">
                DESIGN SOFTWARE PROFICIENCY
              </p>
              <h3 className="text-2xl sm:text-3xl font-light text-[#eee7db]">
                掌握的设计软件熟练度
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetDefault}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2d2e34] text-xs text-[#9a958c] hover:text-[#eee7db] hover:border-[#4a4740] transition-colors cursor-pointer"
                  title="恢复默认软件技能"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重置
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#9e8052] to-[#cbb287] text-[#0d0f12] font-medium text-xs sm:text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(180,147,93,0.2)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  添加软件/图标
                </button>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? 'border-[#b89965] bg-[#b89965]/10 text-[#f2dfbf] font-medium'
                      : 'border-[#1f2127] bg-[#121418] text-[#8a857c] hover:border-[#3a3d46] hover:text-[#d1ccc0]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Software Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSkills.map((skill, idx) => (
              <AnimatedSoftwareCard
                key={skill.id}
                skill={skill}
                index={idx}
                isVisible={isVisible}
                isAdmin={isAdmin}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* --- MODAL 1: CORE PROFESSIONAL SKILLS EDIT & PERCENTAGE ADJUSTMENT (ADMIN ONLY) --- */}
        {isAdmin && isCoreEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/85 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e1017] border border-[#262b3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#1f2433] flex items-center justify-between bg-[#12151f]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#b4935d]/15 text-[#cbb082] border border-[#b4935d]/30">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-[#eee7db] flex items-center gap-2">
                      编辑专业技能与自由调节熟练度
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#b4935d]/20 text-[#cbb082] font-orbitron">
                        ADMIN EDIT
                      </span>
                    </h3>
                    <p className="text-xs text-[#716d68] mt-0.5">
                      支持实时修改技能中文/英文名称、拖动滑块或输入具体百分比数值 (0% - 100%)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCoreEditModalOpen(false)}
                  className="p-2 rounded-xl text-[#716d68] hover:text-[#eee7db] hover:bg-[#1c2230] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <form onSubmit={handleSaveCoreSkills} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-4">
                  {editingCoreSkills.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="p-4 rounded-xl bg-[#141722] border border-[#222838] hover:border-[#b4935d]/40 transition-colors space-y-3"
                    >
                      {/* Top Bar: Item Index & Delete Button */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-orbitron font-semibold text-[#b4935d]">
                          SKILL 0{index + 1}
                        </span>
                        {editingCoreSkills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCoreSkillItem(index)}
                            className="p-1 rounded-lg text-[#716d68] hover:text-[#e06c75] hover:bg-[#1f1d24] transition-colors cursor-pointer"
                            title="删除此项技能"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Text Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#8e877a]">中文技能名称 *</label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleUpdateCoreSkillItem(index, 'name', e.target.value)}
                            placeholder="如: 软装方案设计"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#8e877a]">英文副标 / 补充说明</label>
                          <input
                            type="text"
                            value={item.enName || ''}
                            onChange={(e) => handleUpdateCoreSkillItem(index, 'enName', e.target.value)}
                            placeholder="如: Soft Furnishing Scheme Design"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0d0f17] border border-[#2c3244] text-[#eee7db] text-xs focus:border-[#b4935d] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Numerical Adjustment Controls: Slider & Number Box */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#cbb082] font-medium flex items-center gap-1.5">
                            <Sliders className="w-3 h-3 text-[#b4935d]" /> 熟练度调节
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.percentage}
                              onChange={(e) => handleUpdateCoreSkillItem(index, 'percentage', e.target.value)}
                              className="w-14 px-2 py-0.5 rounded bg-[#0d0f17] border border-[#2c3244] text-center font-orbitron font-semibold text-[#b4935d] text-xs focus:border-[#b4935d] focus:outline-none"
                            />
                            <span className="text-xs text-[#8e877a] font-orbitron">%</span>
                          </div>
                        </div>

                        {/* Interactive Range Slider */}
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={item.percentage}
                            onChange={(e) => handleUpdateCoreSkillItem(index, 'percentage', e.target.value)}
                            className="w-full accent-[#b4935d] bg-[#0d0f17] h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Visual Live Preview Bar */}
                        <div className="h-1.5 w-full bg-[#0d0f17] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8e7047] via-[#b4935d] to-[#f2dfbf] rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Skill Button */}
                <button
                  type="button"
                  onClick={handleAddCoreSkillItem}
                  className="w-full py-2.5 rounded-xl border border-dashed border-[#2d3345] hover:border-[#b4935d] text-[#8e877a] hover:text-[#cbb082] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加一项新专业技能</span>
                </button>

                {/* Modal Footer Controls */}
                <div className="pt-4 border-t border-[#1f2433] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetCoreSkills}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#8e877a] hover:text-[#eee7db] hover:bg-[#1a1e2b] text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>恢复初始默认</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsCoreEditModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#171b26] hover:bg-[#202534] text-[#a9a29a] text-xs transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#b4935d] hover:bg-[#cbb082] text-[#08090c] font-medium text-xs transition-colors shadow-lg cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>保存技能与熟练度</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 2: SOFTWARE SKILLS ADD/EDIT (ADMIN ONLY) --- */}
        {isAdmin && isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#111318] border border-[#2d303a] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#21242d] pb-4">
                <h3 className="text-lg font-medium text-[#eee7db]">
                  {editingSkill ? '编辑软件技能' : '添加软件 / 图标'}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#7f7a70] hover:text-[#eee7db] p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Software Name */}
                <div>
                  <label className="block text-xs text-[#a09a8e] mb-1">软件名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如: Rhino, Revit, Enscape..."
                    className="w-full px-3 py-2 bg-[#181b22] border border-[#2b2e38] rounded-xl text-sm text-[#eee7db] focus:border-[#b89965] outline-none transition-colors"
                  />
                </div>

                {/* Software Category */}
                <div>
                  <label className="block text-xs text-[#a09a8e] mb-1">软件分类</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as SoftwareSkill['category'] })}
                    className="w-full px-3 py-2 bg-[#181b22] border border-[#2b2e38] rounded-xl text-sm text-[#eee7db] focus:border-[#b89965] outline-none transition-colors"
                  >
                    <option value="2d">二维制图 (2D)</option>
                    <option value="3d">三维建模 (3D)</option>
                    <option value="render">平面设计 (Graphic Design)</option>
                    <option value="presentation">提案排版 (Presentation)</option>
                  </select>
                </div>

                {/* Software Icon Upload & URL */}
                <div className="space-y-2">
                  <label className="block text-xs text-[#a09a8e]">软件图标 / LOGO *</label>

                  <div className="flex items-center gap-2 p-1 bg-[#141720] border border-[#262a36] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIconUploadTab('upload')}
                      className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                        iconUploadTab === 'upload'
                          ? 'bg-[#b4935d] text-[#08090c]'
                          : 'text-[#8e877a] hover:text-[#eee7db]'
                      }`}
                    >
                      本地图标上传
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconUploadTab('url')}
                      className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                        iconUploadTab === 'url'
                          ? 'bg-[#b4935d] text-[#08090c]'
                          : 'text-[#8e877a] hover:text-[#eee7db]'
                      }`}
                    >
                      图标外链 URL
                    </button>
                  </div>

                  {iconUploadTab === 'upload' ? (
                    <div>
                      <input
                        ref={iconFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleIconFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <div
                        onClick={() => iconFileInputRef.current?.click()}
                        className="border border-dashed border-[#2b3040] hover:border-[#b4935d] rounded-xl p-3 text-center cursor-pointer bg-[#151822] hover:bg-[#181d2a] transition-all flex items-center justify-center gap-2 text-xs text-[#cbb082]"
                      >
                        <Upload className="w-4 h-4 text-[#b4935d]" />
                        <span>{isProcessingIcon ? '正在处理图标...' : '点击选择本地图标图片并嵌入'}</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.iconUrl}
                      onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                      placeholder="https://... (支持 PNG / SVG / JPG)"
                      className="w-full px-3 py-2 bg-[#181b22] border border-[#2b2e38] rounded-xl text-xs text-[#eee7db] focus:border-[#b89965] outline-none transition-colors"
                    />
                  )}

                  {/* Icon Thumbnail Preview */}
                  {formData.iconUrl && (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#141722] border border-[#262b3a]">
                      <div className="w-9 h-9 rounded-lg bg-black/50 p-1 border border-white/10 flex items-center justify-center shrink-0">
                        <img
                          src={formData.iconUrl}
                          alt="Icon Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-[#8e877a] truncate font-mono">
                        {formData.iconUrl.startsWith('data:') ? '已成功转换为本地持久化代码' : formData.iconUrl}
                      </div>
                    </div>
                  )}
                </div>

                {/* Proficiency Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-[#a09a8e]">熟练度 (%)</label>
                    <span className="font-orbitron text-xs text-[#b89965] font-semibold">{formData.proficiency}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={formData.proficiency}
                    onChange={e => setFormData({ ...formData, proficiency: Number(e.target.value) })}
                    className="w-full accent-[#b89965] bg-[#1d2028] h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a09a8e] mb-1">技能描述 / 应用场景</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="简要描述软件使用经验与擅长方向..."
                    className="w-full px-3 py-2 bg-[#181b22] border border-[#2b2e38] rounded-xl text-sm text-[#eee7db] focus:border-[#b89965] outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#2a2d36] text-xs text-[#a09a8e] hover:text-[#eee7db] transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9e8052] to-[#cbb287] text-[#0d0f12] font-medium text-xs hover:brightness-110 transition-all shadow-[0_0_12px_rgba(180,147,93,0.2)] cursor-pointer"
                  >
                    {editingSkill ? '保存修改' : '确认添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quote Banner */}
        <blockquote className="text-center pt-8 border-t border-[#1b1d22] text-[#b89b6d] text-base sm:text-lg font-light tracking-widest italic">
          “以创意为灵，以技术为魂，一个脑洞乱飞不寻常的设计师”
        </blockquote>
      </div>
    </section>
  );
};
