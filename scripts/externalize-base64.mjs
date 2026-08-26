/**
 * 将 src/data/*Data.ts 里的 data:image base64 字符串外置为 public/ 下的静态图片文件，
 * 并把数据里的 base64 替换为同源 URL 引用（如 /projects/img_xxx.jpg）。
 *
 * 目的：把 20MB 的 JS bundle（base64 全打进去了）缩减到几百 KB，
 * 让国内访客首屏秒开，图片按需从同源静态文件加载（可被 CDN 缓存）。
 *
 * 运行：node scripts/externalize-base64.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(process.cwd());
const targets = [
  { src: 'src/data/projectsData.ts', outDir: 'public/projects', urlPrefix: '/projects' },
  { src: 'src/data/brandPartnersData.ts', outDir: 'public/brands', urlPrefix: '/brands' },
];

let totalExternalized = 0;
let totalBytes = 0;

for (const { src, outDir, urlPrefix } of targets) {
  const srcPath = path.join(ROOT, src);
  if (!fs.existsSync(srcPath)) {
    console.log(`[SKIP] ${src} not found`);
    continue;
  }
  fs.mkdirSync(path.join(ROOT, outDir), { recursive: true });

  let content = fs.readFileSync(srcPath, 'utf8');
  // 匹配 data:image/(jpeg|jpg|png|webp);base64,XXXX
  const regex = /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/g;
  let count = 0;

  content = content.replace(regex, (_match, ext, b64) => {
    const extNorm = ext === 'jpeg' ? 'jpg' : ext;
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12);
    const filename = `img_${hash}.${extNorm}`;
    const filepath = path.join(ROOT, outDir, filename);
    if (!fs.existsSync(filepath)) {
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(filepath, buf);
      totalBytes += buf.length;
    }
    count++;
    return `${urlPrefix}/${filename}`;
  });

  fs.writeFileSync(srcPath, content);
  totalExternalized += count;
  const sizeKB = (fs.statSync(srcPath).size / 1024).toFixed(1);
  console.log(`[DONE] ${src}: externalized ${count} images -> ${outDir} | file now ${sizeKB} KB`);
}

console.log(`\nTOTAL externalized: ${totalExternalized} images, ~${(totalBytes / 1024 / 1024).toFixed(2)} MB moved to public/`);
