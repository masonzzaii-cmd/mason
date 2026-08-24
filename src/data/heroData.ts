import { HeroData } from '../types';

// ⚠️ 用户明确要求 Hero 首页保持英文原版 + 指定 Email
// （之前的中文版本是误更新，已回退）
export const DEFAULT_HERO_DATA: HeroData = {
  greeting: "HELLO, I'M",
  name: 'MASON',
  slogan: 'WELCOME TO MY WORLD',
  primaryBtnText: '探索我的世界',
  primaryBtnLink: '#about',
  secondaryBtnText: '与我交流',
  secondaryBtnLink: '#contact',
  email: 'masonzzall@outlook.com',
  phone: '13112453953',
};
