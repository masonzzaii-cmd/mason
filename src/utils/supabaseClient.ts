import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getPersistentItem, setPersistentItem } from './persistentStorage';

// 硬编码的 Supabase Project URL 和 anon public key（不依赖任何 .env 或环境变量）
export const SUPABASE_PROJECT_URL = 'https://hgpjqsjqlliblmjibitm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGpxc2pxbGxpYmxtamliaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTgxNDUsImV4cCI6MjEwMzEzNDE0NX0.IDWEJJEw4CIWamdleZygkMzseghvnlIO8aozusdTpbs';

/**
 * 获取当前生效的 Supabase Project URL (直接返回硬编码值)
 */
export function getSupabaseUrl(): string {
  return SUPABASE_PROJECT_URL;
}

/**
 * 获取当前生效的 Supabase anon public key (直接返回硬编码值)
 */
export function getSupabaseAnonKey(): string {
  return SUPABASE_ANON_KEY;
}

/**
 * 保持兼容性的空操作函数
 */
export function setCustomSupabaseConfig(_url?: string, _anonKey?: string): void {}

/**
 * 检查 Supabase 是否已配置有效凭据（永远返回 true）
 */
export function isSupabaseConfigured(): boolean {
  return true;
}

// Cached client singleton
let cachedClient: SupabaseClient | null = null;

/**
 * 获取或初始化 Supabase 客户端实例 (使用硬编码凭据)
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    // 优先使用 window.supabase (CDN 引入)，若不存在则使用 npm 包
    if (typeof window !== 'undefined' && (window as any).supabase?.createClient) {
      cachedClient = (window as any).supabase.createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
    } else {
      cachedClient = createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );
    }
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    cachedClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
    return cachedClient;
  }
}

/**
 * 将 Base64 DataURI 字符串转换成 Blob 对象
 */
export function dataURItoBlob(dataURI: string): { blob: Blob; ext: string } {
  const arr = dataURI.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(arr[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  let ext = 'jpg';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('svg')) ext = 'svg';
  else if (mime.includes('pdf')) ext = 'pdf';

  return {
    blob: new Blob([ab], { type: mime }),
    ext,
  };
}

/**
 * 上传文件 (File、Blob 或 Base64 DataURI) 到 Supabase 的 assets 存储桶，并返回可公开访问的 CDN URL
 */
export async function uploadAssetToStorage(
  fileOrBase64: File | Blob | string,
  fileNamePrefix: string = 'media'
): Promise<string> {
  const supabase = getSupabaseClient();

  let uploadBody: File | Blob;
  let fileExt = 'jpg';
  let mimeType = 'image/jpeg';

  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('data:')) {
      const converted = dataURItoBlob(fileOrBase64);
      uploadBody = converted.blob;
      fileExt = converted.ext;
      mimeType = uploadBody.type;
    } else if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
      // 已经是网络 URL，直接返回
      return fileOrBase64;
    } else {
      throw new Error('不支持的文件字符串格式');
    }
  } else {
    uploadBody = fileOrBase64;
    mimeType = fileOrBase64.type || 'application/octet-stream';
    if (fileOrBase64 instanceof File && fileOrBase64.name) {
      const nameParts = fileOrBase64.name.split('.');
      if (nameParts.length > 1) {
        fileExt = nameParts.pop()?.toLowerCase() || 'jpg';
      }
    } else if (mimeType.includes('png')) fileExt = 'png';
    else if (mimeType.includes('pdf')) fileExt = 'pdf';
    else if (mimeType.includes('webp')) fileExt = 'webp';
  }

  // 生成唯一且安全的文件路径: uploads/section_timestamp_random.ext
  const cleanPrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `uploads/${cleanPrefix}_${uniqueId}.${fileExt}`;

  // 1. 上传到 assets 存储桶
  const { error } = await supabase.storage
    .from('assets')
    .upload(filePath, uploadBody, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`文件上传至 assets 存储桶失败: ${error.message}`);
  }

  // 2. 获取公开访问链接
  const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('获取已上传文件的公开链接失败');
  }

  return urlData.publicUrl;
}

/**
 * 更新或插入记录到 site_content 表 (Upsert logic)
 * 如果已存在则更新 content 与 updated_at，如果不存在则插入新行
 */
export async function upsertSiteContent(
  section: string,
  fieldName: string,
  content: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    // 1. 查询该 section + field_name 是否已存在
    const { data: existingRows, error: selectErr } = await supabase
      .from('site_content')
      .select('id')
      .eq('section', section)
      .eq('field_name', fieldName)
      .limit(1);

    if (selectErr) {
      console.warn('site_content select error, attempting direct insert/upsert:', selectErr);
    }

    if (existingRows && existingRows.length > 0) {
      // 2. 更新已有记录
      const rowId = existingRows[0].id;
      const { error: updateErr } = await supabase
        .from('site_content')
        .update({
          content,
          updated_at: now,
        })
        .eq('id', rowId);

      if (updateErr) {
        console.error(`Failed to update site_content (${section}.${fieldName}):`, updateErr);
        return false;
      }
      return true;
    } else {
      // 3. 插入新记录
      const { error: insertErr } = await supabase
        .from('site_content')
        .insert([
          {
            section,
            field_name: fieldName,
            content,
            updated_at: now,
          },
        ]);

      if (insertErr) {
        console.error(`Failed to insert site_content (${section}.${fieldName}):`, insertErr);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error(`Error saving site_content (${section}.${fieldName}):`, err);
    return false;
  }
}

/**
 * 从 Supabase site_content 读取单个板块某个字段的内容
 */
export async function fetchSiteContent(
  section: string,
  fieldName: string
): Promise<string | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('content')
      .eq('section', section)
      .eq('field_name', fieldName)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn(`Failed to fetch site_content for ${section}.${fieldName}:`, error);
      return null;
    }

    if (data && data.length > 0 && data[0].content !== null && data[0].content !== undefined) {
      return data[0].content;
    }
    return null;
  } catch (err) {
    console.warn(`Error fetching site_content for ${section}.${fieldName}:`, err);
    return null;
  }
}

/**
 * 高级封装：读取结构化数据 (JSON 对象或数组)
 *
 * 优先级 (LOCAL FIRST / 本地优先)：
 *   1. 同步 localStorage 快照键 (刷新后 0ms 命中，保证首屏就是用户保存的内容)  ← fetchSectionData 内部用异步，但配套的 snapshotSyncRead 直接同步读
 *   2. 本地 IndexedDB / LocalStorage (getPersistentItem)
 *   3. Supabase 云端 (3s 超时，超期就返回本地数据，避免 iframe 预览下 CSP 卡 30s)
 *   4. 传入的 fallback 默认数据
 *
 * 设计目标：iframe 预览 / 跨域隐私保护时，哪怕 Supabase 和 IndexedDB 都失败，
 * 也要能从 localStorage 快照读回来。
 */
export async function fetchSectionData<T>(
  section: string,
  fieldName: string,
  localStorageKey: string,
  fallback: T
): Promise<T> {
  // =============================================================
  // Step 1. 本地 localStorage 同步快照（最快，0ms 读）
  // =============================================================
  try {
    const snap = snapshotSyncRead<T>(localStorageKey);
    if (snap) {
      // 如果命中快照，我们仍然异步启动一次 Supabase 拉取 + 本地回写
      // (不阻塞返回) —— 保证用户刷新瞬间看到最新内容
      scheduleCloudSyncIfNeeded(section, fieldName, localStorageKey, snap).catch(() => {});
      return snap;
    }
  } catch (e) {
    console.warn(`[fetchSectionData] snapshot sync read failed for ${localStorageKey}:`, e);
  }

  // =============================================================
  // Step 2. 本地 IndexedDB (getPersistentItem) + localStorage chunked fallback
  // =============================================================
  try {
    const local = await getPersistentItem<T>(localStorageKey);
    if (local !== null && local !== undefined) {
      // 写回同步快照，下次 0ms 命中
      snapshotSyncWrite(localStorageKey, local);
      scheduleCloudSyncIfNeeded(section, fieldName, localStorageKey, local).catch(() => {});
      return local;
    }
  } catch (e) {
    console.warn(`Local persistent storage read failed for ${localStorageKey}:`, e);
  }

  // =============================================================
  // Step 3. Supabase 云端 (带 3 秒超时保护，防止 iframe 环境 CSP / 网络卡死)
  // =============================================================
  try {
    const cloudContent = await withTimeout(
      fetchSiteContent(section, fieldName),
      3000,
      `site_content.${section}.${fieldName} fetch timeout`
    );
    if (cloudContent && cloudContent.trim()) {
      try {
        const parsed = JSON.parse(cloudContent) as T;
        // 云端是最新的，同步写回本地两级存储 + 同步快照 (下次刷新就快了)
        await setPersistentItem(localStorageKey, parsed);
        snapshotSyncWrite(localStorageKey, parsed);
        return parsed;
      } catch {
        return cloudContent as unknown as T;
      }
    }
  } catch (e) {
    console.warn(
      `[fetchSectionData] Supabase skipped/failed for ${section}.${fieldName}, falling back to defaults:`,
      (e as any)?.message || e
    );
  }

  // =============================================================
  // Step 4. 返回默认数据 (也写入同步快照，避免每次刷新都重新走这一圈)
  // =============================================================
  try {
    snapshotSyncWrite(localStorageKey, fallback);
  } catch {}
  return fallback;
}

/** Promise 超时包装：超时后 reject，避免 iframe 下请求卡住 */
function withTimeout<T>(promise: Promise<T>, ms: number, reason: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(reason || 'Timeout')), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * 后台异步：用当前已有的本地数据作为"乐观缓存"，然后去 Supabase 拉最新
 * 如果 Supabase 返回了和本地不一样的新数据，就刷新本地两级存储 + 同步快照
 * (本函数永远不 throw，调用方也不 await)
 */
async function scheduleCloudSyncIfNeeded<T>(
  section: string,
  fieldName: string,
  localStorageKey: string,
  currentLocal: T
): Promise<void> {
  try {
    // 给它 5 秒慢慢跑，不阻塞用户
    const cloudContent = await withTimeout(
      fetchSiteContent(section, fieldName),
      5000,
      'cloud sync timeout (background)'
    );
    if (!cloudContent || !cloudContent.trim()) return;
    try {
      const parsed = JSON.parse(cloudContent) as T;
      // 仅当云端确实"不一样"（更新）时覆盖本地
      const cloudJson = JSON.stringify(parsed);
      const localJson = JSON.stringify(currentLocal);
      if (cloudJson !== localJson) {
        await setPersistentItem(localStorageKey, parsed);
        snapshotSyncWrite(localStorageKey, parsed);
      }
    } catch {}
  } catch {}
}

// ======================================================================
// 同步 localStorage 快照读写（完全绕过异步 IndexedDB / Supabase 包装函数）
// 用于 useState 初始化同步读，保证第一次 render 就是用户保存的内容
// 键名约定：snapshotPrefix.<localStorageKey>
// 另实现分片写入（应对 5MB 单键限制）
// ======================================================================
const SNAP_KEY_PREFIX = '__SNAP_V2__.';
const SNAP_CHUNK_SIZE = 900 * 1024; // 每片约 900KB

function safeLSGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeLSSet(k: string, v: string): boolean {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}

function safeLSDel(k: string): void {
  try {
    localStorage.removeItem(k);
  } catch {}
}

function snapClearOld(base: string): void {
  const prefix = `${SNAP_KEY_PREFIX}${base}.`;
  const toRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
  } catch {}
  toRemove.forEach(safeLSDel);
  safeLSDel(`${SNAP_KEY_PREFIX}${base}`);
}

export function snapshotSyncWrite<T>(baseKey: string, value: T): boolean {
  const fullBase = `${SNAP_KEY_PREFIX}${baseKey}`;
  snapClearOld(fullBase);
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length < SNAP_CHUNK_SIZE) {
      return safeLSSet(fullBase, serialized);
    }
    // 分片写入
    const total = Math.ceil(serialized.length / SNAP_CHUNK_SIZE);
    if (!safeLSSet(`${fullBase}.n`, String(total))) {
      snapClearOld(fullBase);
      return false;
    }
    for (let i = 0; i < total; i++) {
      const piece = serialized.substring(i * SNAP_CHUNK_SIZE, (i + 1) * SNAP_CHUNK_SIZE);
      if (!safeLSSet(`${fullBase}.${i}`, piece)) {
        snapClearOld(fullBase);
        return false;
      }
    }
    return true;
  } catch {
    snapClearOld(fullBase);
    return false;
  }
}

export function snapshotSyncRead<T>(baseKey: string): T | null {
  const fullBase = `${SNAP_KEY_PREFIX}${baseKey}`;
  // 1) 单键直接读
  const single = safeLSGet(fullBase);
  if (single !== null) {
    try {
      return JSON.parse(single) as T;
    } catch {
      safeLSDel(fullBase);
    }
  }
  // 2) 分片
  const totalStr = safeLSGet(`${fullBase}.n`);
  if (!totalStr) return null;
  const total = parseInt(totalStr, 10);
  if (!Number.isFinite(total) || total <= 0 || total > 1024) {
    snapClearOld(fullBase);
    return null;
  }
  const pieces: string[] = [];
  for (let i = 0; i < total; i++) {
    const p = safeLSGet(`${fullBase}.${i}`);
    if (p === null) {
      snapClearOld(fullBase);
      return null;
    }
    pieces.push(p);
  }
  try {
    return JSON.parse(pieces.join('')) as T;
  } catch {
    snapClearOld(fullBase);
    return null;
  }
}

/**
 * 高级封装：双写保存数据 (同时写入 Supabase 云端数据库 + 本地 IndexedDB/LocalStorage + 同步快照)
 * 写入顺序（按"刷新后能读回来"的可靠性排序）：
 *   1. localStorage 同步快照 (0ms 读回，首屏渲染用)
 *   2. setPersistentItem -> IndexedDB + chunked localStorage + 远端 Supabase
 *   3. upsertSiteContent -> Supabase site_content 表 (另一套云端表)
 */
export async function saveSectionData<T>(
  section: string,
  fieldName: string,
  localStorageKey: string,
  data: T
): Promise<{ success: boolean; cloudSynced: boolean }> {
  // 1. ✅ 第一时间写"同步 localStorage 快照"——这是刷新后首屏渲染能否立刻命中的关键
  //    (完全同步操作，无 await，浏览器写入 localStorage 是持久化的)
  try {
    snapshotSyncWrite(localStorageKey, data);
  } catch (e) {
    console.error(`snapshotSyncWrite failed for ${localStorageKey}:`, e);
  }

  // 2. 保存到本地 IndexedDB / LocalStorage (保证瞬间响应不卡顿)
  try {
    await setPersistentItem(localStorageKey, data);
  } catch (e) {
    console.error(`Failed to save to local persistent storage for ${localStorageKey}:`, e);
  }

  // 3. 异步/同步写入 Supabase 云端数据库 site_content 表
  let cloudSynced = false;
  try {
    const contentString = typeof data === 'string' ? data : JSON.stringify(data);
    cloudSynced = await upsertSiteContent(section, fieldName, contentString);
  } catch (e) {
    console.error(`Failed to save to Supabase site_content for ${section}.${fieldName}:`, e);
  }

  return {
    success: true,
    cloudSynced,
  };
}

// ============================================================
// 全站 7 大板块全量数据导出 (用于生成代码 & 同步到 GitHub)
// ============================================================

export interface AllPortfolioExportData {
  hero: any;
  about: any;
  coreSkills: any[];
  softwareSkills: any[];
  experiences: any[];
  honors: any[];
  projects: any[];
  brandPartners: any[];
  contact: any;
  exportedAt: string;
}

/**
 * 一次性从 Supabase 云端读取所有板块的最新数据
 * 读取顺序: Hero / About / Skills / Experience / Honors / Projects / BrandPartners / Contact
 * 每个板块都有二级降级策略: Supabase → 本地持久化存储 → 传入的默认值
 */
export async function fetchAllPortfolioData(defaults: {
  hero: any;
  about: any;
  coreSkills: any[];
  softwareSkills: any[];
  experiences: any[];
  honors: any[];
  projects: any[];
  brandPartners: any[];
  contact: any;
}): Promise<AllPortfolioExportData> {
  const [
    hero,
    about,
    coreSkills,
    softwareSkills,
    experiences,
    honors,
    projects,
    brandPartners,
    contact,
  ] = await Promise.all([
    fetchSectionData('hero', 'hero_content', 'mason_portfolio_hero_data', defaults.hero),
    fetchSectionData('about', 'about_data', 'mason_portfolio_about_data', defaults.about),
    fetchSectionData('skills', 'core_skills', 'mason_portfolio_core_skills', defaults.coreSkills),
    fetchSectionData('skills', 'software_skills', 'mason_portfolio_software_skills', defaults.softwareSkills),
    fetchSectionData('experience', 'experience_list', 'mason_portfolio_experiences', defaults.experiences),
    fetchSectionData('honors', 'honors_list', 'mason_portfolio_honors_v2', defaults.honors),
    fetchSectionData('projects', 'projects_list', 'mason_portfolio_projects_v2', defaults.projects),
    fetchSectionData('brand_partners', 'brand_partners_list', 'mason_portfolio_brand_partners_v1', defaults.brandPartners),
    fetchSectionData('contact', 'contact_info', 'mason_portfolio_contact_data', defaults.contact),
  ]);

  return {
    hero,
    about,
    coreSkills,
    softwareSkills,
    experiences,
    honors,
    projects,
    brandPartners,
    contact,
    exportedAt: new Date().toISOString(),
  };
}

// ============================================================
// 各板块 TypeScript 数据文件代码生成器
// 输出与现有 src/data/*.ts、板块内 DEFAULT_* 变量 完全一致的格式
// ============================================================

/** Hero 板块 -> src/data/heroData.ts */
export function generateHeroDataCode(hero: any): string {
  return `import { HeroData } from '../types';

// 来自 Supabase 云端最新同步的首页 Hero 配置
export const DEFAULT_HERO_DATA: HeroData = ${JSON.stringify(hero, null, 2)};
`;
}

/** About 板块 -> src/data/aboutData.ts */
export function generateAboutDataCode(about: any): string {
  return `import { AboutData } from '../types';

// 来自 Supabase 云端最新同步的个人介绍配置
export const DEFAULT_ABOUT_DATA: AboutData = ${JSON.stringify(about, null, 2)};
`;
}

/** Skills 板块 -> src/data/skillsData.ts */
export function generateSkillsDataCode(coreSkills: any[], softwareSkills: any[]): string {
  return `import { Skill, SoftwareSkill } from '../types';

// 专业技能熟练度配置 (从 Supabase 云端同步)
export const DEFAULT_CORE_SKILLS: Skill[] = ${JSON.stringify(coreSkills, null, 2)};

// 掌握的设计软件熟练度与图标配置 (从 Supabase 云端同步)
export const DEFAULT_SOFTWARE_SKILLS: SoftwareSkill[] = ${JSON.stringify(softwareSkills, null, 2)};
`;
}

/** Experience 板块 -> src/data/experienceData.ts */
export function generateExperienceDataCode(experiences: any[]): string {
  return `import { Experience } from '../types';

// 来自 Supabase 云端最新同步的工作经历时间线
export const DEFAULT_EXPERIENCES: Experience[] = ${JSON.stringify(experiences, null, 2)};
`;
}

/** Honors 板块 -> src/data/honorsData.ts */
export function generateHonorsDataCode(honors: any[]): string {
  return `import { Honor } from '../types';

// 来自 Supabase 云端最新同步的获奖荣誉与证书数据
export const DEFAULT_HONORS_LIST: Honor[] = ${JSON.stringify(honors, null, 2)};
`;
}

/** Projects 板块 -> src/data/projectsData.ts */
export function generateProjectsDataCode(projects: any[]): string {
  return `import { Project } from '../types';
import { sortProjectsByDateDesc } from '../utils/projectSorter';

// 包含所有最新编辑的项目代表作、PDF链接名称与图片URL
const RAW_DEFAULT_PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};

export const DEFAULT_PROJECTS_LIST: Project[] = sortProjectsByDateDesc(RAW_DEFAULT_PROJECTS);
`;
}

/** BrandPartners 板块 -> src/data/brandPartnersData.ts */
export function generateBrandPartnersDataCode(partners: any[]): string {
  return `import { BrandPartner } from '../types';

// 来自 Supabase 云端最新同步的合作品牌数据
export const DEFAULT_BRAND_PARTNERS: BrandPartner[] = ${JSON.stringify(partners, null, 2)};
`;
}

/** Contact 板块 -> src/data/contactData.ts */
export function generateContactDataCode(contact: any): string {
  return `import { ContactData } from '../types';

// 来自 Supabase 云端最新同步的联系信息
export const DEFAULT_CONTACT_DATA: ContactData = ${JSON.stringify(contact, null, 2)};
`;
}

/** 全量数据包 -> src/data/allPortfolioData.ts (用于备份/存档/一键回滚) */
export function generateAllPortfolioDataCode(all: AllPortfolioExportData): string {
  return `// 全站完整数据备份包
// 包含 Hero / About / Skills / Experience / Honors / Projects / BrandPartners / Contact 全部板块
// 图片/PDF URL、文字描述、证书与作品链接全部打包在内
// 导出时间: ${all.exportedAt}

export const PORTFOLIO_ALL_DATA = {
  hero: ${JSON.stringify(all.hero, null, 2)},
  about: ${JSON.stringify(all.about, null, 2)},
  coreSkills: ${JSON.stringify(all.coreSkills, null, 2)},
  softwareSkills: ${JSON.stringify(all.softwareSkills, null, 2)},
  experiences: ${JSON.stringify(all.experiences, null, 2)},
  honors: ${JSON.stringify(all.honors, null, 2)},
  projects: ${JSON.stringify(all.projects, null, 2)},
  brandPartners: ${JSON.stringify(all.brandPartners, null, 2)},
  contact: ${JSON.stringify(all.contact, null, 2)},
  exportedAt: ${JSON.stringify(all.exportedAt)},
};
`;
}

/** 根据当前活跃 tab 名生成对应代码字符串 */
export function generateCodeByTab(
  tabName: string,
  all: AllPortfolioExportData
): { code: string; filename: string } {
  switch (tabName) {
    case 'hero':
      return { code: generateHeroDataCode(all.hero), filename: 'heroData.ts' };
    case 'about':
      return { code: generateAboutDataCode(all.about), filename: 'aboutData.ts' };
    case 'skills':
      return {
        code: generateSkillsDataCode(all.coreSkills, all.softwareSkills),
        filename: 'skillsData.ts',
      };
    case 'experience':
      return {
        code: generateExperienceDataCode(all.experiences),
        filename: 'experienceData.ts',
      };
    case 'honors':
      return { code: generateHonorsDataCode(all.honors), filename: 'honorsData.ts' };
    case 'projects':
      return { code: generateProjectsDataCode(all.projects), filename: 'projectsData.ts' };
    case 'brandPartners':
      return {
        code: generateBrandPartnersDataCode(all.brandPartners),
        filename: 'brandPartnersData.ts',
      };
    case 'contact':
      return { code: generateContactDataCode(all.contact), filename: 'contactData.ts' };
    case 'all':
      return {
        code: generateAllPortfolioDataCode(all),
        filename: 'allPortfolioData.ts',
      };
    default:
      return { code: '', filename: 'unknown.ts' };
  }
}

/** 生成将要同步到 GitHub 的完整文件列表 (src/data/*.ts 的 8+1 个文件) */
export function buildAllSyncFiles(all: AllPortfolioExportData): Array<{ path: string; content: string }> {
  return [
    { path: 'src/data/heroData.ts', content: generateHeroDataCode(all.hero) },
    { path: 'src/data/aboutData.ts', content: generateAboutDataCode(all.about) },
    { path: 'src/data/skillsData.ts', content: generateSkillsDataCode(all.coreSkills, all.softwareSkills) },
    { path: 'src/data/experienceData.ts', content: generateExperienceDataCode(all.experiences) },
    { path: 'src/data/honorsData.ts', content: generateHonorsDataCode(all.honors) },
    { path: 'src/data/projectsData.ts', content: generateProjectsDataCode(all.projects) },
    { path: 'src/data/brandPartnersData.ts', content: generateBrandPartnersDataCode(all.brandPartners) },
    { path: 'src/data/contactData.ts', content: generateContactDataCode(all.contact) },
    { path: 'src/data/allPortfolioData.ts', content: generateAllPortfolioDataCode(all) },
  ];
}
