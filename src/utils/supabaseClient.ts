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
 * 优先级: Supabase 云端 -> 本地 IndexedDB/LocalStorage -> 传入的 fallback 默认数据
 */
export async function fetchSectionData<T>(
  section: string,
  fieldName: string,
  localStorageKey: string,
  fallback: T
): Promise<T> {
  // 1. 尝试从 Supabase 读取
  try {
    const cloudContent = await fetchSiteContent(section, fieldName);
    if (cloudContent && cloudContent.trim()) {
      try {
        const parsed = JSON.parse(cloudContent) as T;
        // 顺便同步回本地缓存，以便离线加速
        await setPersistentItem(localStorageKey, parsed);
        return parsed;
      } catch {
        // 如果不是 JSON，而泛型恰好是 string
        return cloudContent as unknown as T;
      }
    }
  } catch (e) {
    console.warn(`Supabase fetch failed for ${section}.${fieldName}, falling back to local:`, e);
  }

  // 2. 尝试从本地 IndexedDB / LocalStorage 读取
  try {
    const local = await getPersistentItem<T>(localStorageKey);
    if (local !== null && local !== undefined) {
      return local;
    }
  } catch (e) {
    console.warn(`Local persistent storage read failed for ${localStorageKey}:`, e);
  }

  // 3. 返回默认数据
  return fallback;
}

/**
 * 高级封装：双写保存数据 (同时写入 Supabase 云端数据库与本地 IndexedDB 缓存)
 */
export async function saveSectionData<T>(
  section: string,
  fieldName: string,
  localStorageKey: string,
  data: T
): Promise<{ success: boolean; cloudSynced: boolean }> {
  // 1. 先保存到本地 IndexedDB / LocalStorage (保证瞬间响应不卡顿)
  try {
    await setPersistentItem(localStorageKey, data);
  } catch (e) {
    console.error(`Failed to save to local persistent storage for ${localStorageKey}:`, e);
  }

  // 2. 异步/同步写入 Supabase 云端数据库
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
