/**
 * 从 Supabase 拉取完整的 projects_list（用户编辑的最新版本），
 * 提取真实数据（base64 照片外置为静态文件、保留 maipdf 链接），
 * 固化到 src/data/projectsData.ts。
 *
 * 同时合并散存字段 project_N_cover/_pdf 等里的真实 base64 照片和 PDF 链接。
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const URL = 'https://hgpjqsjqlliblmjibitm.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGpxc2pxbGxpYmxtamliaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTgxNDUsImV4cCI6MjEwMzEzNDE0NX0.IDWEJJEw4CIWamdleZygkMzseghvnlIO8aozusdTpbs';

async function fetchJSON(pathname) {
  // 走代理环境变量（sandbox 通过 http://127.0.0.1:18080 出网）
  const r = await fetch(`${URL}${pathname}`, { headers: { apikey: KEY } });
  if (!r.ok) {
    const t = await r.text().catch(()=>'');
    throw new Error(`fetch ${pathname} HTTP ${r.status}: ${t.slice(0,200)}`);
  }
  return r.json();
}

function externalizeB64(text, outDir, urlPrefix) {
  const regex = /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/g;
  return text.replace(regex, (_m, ext, b64) => {
    const extNorm = ext === 'jpeg' ? 'jpg' : ext;
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12);
    const filename = `img_${hash}.${extNorm}`;
    const filepath = path.join(outDir, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));
    }
    return `${urlPrefix}/${filename}`;
  });
}

async function main() {
  // 1. 拉完整 projects_list
  const rows = await fetchJSON('/rest/v1/site_content?select=content&section=eq.projects&field_name=eq.projects_list&limit=1');
  if (!rows.length) { console.log('NO projects_list'); return; }
  let projects = JSON.parse(rows[0].content);
  console.log('supabase projects_list count:', projects.length);

  // 2. 拉散存字段 project_N_*，合并到 projects（散存优先：用户编辑后的真实数据）
  const scattered = await fetchJSON('/rest/v1/site_content?select=field_name,content&section=eq.projects&field_name=like.project_*');
  const scatteredMap = {};
  for (const r of scattered) {
    const m = r.field_name?.match(/^project_(\d+)_(\w+)$/);
    if (m) {
      const n = +m[1], field = m[2];
      if (!scatteredMap[n]) scatteredMap[n] = {};
      scatteredMap[n][field] = r.content;
    }
  }
  console.log('scattered projects with data:', Object.keys(scatteredMap).length);

  // 3. 合并散存字段到 projects（覆盖 projects_list 内嵌值）
  let b64Count = 0, maipdfCount = 0;
  for (let i = 0; i < projects.length; i++) {
    const n = i + 1;
    const sc = scatteredMap[n];
    if (!sc) continue;
    if (sc.title) projects[i].title = sc.title;
    if (sc.brand) projects[i].brand = sc.brand;
    if (sc.year) projects[i].year = sc.year;
    if (sc.location) projects[i].location = sc.location;
    if (sc.cover) {
      projects[i].imageUrl = sc.cover;
      if (sc.cover.startsWith('data:image')) b64Count++;
    }
    if (sc.pdf) {
      projects[i].pdfUrl = sc.pdf;
      if (sc.pdf.includes('maipdf')) maipdfCount++;
    }
  }
  console.log(`merged: ${b64Count} base64 covers, ${maipdfCount} maipdf links`);

  // 4. 外置所有 base64（cover + gallery）为 public/projects 静态文件
  const outDir = path.join(process.cwd(), 'public/projects');
  fs.mkdirSync(outDir, { recursive: true });
  const projectsJson = JSON.stringify(projects, null, 2);
  const externalized = externalizeB64(projectsJson, outDir, '/projects');
  const finalProjects = JSON.parse(externalized);

  // 统计外置后
  let finalB64 = 0;
  for (const p of finalProjects) {
    if ((p.imageUrl||'').startsWith('data:image')) finalB64++;
    for (const g of (p.galleryImages||[])) if (typeof g === 'string' && g.startsWith('data:image')) finalB64++;
  }
  console.log('after externalize: remaining base64 (should be 0):', finalB64);

  // 5. 写入 projectsData.ts
  const fileContent = `import type { Project } from '../types/project';

export const DEFAULT_PROJECTS_LIST: Project[] = ${JSON.stringify(finalProjects, null, 2)};
`;
  fs.writeFileSync(path.join(process.cwd(), 'src/data/projectsData.ts'), fileContent);
  const sizeKB = (fs.statSync(path.join(process.cwd(), 'src/data/projectsData.ts')).size / 1024).toFixed(1);
  console.log(`\nDONE: projectsData.ts written, size ${sizeKB} KB`);

  // 6. 打印每个项目的关键字段确认
  console.log('\n=== 项目内容确认 ===');
  for (let i = 0; i < finalProjects.length; i++) {
    const p = finalProjects[i];
    const cover = (p.imageUrl||'').startsWith('/projects/') ? '[外置照片]' : (p.imageUrl||'').slice(0,40);
    const pdf = (p.pdfUrl||'').includes('maipdf') ? '[maipdf链接]' : (p.pdfUrl||'').slice(0,30);
    const gallery = (p.galleryImages||[]).length;
    console.log(`[${i+1}] ${(p.title||'').slice(0,28)} | cover:${cover} | pdf:${pdf} | gallery:${gallery}张`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
