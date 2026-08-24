import { AboutData } from '../types';

// 来自 Supabase 云端最新同步的个人介绍配置
export const DEFAULT_ABOUT_DATA: AboutData = {
  "subtitle": "ABOUT ME",
  "title": "关于我",
  "paragraph1": "本人拥有 7年室内软装设计行业经验，精通各类项目设计，包括房地产 / 别墅私宅 / 商业空间等项目，熟悉设计流程及材料工艺流程。",
  "paragraph2": "工作态度认真负责，有较强的抗压能力与独立思考能力，同时具有丰富的创新思维设计经验，确保设计项目从概念到实施，每个阶段都能达到预期目标。",
  "facts": [
    {
      "id": "1",
      "icon": "calendar",
      "label": "出生日期",
      "value": "1994 / 08 / 12"
    },
    {
      "id": "2",
      "icon": "mapPin",
      "label": "所在地",
      "value": "广东 · 佛山"
    },
    {
      "id": "3",
      "icon": "compass",
      "label": "职业身份",
      "value": "资深软装设计师"
    },
    {
      "id": "4",
      "icon": "award",
      "label": "工作经验",
      "value": "7 年设计经验"
    }
  ],
  "resumeText": "下载简历",
  "resumeUrl": "https://maipdf.cn/file/dt6a7f1ae3894be/pdf"
};
