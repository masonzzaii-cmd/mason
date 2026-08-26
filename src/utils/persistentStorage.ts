import { createClient } from '@supabase/supabase-js';

// --- Supabase client (server-side primary store using hardcoded credentials) ---
export const SUPABASE_PROJECT_URL = 'https://hgpjqsjqlliblmjibitm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGpxc2pxbGxpYmxtamliaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTgxNDUsImV4cCI6MjEwMzEzNDE0NX0.IDWEJJEw4CIWamdleZygkMzseghvnlIO8aozusdTpbs';

const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// --- IndexedDB fallback (for offline / large data) ---
const DB_NAME = 'MasonPortfolioDB';
const DB_VERSION = 1;
const STORE_NAME = 'portfolioData';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 保存数据到本地（IndexedDB 主 + LocalStorage 辅），不依赖 Supabase 云端。
 * 国内访问场景下，本地存储读写快、可靠、无 payload 大小限制，
 * 管理员编辑的文字/图片/PDF链接均可稳定保存，刷新不丢。
 */
export async function setPersistentItem<T>(key: string, value: T): Promise<void> {
  // 1. LocalStorage (快速小数据缓存 — 大 payload 可能超配额，忽略错误)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 大 payload（如 base64 图片）会超 localStorage 配额，正常降级到 IndexedDB
  }

  // 2. IndexedDB (主存储，支持大 payload，无严格大小限制)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB save failed for key "${key}":`, e);
  }
}

/**
 * 从本地读取数据（IndexedDB 主 + LocalStorage 辅），不查 Supabase 云端。
 * 国内访问场景下，本地读取秒级响应，避免云端大数据（12MB+）拉取超时。
 */
export async function getPersistentItem<T>(key: string, fallbackKeys: string[] = []): Promise<T | null> {
  // 1. IndexedDB (主存储)
  try {
    const db = await openDB();
    const result = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (result !== null && result !== undefined) {
      return result;
    }
  } catch (e) {
    console.warn(`IndexedDB read failed for key "${key}":`, e);
  }

  // 2. LocalStorage
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local) as T;
    }
  } catch (e) {
    console.warn(`LocalStorage parse failed for key "${key}":`, e);
  }

  // 3. Fallback legacy keys in LocalStorage
  for (const fKey of fallbackKeys) {
    try {
      const fallbackLocal = localStorage.getItem(fKey);
      if (fallbackLocal) {
        return JSON.parse(fallbackLocal) as T;
      }
    } catch (e) {
      console.warn(`Fallback key parse failed for "${fKey}":`, e);
    }
  }

  return null;
}

/**
 * Remove a value from Supabase + local stores.
 */
export async function removePersistentItem(key: string): Promise<void> {
  try {
    await supabase.from('portfolio_settings').delete().eq('key', key);
  } catch (e) {
    console.warn(`Supabase delete failed for key "${key}":`, e);
  }

  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (e) {
    // ignore
  }
}
