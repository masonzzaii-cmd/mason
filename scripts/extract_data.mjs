import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

const HONOR_ASSETS = {
  'best_employee_award_2018_1786689353907.jpg': '/src/assets/images/best_employee_award_2018_1786689353907.jpg',
  'national_scholarship_cert_1786685536914.jpg': '/src/assets/images/national_scholarship_cert_1786685536914.jpg',
  'himalaya_design_award_1786685738383.jpg': '/src/assets/images/himalaya_design_award_1786685738383.jpg',
};

function stripBase64FromHonors(honors) {
  return honors.map(h => {
    let imageUrl = h.imageUrl || '';
    if (imageUrl.startsWith('data:')) {
      if (h.title && h.title.includes('最佳优秀员工')) imageUrl = HONOR_ASSETS['best_employee_award_2018_1786689353907.jpg'];
      else if (h.title && h.title.includes('国家励志奖学金')) imageUrl = HONOR_ASSETS['national_scholarship_cert_1786685536914.jpg'];
      else if (h.title && h.title.includes('HIMALAYA')) imageUrl = HONOR_ASSETS['himalaya_design_award_1786685738383.jpg'];
      else imageUrl = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80';
    }
    return { id: h.id, title: h.title, year: h.year || '', issuer: h.issuer || '', imageUrl, linkUrl: h.linkUrl || '' };
  });
}

const DEFAULT_COVERS = {
  'p1': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'p2': 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
  'p3': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'p4': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'p5': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
  'p6': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'p7': 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1200&q=80',
  'p8': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'p9': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
  'p10': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'p11': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'p12': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
  'p13': 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
  'p14': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'p15': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
  'p16': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'p17': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'p18': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'p19': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'p20': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_GALLERIES = {
  'p1': ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85'],
  'p2': ['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85'],
  'p3': ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85'],
  'p4': ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'],
  'p5': ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85'],
  'p6': ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85'],
  'p7': ['https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85'],
  'p8': ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85'],
  'p9': ['https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'],
  'p10': ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85'],
  'p11': ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=85'],
  'p12': ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85'],
  'p13': ['https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85'],
  'p14': ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85'],
  'p15': ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85'],
  'p16': ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85'],
  'p17': ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'],
  'p18': ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1400&q=85'],
  'p19': ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85'],
  'p20': ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85'],
};

function stripBase64FromProjects(projects) {
  return projects.map(p => {
    let imageUrl = p.imageUrl || '';
    if (imageUrl.startsWith('data:')) {
      imageUrl = DEFAULT_COVERS[p.id] || DEFAULT_COVERS['p1'];
    }
    let galleryImages = (p.galleryImages || []).map((img, idx) => {
      if (img.startsWith('data:')) {
        return DEFAULT_GALLERIES[p.id]?.[idx] || imageUrl;
      }
      return img;
    });
    return { ...p, imageUrl, galleryImages };
  });
}

async function main() {
  // Honors
  const { data: hd } = await supabase.from('portfolio_settings').select('value').eq('key', 'mason_portfolio_honors_v2').maybeSingle();
  if (hd?.value) {
    const cleaned = stripBase64FromHonors(hd.value);
    fs.writeFileSync('scripts/honors_clean.json', JSON.stringify(cleaned, null, 2));
    console.log('HONORS_DONE', cleaned.length);
  }

  // Software skills
  const { data: sd } = await supabase.from('portfolio_settings').select('value').eq('key', 'mason_portfolio_software_skills').maybeSingle();
  if (sd?.value) {
    fs.writeFileSync('scripts/software_skills_clean.json', JSON.stringify(sd.value, null, 2));
    console.log('SW_DONE', sd.value.length);
  }

  // Projects
  const { data: pd } = await supabase.from('portfolio_settings').select('value').eq('key', 'mason_portfolio_projects_v2').maybeSingle();
  if (pd?.value) {
    const cleaned = stripBase64FromProjects(pd.value);
    fs.writeFileSync('scripts/projects_clean.json', JSON.stringify(cleaned, null, 2));
    console.log('PROJECTS_DONE', cleaned.length);
  }
}

main().catch(console.error);
