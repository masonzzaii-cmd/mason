export interface Project {
  id: string;
  number: string;
  title: string;
  category: '别墅私宅' | '商业展厅' | '房地产样板房' | '私人客户' | '品牌单店' | string;
  brand: string; // 服务品牌，例如 "保利发展 / POLY", "华润置地", "铂尼斯·艺术家"
  year: string; // 项目年份日期，例如 "2024.05", "2023"
  location: string;
  description: string;
  details: string;
  scope: string[];
  materials: string[];
  tags: string[];
  imageUrl: string; // 封面图
  galleryImages: string[]; // 落地实景照片图集
  pdfUrl?: string; // 方案PDF格式文件
  pdfFileName?: string; // PDF文件名称
  gradient?: string;
}

export interface Skill {
  id?: string;
  name: string;
  enName?: string;
  percentage: number;
}

export interface SoftwareSkill {
  id: string;
  name: string;
  code?: string; // e.g. "Ps", "CAD", "Id", "Ai"
  category: string; // e.g. "平面绘图", "3D建模", "排版呈现"
  percentage?: number;
  proficiency?: string | number;
  iconUrl?: string;
  color?: string; // hex color for icon glow
  description: string;
  isCustom?: boolean;
}

export interface Experience {
  id?: string;
  period: string;
  company: string;
  role: string;
  description: string;
  highlights: string[];
}

export interface Honor {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  year?: string;
  issuer?: string;
}

export interface AboutFact {
  id: string;
  icon: 'calendar' | 'mapPin' | 'compass' | 'award' | 'user' | 'sparkles';
  label: string;
  value: string;
}

export interface AboutData {
  subtitle: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  facts: AboutFact[];
  resumeText: string;
  resumeUrl: string;
}

export interface ContactData {
  subtitle: string;
  title: string;
  intro: string;
  email: string;
  phone: string;
  location: string;
  social: string;
}

export interface HeroData {
  greeting: string;
  name: string;
  slogan: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  email: string;
  phone: string;
}

export interface BrandPartner {
  id: string;
  name: string; // 品牌中文名，如 "保利发展控股"
  enName: string; // 品牌英文名，如 "POLY DEVELOPMENTS"
  category: string; // 空间类别/品牌类型，如 "头部央企地产" | "高端定制家居" | "美学生活空间" | "艺术机构" | "商业地标"
  logoUrl?: string; // 品牌 Logo 图片或 SVG
  logoSymbol?: string; // 英文缩写/标志代码，如 "POLY", "CR LAND", "OPPEIN"
  description?: string; // 合作概述与项目范畴
  highlightProject?: string; // 代表合作项目
  tags?: string[]; // 标签
}
