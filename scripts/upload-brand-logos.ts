// 将用户提供的 5 张品牌 Logo（MODERN LIFE / LOTOTUN / 欧派 / 小天鹅 / 好莱客）
// 上传到 Supabase Storage 的 assets 存储桶，并打印可公网访问 URL

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { uploadAssetToStorage } from '../src/utils/supabaseClient';

interface UploadJob {
  key: string;
  brandName: string;
  brandEnName: string;
  file: string;
}

const jobs: UploadJob[] = [
  { key: 'modernlife', brandName: '现代生活 MODERN LIFE', brandEnName: 'MODERN LIFE', file: 'modernlife.png' },
  { key: 'lototun',    brandName: '罗图丹 LOTOTUN',    brandEnName: 'LOTOTUN',     file: 'lototun.png' },
  { key: 'oppein',    brandName: '欧派家居 OPPEIN',    brandEnName: 'OPPEIN HOME', file: 'oppai.png' },
  { key: 'littleswan',brandName: '小天鹅 LittleSwan',  brandEnName: 'LittleSwan',  file: 'littleswan.png' },
  { key: 'holike',    brandName: '好莱客 HOLIKE',      brandEnName: 'HOLIKE',      file: 'holike.png' },
];

const DIR = '/workspace/tmp_brands';

async function main() {
  const out: Array<UploadJob & { logoUrl: string }> = [];
  for (const job of jobs) {
    const filePath = path.join(DIR, job.file);
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'image/png' });
    const url = await uploadAssetToStorage(blob, `brand_${job.key}`);
    const row = { ...job, logoUrl: url };
    out.push(row);
    console.log(`[OK] ${job.key} | ${job.brandName} => ${url}`);
  }
  // 最后输出 JSON 方便直接拷贝到 brandPartnersData.ts
  console.log('\n===== JSON OUTPUT =====\n');
  console.log(JSON.stringify(out.map(r => ({
    id: `brand-${r.key}`,
    name: r.brandName,
    enName: r.brandEnName,
    logoSymbol: r.brandEnName.replace(/\s+/g, ''),
    logoUrl: r.logoUrl,
  })), null, 2));
}

main().catch((e) => {
  console.error('上传失败：', e);
  process.exit(1);
});
