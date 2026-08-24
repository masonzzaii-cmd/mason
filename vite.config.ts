import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // 如果部署到 GitHub Pages 仓库名 /mason 子路径，需要 base = '/mason/'
  // 部署到自定义域名或用户主页仓库 (xxx.github.io) 时，base = '/'
  // 可用 VITE_BASE_PATH 环境变量覆盖，或者直接读取 GITHUB_REPOSITORY 自动适配
  let base = process.env.VITE_BASE_PATH || '/';
  if (!process.env.VITE_BASE_PATH && process.env.GITHUB_REPOSITORY) {
    // 形如: masonzzaii-cmd/mason → base = '/mason/'
    const [, repoName] = process.env.GITHUB_REPOSITORY.split('/');
    if (repoName && !repoName.endsWith('.github.io')) {
      base = `/${repoName}/`;
    }
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

