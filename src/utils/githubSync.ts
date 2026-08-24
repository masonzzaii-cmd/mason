/**
 * GitHub 代码自动同步工具
 * 通过 GitHub REST API 将编辑后的数据文件直接提交到 GitHub 仓库
 * 支持：仓库配置、文件内容获取、创建/更新文件、自动提交与推送
 */

export interface GitHubConfig {
  token: string;       // GitHub Personal Access Token
  owner: string;       // 仓库所有者 (用户名或组织名)
  repo: string;        // 仓库名称 (例如: my-portfolio)
  branch: string;      // 目标分支 (例如: main / master)
  email?: string;      // 提交者邮箱 (可选)
  name?: string;       // 提交者名称 (可选)
}

const STORAGE_KEY = 'mason_portfolio_github_config_v1';

/** 保存 GitHub 配置到本地存储 */
export function saveGitHubConfig(config: Partial<GitHubConfig>): void {
  try {
    const existing = loadGitHubConfig();
    const merged = { ...existing, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('保存 GitHub 配置失败:', e);
  }
}

/** 从本地存储加载 GitHub 配置 */
export function loadGitHubConfig(): Partial<GitHubConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('加载 GitHub 配置失败:', e);
  }
  return {
    branch: 'main',
  };
}

/** 清除 GitHub 配置 (特别是 Token) */
export function clearGitHubConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
}

/** 校验 GitHub 配置是否完整 */
export function isGitHubConfigComplete(config: Partial<GitHubConfig>): boolean {
  return !!(config.token && config.owner && config.repo && config.branch);
}

const GITHUB_API_BASE = 'https://api.github.com';

async function githubRequest<T = any>(
  config: GitHubConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GITHUB_API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${config.token}`);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const resp = await fetch(url, { ...options, headers });
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    // 空响应体 (如 204 No Content)
  }

  if (!resp.ok) {
    const msg = data?.message || `GitHub API 请求失败 (HTTP ${resp.status})`;
    const err = new Error(msg) as any;
    err.status = resp.status;
    err.githubData = data;
    throw err;
  }
  return data as T;
}

/** 获取仓库中指定分支上文件的 SHA (用于更新文件)，返回 null 表示文件不存在 */
export async function getRemoteFileSha(
  config: GitHubConfig,
  filePath: string
): Promise<string | null> {
  try {
    const data = await githubRequest<{ sha?: string }>(
      config,
      `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(config.branch)}`,
      { method: 'GET' }
    );
    return data?.sha || null;
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
}

export interface GitHubCommitResult {
  sha: string;           // 提交的 commit SHA
  htmlUrl: string;       // 本次提交的 GitHub Web 链接
  updatedFiles: string[]; // 成功写入的文件路径列表
}

/** 单个文件写入（创建或更新），返回新的 commit blob SHA 等信息 */
export async function pushSingleFileToGitHub(params: {
  config: GitHubConfig;
  filePath: string;         // 仓库中的相对路径，例如 src/data/projectsData.ts
  content: string;          // UTF-8 文件内容
  message?: string;         // Commit message 描述 (会自动拼接前缀)
}): Promise<{ sha: string; htmlUrl: string }> {
  const { config, filePath, content, message } = params;
  const existingSha = await getRemoteFileSha(config, filePath);

  const commitMsg =
    message ||
    (existingSha
      ? `chore(data): update ${filePath} from admin sync`
      : `feat(data): add ${filePath} from admin sync`);

  // 内容按 base64 编码 (GitHub API 要求)
  const base64Content = btoa(unescape(encodeURIComponent(content)));

  const body: any = {
    message: commitMsg,
    content: base64Content,
    branch: config.branch,
  };
  if (existingSha) {
    body.sha = existingSha;
  }
  if (config.name || config.email) {
    body.committer = {
      name: config.name || config.owner,
      email: config.email || `${config.owner}@users.noreply.github.com`,
    };
  }

  const resp = await githubRequest<{
    commit: { sha: string; html_url: string };
    content?: { html_url: string };
  }>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );

  return {
    sha: resp.commit.sha,
    htmlUrl: resp.commit.html_url || resp.content?.html_url || '',
  };
}

/**
 * 批量将多个数据文件同步到 GitHub
 * 按顺序逐一提交 (避免并发 rate limit 与非预期覆盖)
 */
export async function syncFilesToGitHub(params: {
  config: GitHubConfig;
  files: Array<{ path: string; content: string }>;
  commitMessage?: string;
  onProgress?: (current: number, total: number, filePath: string) => void;
}): Promise<GitHubCommitResult> {
  const { config, files, commitMessage, onProgress } = params;
  const updatedFiles: string[] = [];
  let lastSha = '';
  let lastUrl = '';

  const total = files.length;
  for (let i = 0; i < total; i++) {
    const f = files[i];
    onProgress?.(i + 1, total, f.path);
    try {
      const msg = commitMessage
        ? `${commitMessage} (${i + 1}/${total})`
        : undefined;
      const result = await pushSingleFileToGitHub({
        config,
        filePath: f.path,
        content: f.content,
        message: msg,
      });
      lastSha = result.sha;
      lastUrl = result.htmlUrl;
      updatedFiles.push(f.path);
    } catch (e: any) {
      console.error(`同步文件 ${f.path} 失败:`, e);
      throw new Error(
        `同步文件 "${f.path}" 失败：${e?.message || '未知错误'}。已同步 ${updatedFiles.length}/${total} 个文件。`
      );
    }
  }

  return {
    sha: lastSha,
    htmlUrl: lastUrl,
    updatedFiles,
  };
}

/** 验证 GitHub Token 与仓库权限 (GET /user + GET /repos/:owner/:repo) */
export async function validateGitHubAccess(
  config: GitHubConfig
): Promise<{ valid: boolean; userName?: string; repoPrivate?: boolean; defaultBranch?: string; error?: string }> {
  try {
    const user = await githubRequest<{ login: string }>(config, '/user', { method: 'GET' });
    const repo = await githubRequest<{
      private: boolean;
      default_branch: string;
      permissions?: { push: boolean; pull: boolean };
    }>(
      config,
      `/repos/${config.owner}/${config.repo}`,
      { method: 'GET' }
    );
    return {
      valid: true,
      userName: user.login,
      repoPrivate: repo.private,
      defaultBranch: repo.default_branch,
    };
  } catch (e: any) {
    return {
      valid: false,
      error: e?.message || 'Token、用户名或仓库名不正确，或该 Token 没有仓库写入权限。',
    };
  }
}
