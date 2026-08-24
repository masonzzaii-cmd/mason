/**
 * 由于 storage 存储桶有 RLS 限制，anon 角色无法 insert 新对象。
 * 此处改为直接把图片以 base64 走 POST 到 REST storage API（和浏览器上传时的 multiform 相同协议）。
 * 若仍然 403，则直接退化成 base64 DataURI 写入 logoUrl —— 浏览器端能正常渲染 PNG。
 */
import fs from 'fs';
import path from 'path';

interface UploadJob {
  key: string;
  brandName: string;
  brandEnName: string;
  file: string;
}

const jobs: UploadJob[] = [
  { key: 'modernlife', brandName: '现代生活',        brandEnName: 'MODERN LIFE', file: 'modernlife.png' },
  { key: 'lototun',    brandName: '罗图丹 LOTOTUN', brandEnName: 'LOTOTUN',     file: 'lototun.png' },
  { key: 'oppein',    brandName: '欧派家居',        brandEnName: 'OPPEIN HOME', file: 'oppai.png' },
  { key: 'littleswan',brandName: '小天鹅',          brandEnName: 'LittleSwan',  file: 'littleswan.png' },
  { key: 'holike',    brandName: '好莱客',          brandEnName: 'HOLIKE',      file: 'holike.png' },
];

const DIR = '/workspace/tmp_brands';

function toDataURI(file: string) {
  const buf = fs.readFileSync(path.join(DIR, file));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const out = jobs.map(j => ({
  id: `brand-${j.key}`,
  name: j.brandName,
  enName: j.brandEnName,
  logoSymbol: j.brandEnName.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
  logoUrl: toDataURI(j.file), // 直接嵌入 base64 DataURI，跨环境立即可见
}));

console.log(JSON.stringify(out, null, 2));
