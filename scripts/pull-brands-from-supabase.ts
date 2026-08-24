/**
 * 反向同步脚本：从 Supabase 云端 site_content -> src/data/brandPartnersData.ts
 * 目的：用户「在合作品牌后台编辑并保存」后的最新内容（文字/上传图片 URL），
 *      作为代码内嵌默认值嵌入到仓库，保证刷新/换设备时内容一致。
 * 用法：npx tsx scripts/pull-brands-from-supabase.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://hgpjqsjqlliblmjibitm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGpxc2pxbGxpYmxtamliaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTgxNDUsImV4cCI6MjEwMzEzNDE0NX0.IDWEJJEw4CIWamdleZygkMzseghvnlIO8aozusdTpbs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data: rows, error } = await supabase
    .from('site_content')
    .select('id, content, updated_at')
    .eq('section', 'brands')
    .eq('field_name', 'brands_list')
    .limit(1);

  if (error) throw new Error(`查询 brands_list 失败: ${error.message}`);
  if (!rows || rows.length === 0) throw new Error('Supabase 中尚无 brands/brands_list 数据，请先在后台点「保存」');

  const row = rows[0];
  console.log(`[OK] 读取到行 id=${row.id} updated_at=${row.updated_at}`);

  let brandList;
  const raw = row.content;
  if (typeof raw === 'string') {
    try {
      brandList = JSON.parse(raw);
    } catch (e) {
      throw new Error('brands_list content 不是合法 JSON：' + (e as Error).message);
    }
  } else {
    brandList = raw;
  }
  if (!Array.isArray(brandList)) throw new Error('brands_list 不是数组');
  console.log(`[OK] 合作品牌条数: ${brandList.length}`);
  console.log(`[OK] 品牌名列表: ${brandList.map((b: any) => b.name).join(' / ')}`);

  // 写出为 TypeScript 模块，类型按 BrandPartner
  const ts = `import { BrandPartner } from '../types';

// ⚠️ 本文件由 scripts/pull-brands-from-supabase.ts 自动生成
// 来源：Supabase site_content.brands/brands_list（= 用户在后台管理编辑并保存的最新合作品牌）
// 作用：作为代码内嵌默认值，保证刷新 / 换设备 / 新访客都能看到你已编辑好的文字+图片
export const DEFAULT_BRAND_PARTNERS: BrandPartner[] = ${JSON.stringify(brandList, null, 2)};
`;

  const out = '/workspace/src/data/brandPartnersData.ts';
  fs.writeFileSync(out, ts, 'utf8');
  console.log(`[OK] 已写入 ${out}（${ts.length} 字节）`);
}

main().catch((e) => {
  console.error('[FAIL]', e);
  process.exit(1);
});
