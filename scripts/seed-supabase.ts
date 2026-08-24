/**
 * Supabase 云端数据初始化脚本（一次性）
 * 作用：把 src/data/*Data.ts 里的 7 大板块默认数据，全部写入 Supabase 的 site_content 表。
 *       这样即使是新访客（没有本地缓存）打开链接，也能看到最新内容，而不是组件硬编码的旧值。
 *
 * 执行：npx tsx scripts/seed-supabase.ts （需要在项目根目录运行）
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PROJECTS_LIST } from '../src/data/projectsData';
import { DEFAULT_ABOUT_DATA } from '../src/data/aboutData';
import { DEFAULT_CORE_SKILLS, DEFAULT_SOFTWARE_SKILLS } from '../src/data/skillsData';
import { DEFAULT_HONORS_LIST } from '../src/data/honorsData';
import { DEFAULT_EXPERIENCES } from '../src/data/experienceData';
import { DEFAULT_BRAND_PARTNERS } from '../src/data/brandPartnersData';
import { DEFAULT_HERO_DATA } from '../src/data/heroData';
import { DEFAULT_CONTACT_DATA } from '../src/data/contactData';

const SUPABASE_URL = 'https://hgpjqsjqlliblmjibitm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGpxc2pxbGxpYmxtamliaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTgxNDUsImV4cCI6MjEwMzEzNDE0NX0.IDWEJJEw4CIWamdleZygkMzseghvnlIO8aozusdTpbs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

type SeedRow = { section: string; fieldName: string; content: unknown };

async function upsert(section: string, fieldName: string, content: unknown) {
  const payload =
    typeof content === 'string' ? content : JSON.stringify(content);
  const now = new Date().toISOString();

  // 1) 先查是否存在
  const { data: existingRows, error: selectErr } = await supabase
    .from('site_content')
    .select('id')
    .eq('section', section)
    .eq('field_name', fieldName)
    .limit(1);

  if (selectErr) {
    console.error(`[ERR] select ${section}/${fieldName}:`, selectErr.message);
    return false;
  }

  if (existingRows && existingRows.length > 0) {
    const rowId = existingRows[0].id;
    const { error: upErr } = await supabase
      .from('site_content')
      .update({ content: payload, updated_at: now })
      .eq('id', rowId);
    if (upErr) {
      console.error(`[ERR] update ${section}/${fieldName}:`, upErr.message);
      return false;
    }
    console.log(`[UPDATED] ${section}/${fieldName}`);
    return true;
  } else {
    const { error: insErr } = await supabase.from('site_content').insert([
      {
        section,
        field_name: fieldName,
        content: payload,
        updated_at: now,
      },
    ]);
    if (insErr) {
      console.error(`[ERR] insert ${section}/${fieldName}:`, insErr.message);
      return false;
    }
    console.log(`[INSERT ] ${section}/${fieldName}`);
    return true;
  }
}

async function main() {
  console.log('开始将 src/data 数据写入 Supabase site_content 表...\n');

  // 7 大板块结构化字段
  const seeds: SeedRow[] = [
    { section: 'projects', fieldName: 'projects_list', content: DEFAULT_PROJECTS_LIST },
    { section: 'about', fieldName: 'about_data', content: DEFAULT_ABOUT_DATA },
    { section: 'skills', fieldName: 'core_skills', content: DEFAULT_CORE_SKILLS },
    { section: 'skills', fieldName: 'software_skills', content: DEFAULT_SOFTWARE_SKILLS },
    { section: 'honors', fieldName: 'honors_list', content: DEFAULT_HONORS_LIST },
    { section: 'experience', fieldName: 'experience_list', content: DEFAULT_EXPERIENCES },
    { section: 'brands', fieldName: 'brands_list', content: DEFAULT_BRAND_PARTNERS },
    { section: 'hero', fieldName: 'hero_data', content: DEFAULT_HERO_DATA },
    { section: 'contact', fieldName: 'contact_data', content: DEFAULT_CONTACT_DATA },
  ];

  for (const s of seeds) {
    await upsert(s.section, s.fieldName, s.content);
  }

  // 项目单字段散存（兼容以前/以后按 project_N_title/cover/pdf/brand/year/location 的逐字段保存方式）
  console.log('\n为 24 套项目补充散存字段 (project_N_title / _cover / _pdf / _brand / _year / _location):');
  for (let i = 0; i < DEFAULT_PROJECTS_LIST.length; i++) {
    const p = DEFAULT_PROJECTS_LIST[i];
    const n = i + 1;
    await upsert('projects', `project_${n}_title`, p.title);
    await upsert('projects', `project_${n}_cover`, p.imageUrl);
    if (p.pdfUrl) await upsert('projects', `project_${n}_pdf`, p.pdfUrl);
    if (p.brand) await upsert('projects', `project_${n}_brand`, p.brand);
    if (p.year) await upsert('projects', `project_${n}_year`, p.year);
    if (p.location) await upsert('projects', `project_${n}_location`, p.location);
  }

  console.log('\n✅ 种子数据初始化完成！');
}

main().catch((err) => {
  console.error('seed 失败:', err);
  process.exit(1);
});
