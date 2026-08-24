/**
 * 生成最终 13 个品牌（8 个原已植入龙头地产/家居品牌 + 5 个用户新给的品牌）
 * 输出: /tmp/brands_final.ts -> src/data/brandPartnersData.ts
 */
import fs from 'fs';
import path from 'path';

interface Brand {
  id: string;
  name: string;
  enName: string;
  logoSymbol: string;
  logoUrl: string;
  category: string; // types.ts 中 BrandPartner 为必填
}

const DIR = '/workspace/tmp_brands';
function toDataURI(file: string) {
  const buf = fs.readFileSync(path.join(DIR, file));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// ======== A. 8 个已植入的龙头品牌（保留原 Symbol 显示）========
const OLD_8: Brand[] = [
  { id: 'brand-poly',      name: '保利发展控股',   enName: 'POLY DEVELOPMENTS',      logoSymbol: 'POLY',     logoUrl: '', category: '头部央企地产' },
  { id: 'brand-crland',    name: '华润置地',       enName: 'CR LAND',                 logoSymbol: 'CR LAND',  logoUrl: '', category: '头部央企地产' },
  { id: 'brand-vanke',     name: '万科集团',       enName: 'VANKE',                   logoSymbol: 'VANKE',    logoUrl: '', category: '头部品牌地产' },
  { id: 'brand-cmsk',      name: '招商蛇口',       enName: 'CHINA MERCHANTS',         logoSymbol: 'CMSK',     logoUrl: '', category: '头部央企地产' },
  { id: 'brand-greentown', name: '绿城中国',       enName: 'GREENTOWN',                logoSymbol: 'GREENTOWN',logoUrl: '', category: '中式美学地产' },
  { id: 'brand-sunac',     name: '融创中国',       enName: 'SUNAC',                   logoSymbol: 'SUNAC',    logoUrl: '', category: '高端精品地产' },
  { id: 'brand-jinmao',    name: '中国金茂',       enName: 'CHINA JINMAO',            logoSymbol: 'JINMAO',   logoUrl: '', category: '绿色科技豪宅' },
  { id: 'brand-yuexiu',    name: '越秀地产',       enName: 'YUEXIU PROPERTY',         logoSymbol: 'YUEXIU',   logoUrl: '', category: '城市运营地产' },
];

// ======== B. 5 个用户刚提供图片的品牌（用 base64 DataURI 直接植入图片）========
const NEW_5: Brand[] = [
  { id: 'brand-modernlife', name: '现代生活',   enName: 'MODERN LIFE', logoSymbol: 'MODERNLIFE', logoUrl: toDataURI('modernlife.png'), category: '美学生活空间' },
  { id: 'brand-lototun',    name: '罗图丹',     enName: 'LOTOTUN',     logoSymbol: 'LOTOTUN',    logoUrl: toDataURI('lototun.png'),    category: '高端定制家居' },
  { id: 'brand-oppein',     name: '欧派家居',   enName: 'OPPEIN HOME', logoSymbol: 'OPPEIN',     logoUrl: toDataURI('oppai.png'),      category: '高端定制家居' },
  { id: 'brand-littleswan', name: '小天鹅',     enName: 'LittleSwan',  logoSymbol: 'LITTLESwan', logoUrl: toDataURI('littleswan.png'),  category: '高端家电品牌' },
  { id: 'brand-holike',     name: '好莱客',     enName: 'HOLIKE',      logoSymbol: 'HOLIKE',     logoUrl: toDataURI('holike.png'),      category: '高端定制家居' },
];

const FINAL_13: Brand[] = [...OLD_8, ...NEW_5];

// 输出可直接粘贴的 TypeScript 代码
const ts = `import { BrandPartner } from '../types';

// ⚠️ 用户指定：最终合作品牌共 13 个（8 个龙头品牌 + 5 个图片植入品牌）
// 植入方式：老 8 个 -> 用 logoSymbol 展示；新 5 个 -> 用 logoUrl 直接渲染图片
// 其它未在清单的旧品牌一律删除，不再展示
export const DEFAULT_BRAND_PARTNERS: BrandPartner[] = ${JSON.stringify(FINAL_13, null, 2)};
`;

fs.writeFileSync('/workspace/src/data/brandPartnersData.ts', ts, 'utf8');
console.log(`已写入 /workspace/src/data/brandPartnersData.ts，共 ${FINAL_13.length} 个品牌`);
