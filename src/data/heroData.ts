import { HeroData } from '../types';

// 来自 Supabase 云端最新同步的首页 Hero 配置
export const DEFAULT_HERO_DATA: HeroData = {
  "greeting": "你好，我是",
  "name": "陈梅生 Mason",
  "slogan": "高级软装设计师 · 全案美学落地执行官 · 为塔尖阶层定制艺术生活方式",
  "primaryBtnText": "查看代表作品集",
  "primaryBtnLink": "#projects",
  "secondaryBtnText": "下载个人简历",
  "secondaryBtnLink": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder&image_size=square",
  "email": "masonzzall@outlook.com",
  "phone": "+86 138 0000 0000"
};
