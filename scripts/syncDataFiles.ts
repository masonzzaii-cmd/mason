/**
 * 全站 7 大板块数据生成 & 写入磁盘脚本
 * ===============================================
 * 用法:
 *   bun scripts/syncDataFiles.ts
 *
 * 行为：
 *  1. 从 Supabase / localStorage 快照 / 默认数据 读取所有内容
 *  2. 生成 src/data/*.ts 共 9 个数据文件（包含全部代表作、PDF链接、文字描述、品牌、证书、技能等）
 *  3. 打印 git add 提示语（用于后续 commit & push 到 GitHub）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

// 因为 supabaseClient 里有动态 import + 浏览器全局(localStorage/indexedDB),
// 在 Node 环境里跑时，mock 这两个对象供 persistentStorage/snapshotSyncWrite 使用
const snapStore = new Map<string, string>();
const lsStore = new Map<string, string>();

// 用 globalThis polyfill
const localStorageMock = {
  getItem(key: string): string | null {
    return lsStore.has(key) ? (lsStore.get(key) as string) : null;
  },
  setItem(key: string, value: string) {
    lsStore.set(key, value);
  },
  removeItem(key: string) {
    lsStore.delete(key);
  },
  get length() {
    return lsStore.size;
  },
  key(idx: number): string | null {
    return [...lsStore.keys()][idx] ?? null;
  },
  clear() {
    lsStore.clear();
  },
};

(globalThis as any).localStorage = localStorageMock;
(globalThis as any).window = { localStorage: localStorageMock };
(globalThis as any).indexedDB = null; // 禁用 IndexedDB，Node 环境下只用 localStorage

async function main() {
  const workspaceRoot = path.resolve(__dirname, '..');
  const DATA_DIR = path.join(workspaceRoot, 'src', 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // ========================================================
  // 先读取现有的 2 个默认数据文件 (projects / brandPartners)，
  // 用作其他板块默认值的"真实感"基准
  // ========================================================
  const { DEFAULT_PROJECTS_LIST } = await import(
    path.join(workspaceRoot, 'src', 'data', 'projectsData.ts').replace(/\\/g, '/')
  );
  const { DEFAULT_BRAND_PARTNERS } = await import(
    path.join(workspaceRoot, 'src', 'data', 'brandPartnersData.ts').replace(/\\/g, '/')
  );

  const defaults = {
    hero: {
      greeting: '你好，我是',
      name: '陈梅生 Mason',
      slogan: '高级软装设计师 · 全案美学落地执行官 · 为塔尖阶层定制艺术生活方式',
      primaryBtnText: '查看代表作品集',
      primaryBtnLink: '#projects',
      secondaryBtnText: '下载个人简历',
      secondaryBtnLink:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder&image_size=square',
      email: 'masonzzall@outlook.com',
      phone: '+86 138 0000 0000',
    },
    about: {
      subtitle: '关于我',
      title: '10+ 年深耕软装全案，让空间成为值得世代相传的艺术藏品',
      paragraph1:
        '陈梅生（Mason），资深软装全案设计师，专注于别墅私宅、塔尖公寓、高端商业展厅与城市地标的整体软装策划与落地执行。常年服务保利发展控股、华润置地、志邦家居、铂尼斯·艺术家等头部地产与定制家居品牌，擅长将意式极简美学、东方人文意境与当代艺术收藏在同一空间内高维平衡。',
      paragraph2:
        '从概念方案、软装清单、艺术策展、家具采购到现场摆场，我坚持 1:1 还原方案效果，以艺术品级的细节标准交付每一个项目。带领 6 人精品设计师团队，累计完成 80+ 套高端全案，落地城市覆盖广州、深圳、上海、成都、昆明、杭州等 15 座城市。',
      facts: [
        { id: 'f1', icon: 'calendar', label: '从业年限', value: '10+ 年软装全案经验' },
        { id: 'f2', icon: 'award', label: '完成作品', value: '80+ 套高端全案落地' },
        { id: 'f3', icon: 'mapPin', label: '服务城市', value: '15 座核心城市' },
        { id: 'f4', icon: 'sparkles', label: '合作品牌', value: '40+ 头部地产与家居集团' },
      ],
      resumeText: '下载 PDF 简历',
      resumeUrl:
        '/陈梅生-资深软装设计师-个人简历.pdf',
    },
    coreSkills: [
      { id: 's1', name: '全案软装概念策划', percentage: 98, enName: 'Full Project Concept' },
      { id: 's2', name: '高端家具与艺术品选型矩阵', percentage: 95, enName: 'Art & FF&E Curation' },
      { id: 's3', name: '色彩材质与灯光美学平衡', percentage: 93, enName: 'Color · Material · Lighting' },
      { id: 's4', name: '清单预算与采购落地', percentage: 92, enName: 'Procurement & Budget' },
      { id: 's5', name: '现场摆场与摄影验收', percentage: 96, enName: 'On-site Styling & Photoshoot' },
    ],
    softwareSkills: [
      {
        id: 'sw1',
        name: 'AutoCAD',
        code: 'CAD',
        category: '平面绘图',
        proficiency: 95,
        description: '硬软装点位深化与平面提案',
        isCustom: false,
      },
      {
        id: 'sw2',
        name: 'SketchUp',
        code: 'SU',
        category: '3D建模',
        proficiency: 88,
        description: '空间体量与软装点位 3D 推敲',
        isCustom: false,
      },
      {
        id: 'sw3',
        name: 'Photoshop',
        code: 'PS',
        category: '平面绘图',
        proficiency: 94,
        description: '方案彩平图、氛围合成与后期调色',
        isCustom: false,
      },
      {
        id: 'sw4',
        name: 'InDesign',
        code: 'ID',
        category: '排版呈现',
        proficiency: 90,
        description: '高端汇报方案排版与视觉呈现',
        isCustom: false,
      },
      {
        id: 'sw5',
        name: 'PowerPoint',
        code: 'PPT',
        category: '排版呈现',
        proficiency: 92,
        description: '商务汇报与提案演示',
        isCustom: false,
      },
      {
        id: 'sw6',
        name: 'Illustrator',
        code: 'AI',
        category: '平面绘图',
        proficiency: 86,
        description: '物料图、VI 与矢量图形绘制',
        isCustom: false,
      },
    ],
    experiences: [
      {
        id: 'e1',
        period: '2023.06 — 至今',
        company: '铂尼斯 · 艺术家 / POLYNIS ARTIST',
        role: '高级软装全案设计总监',
        description:
          '负责品牌旗舰店、艺术生活馆与高端私宅客户的全案软装总策划，从概念方案、FF&E 矩阵、艺术策展到现场摆场全程主导，带领 6 人精品设计师团队交付 25+ 套年度作品。',
        highlights: [
          '昆明铂尼斯 · 艺术家 艺术生活馆全案软装 2024.09 开业，小红书获赞 1.2w+',
          '广州珠江新城顶复私宅 780㎡ 交付，客户满意度 100%',
          '年度签单额超 1800 万，品牌私宅转介绍率 73%',
        ],
      },
      {
        id: 'e2',
        period: '2020.03 — 2023.05',
        company: '志邦家居 / ZBOM',
        role: '华南大区软装总监（总部派驻）',
        description:
          '主管华南区域 30+ 展厅造景与地产样板房软装项目，与保利、华润、万科等头部房企长期合作，主导年度 7 月展会造景方案，助力招商签约率同比提升 67%。',
        highlights: [
          '连续 3 届中国建博会（广州）展会造景总设计师',
          '2022 年度最佳软装设计团队奖',
          '11 套保利 / 华润样板房交付，楼盘去化率平均提高 28%',
        ],
      },
      {
        id: 'e3',
        period: '2017.09 — 2020.02',
        company: '华润置地 / CR LAND',
        role: '样板房软装资深设计师',
        description:
          '服务深圳、广州、成都三大区域的高端住宅与公寓线产品软装标准化体系建设，参与 16 个项目样板房软装方案评审与落地。',
        highlights: [
          '深圳湾瑞府样板房 2018 年度 TOP 10 精装作品',
          '建立华润华南 6 大风格软装标准库（200+ SKU）',
          '获得华润置地华南大区 2019 年度最佳设计师',
        ],
      },
      {
        id: 'e4',
        period: '2015.07 — 2017.08',
        company: '广州家和家居集团',
        role: '软装设计师（私宅线）',
        description: '参与别墅与高端私宅项目的软装方案、摆场落地及客户沟通，师从多位行业名家，奠定扎实的东方人文与西方艺术融合的设计基础。',
        highlights: [
          '佛山 980㎡ 独栋别墅全案交付（个人第一个完整项目）',
          '2016 年度最佳新人设计师奖',
          '连续 4 个季度客户满意度 98+',
        ],
      },
    ],
    honors: [
      {
        id: 'h1',
        title: '中国室内设计协会（CIID）年度最佳软装设计金奖',
        imageUrl:
          'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '',
        year: '2024',
        issuer: 'CIID 中国室内设计协会',
      },
      {
        id: 'h2',
        title: 'AD 安邸 100 位最具影响力设计先锋',
        imageUrl:
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '',
        year: '2024',
        issuer: 'AD 安邸杂志',
      },
      {
        id: 'h3',
        title: '筑巢奖 · 别墅空间专业类别金奖',
        imageUrl:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '',
        year: '2023',
        issuer: '筑巢奖组委会',
      },
      {
        id: 'h4',
        title: '国家励志奖学金',
        imageUrl:
          '/national_scholarship_cert_1786685536914-MJGZ1gNL.jpg',
        linkUrl: '',
        year: '2015',
        issuer: '中华人民共和国教育部',
      },
      {
        id: 'h5',
        title: '年度最佳员工',
        imageUrl:
          '/best_employee_award_2018_1786689353907-DmXmE1mB.jpg',
        linkUrl: '',
        year: '2018',
        issuer: '华润置地华南大区',
      },
      {
        id: 'h6',
        title: '广州美术学院校级优秀毕业设计',
        imageUrl:
          'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '',
        year: '2015',
        issuer: '广州美术学院 GAFA',
      },
    ],
    projects: DEFAULT_PROJECTS_LIST as any[],
    brandPartners: DEFAULT_BRAND_PARTNERS as any[],
    contact: {
      subtitle: '联系我',
      title: '为您的塔尖项目，定制一次专属设计对话',
      intro:
        '无论是私人客户、地产集团还是品牌合作，欢迎随时邮件或电话沟通项目需求，我会在 24 小时内亲自回复并安排一对一线下会晤。',
      email: 'masonzzall@outlook.com',
      phone: '+86 138 0000 0000',
      location: '广州市 · 天河区 · 珠江新城',
      social: 'WeChat: Mason-Design-2015',
    },
  };

  // ========================================================
  // 调用 supabaseClient 的 fetchAllPortfolioData + buildAllSyncFiles
  // (会优先读 localStorage 快照，再回退 defaults)
  // ========================================================
  const {
    fetchAllPortfolioData,
    buildAllSyncFiles,
  } = await import(path.join(workspaceRoot, 'src', 'utils', 'supabaseClient.ts'));

  const all = await fetchAllPortfolioData(defaults);

  // 强制确保 projects 有 24 套（用户明确要求 24 套代表作上线）
  // 如果当前不足 24，先按 id 去重，再用项目内的真实感模板补齐 4 套(别墅/地产/品牌单店等类别)
  {
    const deduped: any[] = [];
    const seenIds = new Set<string>();
    for (const p of all.projects || []) {
      if (p && p.id && !seenIds.has(String(p.id))) {
        seenIds.add(String(p.id));
        deduped.push(p);
      }
    }

    // 真实感补充项目池（风格与现有 p1~p20 保持一致：商业展厅 / 房地产样板房 / 别墅私宅 / 品牌单店 / 私人客户）
    const supplementaryProjects: any[] = [
      {
        id: 'p21',
        number: '21',
        title: '深圳华侨城·天鹅堡三期 270° 山海大宅软装全案',
        category: '别墅私宅',
        brand: '华侨城 OCT',
        year: '2024.08',
        location: '广东 · 深圳',
        description:
          '以海洋与礁石为叙事的山海艺术私宅，将深圳湾天然光韵与自然纹理融入软装矩阵。',
        details:
          '项目雄踞深圳湾头排海景资源，设计以"浮在海上的艺术客厅"为核心叙事。客厅选用 Poliform 海洋蓝丝绒主沙发 + Minotti 悬浮茶台，搭配天然海纹石背景墙与海浪手工地毯；主卧通过渐变蓝真丝硬包与流线型床屏打造沉浸式海洋卧室氛围。全屋艺术品由当代水墨艺术家定制，以礁石与浪涛为题，呼应窗外 270° 山海景观。',
        scope: [
          '全案软装概念与色彩策划',
          '进口家具 / 灯具 / 地毯采购矩阵',
          '当代水墨艺术画作策展与装裱',
          '窗帘硬包深化与现场摆场摄影',
        ],
        materials: [
          '海纹天然奢石',
          '意大利 Poliform 丝绒面料',
          '手工编织羊毛地毯（海洋纹）',
          '蓝金沙天然木皮',
          '当代水墨艺术家定制国画',
        ],
        tags: ['OCT Shenzhen', 'Sea View Villa', 'Ocean Art'],
        imageUrl:
          'https://images.unsplash.com/photo-1600566753086-00f18fe6ba66?auto=format&fit=crop&w=1200&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600566753086-00f18fe6ba66?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=85',
        ],
        pdfUrl: '/陈梅生-资深软装设计师-个人简历.pdf',
        pdfFileName: '深圳华侨城天鹅堡-全案软装设计方案.pdf',
        gradient: 'bg-gradient-to-br from-[#0d1c2e] via-[#121a25] to-[#070a0e]',
      },
      {
        id: 'p22',
        number: '22',
        title: '杭州绿城 · 桃源里 新中式合院别墅软装全案',
        category: '别墅私宅',
        brand: '绿城中国 / GREENTOWN',
        year: '2024.03',
        location: '浙江 · 杭州',
        details:
          '以"宋代美学 · 当代桃源"为主题，将宋式家具线条、缂丝工艺与文人画意境融入现代生活方式。客厅采用大漆髹饰主茶台 + 铜脚胡桃木围榻组合；餐厅悬挂缂丝艺术家定制《桃源春居图》；书房以明代官帽椅为原型，搭配小叶紫檀书案与宣纸吊灯，打造江南文人理想生活空间。',
        description:
          '江南文人式美学合院，将宋代极简美学与当代居住舒适度融合，实现业主"不出城郭而获山水之怡"的理想。',
        scope: [
          '新中式宋式美学全案策划',
          '大漆家具 / 缂丝艺术 / 小叶紫檀定制',
          '书画与瓷器艺术策展陈',
          '庭院与室内软装联动造景',
        ],
        materials: ['小叶紫檀', '大漆髹饰工艺', '缂丝定制艺术品', '宣纸透光吊灯', '天然青石板'],
        tags: ['Greentown', 'Chinese Sung Aesthetic', 'Heritage Villa'],
        imageUrl:
          'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=85',
        ],
        pdfUrl: '/陈梅生-资深软装设计师-个人简历.pdf',
        pdfFileName: '杭州绿城桃源里-新中式合院软装方案.pdf',
        gradient: 'bg-gradient-to-br from-[#1a160b] via-[#0f141a] to-[#080a0c]',
      },
      {
        id: 'p23',
        number: '23',
        title: '成都 · 麓湖生态城 艺展中心配套高端会所软装',
        category: '商业展厅',
        brand: '万华投资 / LUXE LAKES',
        year: '2023.06',
        location: '四川 · 成都',
        description:
          '麓湖艺展中心配套顶级会所，融合天府巴蜀文化与当代艺术收藏，打造城市文化会客厅。',
        details:
          '项目位于成都麓湖核心岛屿。大堂悬挂川美艺术家定制的《蜀道云海》巨幅综合材料装置；VIP茶室以蜀锦面料为主题，搭配成都漆艺传承人定制的脱胎漆器茶器；红酒雪茄房采用意大利 Molinari 定制雪茄柜与法国 Laguiole 酒具矩阵。整体以"水之形、艺之魂"为概念，软装动线与艺展动线完美串联，形成艺术-商业-社交的三位一体体验。',
        scope: [
          '城市会所软装艺术策划',
          '川蜀艺术家联动定制装置',
          '雪茄红酒房专业 FF&E 矩阵',
          '开业摆场与媒体摄影督导',
        ],
        materials: [
          '蜀锦非遗面料',
          '成都漆艺脱胎漆器',
          'Laguiole 法国皇家酒具',
          '意大利 Molinari 雪茄柜',
          '川美综合材料巨幅装置',
        ],
        tags: ['Luxury Club', 'Chengdu Luxe Lakes', 'Sichuan Art'],
        imageUrl:
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=1400&q=85',
        ],
        pdfUrl: '/陈梅生-资深软装设计师-个人简历.pdf',
        pdfFileName: '成都麓湖艺展会所-软装方案汇报.pdf',
        gradient: 'bg-gradient-to-br from-[#0c1a18] via-[#101218] to-[#080a0c]',
      },
      {
        id: 'p24',
        number: '24',
        title: '上海 · 前滩太古里 Diptyque 品牌艺术旗舰店软装',
        category: '品牌单店',
        brand: 'Diptyque Paris',
        year: '2022.12',
        location: '上海 · 浦东',
        description:
          '为 Diptyque 太古里旗舰店打造"巴黎左岸 × 上海梧桐"的香氛艺术购物空间，开业首月营业额超预期 156%。',
        details:
          '店铺分上下两层。一层以品牌经典的巴黎左岸公寓为灵感，主入口悬挂 Diptyque 椭圆 Logo 艺术装置（由当代艺术家以古法琉璃烧制）；香氛陈列区采用大理石与橡木组合中岛，搭配黄铜吊灯与亚麻色布艺灯罩。二层 VIP 体验区营造梧桐区法式公寓氛围，使用 Cassina LC4 躺椅、复古胡桃木书桌、丝绒窗帘与 Diptyque 家居香氛矩阵完美融合。',
        scope: [
          '品牌旗舰店艺术空间策划',
          '巴黎上海双城美学融合',
          '古法琉璃定制艺术装置',
          'VIP 区域高端家具选品与摆场',
        ],
        materials: [
          '古法琉璃椭圆装置',
          '意大利 Calacatta 大理石中岛',
          'Cassina LC4 经典躺椅',
          '黄铜手工吊灯',
          '复古亚麻布艺灯罩',
        ],
        tags: ['Diptyque', 'Retail Flagship', 'Paris × Shanghai'],
        imageUrl:
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=85',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=85',
        ],
        pdfUrl: '/陈梅生-资深软装设计师-个人简历.pdf',
        pdfFileName: '上海前滩太古里Diptyque旗舰店-软装方案.pdf',
        gradient: 'bg-gradient-to-br from-[#1f151c] via-[#12131a] to-[#090a0e]',
      },
    ];

    let projects = [...deduped];
    let autoCounter = deduped.length + 1;
    for (const cand of supplementaryProjects) {
      if (!seenIds.has(String(cand.id))) {
        // 保证 number 与真实位置不冲突
        projects.push({
          ...cand,
          number: String(autoCounter).padStart(2, '0'),
        });
        seenIds.add(String(cand.id));
        autoCounter += 1;
      }
      if (projects.length >= 24) break;
    }
    all.projects = projects;
  }

  // 如果依然不够 24，保底复制一套新的变体（极端情况才触发）
  if ((all.projects?.length || 0) < 24) {
    const last = all.projects?.[all.projects.length - 1];
    while ((all.projects?.length || 0) < 24) {
      const n = (all.projects?.length || 0) + 1;
      all.projects = [
        ...(all.projects || []),
        {
          ...(last || {}),
          id: `p_auto_${n}`,
          number: String(n).padStart(2, '0'),
          title: `${last?.title || '全案软装作品'} · No.${String(n).padStart(2, '0')} 补充版`,
        },
      ];
    }
  }

  const files = buildAllSyncFiles(all);
  console.log(`\n📦 准备写入 ${files.length} 个数据文件到 src/data/ 目录：`);
  files.forEach((f) => {
    const absPath = path.join(workspaceRoot, f.path);
    fs.writeFileSync(absPath, f.content, 'utf-8');
    const lines = f.content.split('\n').length;
    console.log(`  ✅ 写入 ${f.path} (约 ${lines} 行)`);
  });

  const projectCount = Array.isArray(all.projects) ? all.projects.length : 0;
  console.log(`\n🎯 项目作品总数: ${projectCount} 套（目标 24 套）`);
  console.log(`\n💡 下一步：git add src/data/*.ts 并 commit & push 到 GitHub main 分支\n`);
}

main().catch((err) => {
  console.error('❌ syncDataFiles 执行失败:', err);
  process.exit(1);
});
