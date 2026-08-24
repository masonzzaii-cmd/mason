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
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function setIndexedDBItem<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function getIndexedDBItem<T>(key: string): Promise<T | null> {
  const db = await openDB();
  const result = await new Promise<T | null>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
  return result;
}

/**
 * LocalStorage 分片写入（用于保存 >5MB 的大型数据，如含 DataURL 图片的 Projects 数组）
 * 格式：__chunk.<key>.n = 总片数 ; __chunk.<key>.0 / .1 / ... 每片数据
 */
const LS_CHUNK_PREFIX = '__chunk.';
const LS_CHUNK_SIZE = 900 * 1024; // 单片 900KB（避开多数浏览器的 2.5MB 单键限制）

function tryLSGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function tryLSSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function tryLSDel(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function clearChunks(baseKey: string): void {
  const keysToRemove: string[] = [];
  const prefix = `${LS_CHUNK_PREFIX}${baseKey}.`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
  } catch {}
  keysToRemove.forEach((k) => tryLSDel(k));
}

function writeLSWithChunks(baseKey: string, serialized: string): boolean {
  // 先清理旧的分片
  clearChunks(baseKey);
  tryLSDel(baseKey);

  if (serialized.length < LS_CHUNK_SIZE) {
    // 普通单键写入
    const ok = tryLSSet(baseKey, serialized);
    if (ok) return true;
  }

  // 超过单片大小或单键失败 -> 分片写入
  const total = Math.ceil(serialized.length / LS_CHUNK_SIZE);
  // 先尝试写入 meta 键，如果 meta 都写不下，说明整体配额不够
  const metaOK = tryLSSet(`${LS_CHUNK_PREFIX}${baseKey}.n`, String(total));
  if (!metaOK) {
    clearChunks(baseKey);
    return false;
  }
  for (let i = 0; i < total; i++) {
    const piece = serialized.substring(i * LS_CHUNK_SIZE, (i + 1) * LS_CHUNK_SIZE);
    const pieceOK = tryLSSet(`${LS_CHUNK_PREFIX}${baseKey}.${i}`, piece);
    if (!pieceOK) {
      clearChunks(baseKey);
      return false;
    }
  }
  return true;
}

function readLSWithChunks<T>(baseKey: string): T | null {
  // 1. 先尝试单键
  const single = tryLSGet(baseKey);
  if (single !== null) {
    try {
      return JSON.parse(single) as T;
    } catch {
      // 损坏就删除
      tryLSDel(baseKey);
    }
  }

  // 2. 再尝试分片
  const totalStr = tryLSGet(`${LS_CHUNK_PREFIX}${baseKey}.n`);
  if (!totalStr) return null;
  const total = parseInt(totalStr, 10);
  if (!Number.isFinite(total) || total <= 0 || total > 1024) {
    clearChunks(baseKey);
    return null;
  }
  const pieces: string[] = [];
  for (let i = 0; i < total; i++) {
    const piece = tryLSGet(`${LS_CHUNK_PREFIX}${baseKey}.${i}`);
    if (piece === null) {
      clearChunks(baseKey);
      return null;
    }
    pieces.push(piece);
  }
  try {
    return JSON.parse(pieces.join('')) as T;
  } catch {
    clearChunks(baseKey);
    return null;
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Save a value:
 *  1. IndexedDB  (instant local persistence, no quota issue)
 *  2. LocalStorage (with chunking for large payloads like DataURL arrays)
 *  3. Supabase (async best-effort server-side mirror)
 *
 * Guarantee: as long as the browser didn't fully reset, local storage will have the data.
 */
export async function setPersistentItem<T>(key: string, value: T): Promise<void> {
  let serialized: string = '';
  try {
    serialized = JSON.stringify(value);
  } catch (e) {
    console.warn(`[persistentStorage] JSON.stringify failed for key "${key}":`, e);
    // 值可能是非可序列化对象（Blob/File等），只走 IndexedDB
  }

  // 1. IndexedDB (本地大容量存储 —— 刷新后能读回来的关键，必须先保证这个成功)
  try {
    await setIndexedDBItem(key, value);
  } catch (e) {
    console.error(`[persistentStorage] IndexedDB save FAILED for key "${key}":`, e);
  }

  // 2. LocalStorage 带分片 (快速读取层)
  try {
    if (serialized) {
      writeLSWithChunks(key, serialized);
    }
  } catch (e) {
    console.warn(`[persistentStorage] LocalStorage chunked write issue for key "${key}":`, e);
  }

  // 3. Supabase 远端同步 (best-effort；失败不影响本地可用)
  try {
    // 延迟动态导入，避免 `persistentStorage` 被首屏非 Supabase 页面使用时产生循环依赖
    const mod = await import('./supabaseClient');
    const supabase = (mod as any).getSupabaseClient?.();
    if (supabase) {
      const { error } = await supabase
        .from('portfolio_settings')
        .upsert(
          { key, value: value as unknown as Record<string, unknown> },
          { onConflict: 'key' }
        );
      if (error) {
        console.warn(
          `[persistentStorage] Supabase save failed for key "${key}" (will still load from local on refresh):`,
          error.message
        );
      }
    }
  } catch (e) {
    console.warn(
      `[persistentStorage] Supabase save skipped for key "${key}" (sandbox/CSP/network — OK, using local):`,
      (e as any)?.message || e
    );
  }
}

/**
 * Read a value:
 *  1. LocalStorage (with chunked fallback) — fastest
 *  2. IndexedDB — reliable large-data store
 *  3. Supabase — server-side latest (in case browser was reset)
 *
 * Priority is LOCAL FIRST: even if network/Supabase/CSP fails,
 * the browser always reads back what the admin just saved.
 */
export async function getPersistentItem<T>(
  key: string,
  fallbackKeys: string[] = []
): Promise<T | null> {
  // 1. LocalStorage 带分片（最快的本地热缓存）
  try {
    const local = readLSWithChunks<T>(key);
    if (local !== null && local !== undefined) {
      return local;
    }
  } catch (e) {
    console.warn(`[persistentStorage] LocalStorage chunked read failed for "${key}":`, e);
  }

  // 2. IndexedDB — 真正的大容量本地存储，刷新后能读回来的最后防线
  try {
    const result = await getIndexedDBItem<T>(key);
    if (result !== null && result !== undefined) {
      // 顺便回填到 LocalStorage，下次更快
      try {
        const serialized = JSON.stringify(result);
        if (serialized) writeLSWithChunks(key, serialized);
      } catch {}
      return result;
    }
  } catch (e) {
    console.warn(`[persistentStorage] IndexedDB read failed for "${key}":`, e);
  }

  // 3. Fallback legacy keys in LocalStorage (旧版本/重命名的键)
  for (const fKey of [key, ...fallbackKeys]) {
    try {
      const legacy = localStorage.getItem(fKey);
      if (legacy) {
        try {
          return JSON.parse(legacy) as T;
        } catch {}
      }
    } catch {}
  }

  // 4. Supabase 远端兜底（浏览器数据被清除时用到）
  try {
    const mod = await import('./supabaseClient');
    const supabase = (mod as any).getSupabaseClient?.();
    if (supabase) {
      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (!error && data && data.value !== null && data.value !== undefined) {
        const value = data.value as T;
        // 回填本地，下次就快了
        void setPersistentItem(key, value);
        return value;
      }
    }
  } catch (e) {
    console.warn(
      `[persistentStorage] Supabase read skipped for "${key}" (network/CSP — normal for preview):`,
      (e as any)?.message || e
    );
  }

  return null;
}

/**
 * Remove a value from all 3 layers.
 */
export async function removePersistentItem(key: string): Promise<void> {
  // 本地先清
  tryLSDel(key);
  clearChunks(key);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (e) {
    console.warn(`[persistentStorage] IndexedDB delete failed for "${key}":`, e);
  }
  try {
    const mod = await import('./supabaseClient');
    const supabase = (mod as any).getSupabaseClient?.();
    if (supabase) {
      await supabase.from('portfolio_settings').delete().eq('key', key);
    }
  } catch {}
}
