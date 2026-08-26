(function() {
    'use strict';

    const Storage = {
        KEY: 'portfolio_data_v1',
        
        load() {
            try {
                const data = localStorage.getItem(this.KEY);
                return data ? JSON.parse(data) : this.getDefault();
            } catch(e) {
                return this.getDefault();
            }
        },
        
        save(data) {
            try {
                localStorage.setItem(this.KEY, JSON.stringify(data));
                return true;
            } catch(e) {
                console.error('Storage error:', e);
                return false;
            }
        },
        
        reset() {
            localStorage.removeItem(this.KEY);
            return this.getDefault();
        },
        
        getDefault() {
            return {
                text: {
                    hero_subtitle: 'HELLO, I\'M',
                    hero_title: 'MASON',
                    hero_slogan: 'WELCOME TO MY WORLD',
                    hero_btn1: '探索我的世界',
                    hero_btn2: '与我交流',
                    about_name: 'MASON',
                    about_title: '资深软装设计师',
                    about_wechat_tip: '扫码添加微信，让我们聊聊设计',
                    about_wechat_id: 'ID: mason_design',
                    about_label: 'ABOUT ME',
                    about_title_main: '关于我',
                    about_text1: '本人拥有7年室内软装设计行业经验，精通各类项目设计，包括房地产 / 别墅私宅 / 商业空间等项目，熟悉设计流程及材料工艺流程。',
                    about_text2: '工作态度认真负责，有较强的抗压能力与独立思考能力，同时具有丰富的创新思维设计经验，确保设计项目从概念到实施，每个阶段都能达到预期目标。',
                    about_birth: '1994 / 08 / 12',
                    about_location: '广东 · 佛山',
                    about_profession: '资深软装设计师',
                    about_experience: '7年设计经验',
                    exp_label: 'WORK EXPERIENCE',
                    exp_title: '工作经历',
                    honors_label: 'HONORS & AWARDS',
                    honors_title: '获得荣誉',
                    skills_pro_label: 'PROFESSIONAL SKILL PROFICIENCY',
                    skills_pro_title: '专业技能熟练度',
                    skills_soft_label: 'DESIGN SOFTWARE PROFICIENCY',
                    skills_soft_title: '掌握的设计软件熟练度',
                    projects_label: 'FEATURED PROJECTS',
                    projects_title: '项目作品',
                    brands_label: 'PARTNER BRANDS',
                    brands_title: '合作品牌',
                    contact_label: 'GET IN TOUCH',
                    contact_title: '联系我',
                    contact_email: 'mason.design@email.com',
                    contact_phone: '+86 138 0000 0000',
                    contact_wechat: 'mason_design',
                    contact_address: '中国 · 广东佛山',
                    footer_text: '© 2024 MASON. 探索 · 创造 · 无限.'
                },
                hero: { videoBg: '' },
                about: {
                    profileImg: '',
                    qrImg: '',
                    resumeFile: '',
                    resumeName: ''
                },
                experiences: [
                    {
                        id: 'exp1',
                        date: '2021.03 - 2025.04',
                        role: '资深软装设计师',
                        company: '广州家和家居文化创意有限公司',
                        description: '负责品牌展厅、软装项目风格主题选定、色彩方案调配，深化设计方案制作，材料工艺对接及现场最终摆场与工程验收。',
                        items: [
                            '根据展厅项目风格、主题、色彩等结合市场趋势以及国际米兰展趋势走向制作概念到深化方案',
                            '进行清单制作、细化及下单，整体把控项目产品选择及细节尺寸面料等工艺对接，与研发团队研发项目饰品工艺对接',
                            '协助采购团队及收货验收',
                            '跟进项目协助摆场及验收工作'
                        ]
                    },
                    {
                        id: 'exp2',
                        date: '2020.04 - 2020.11',
                        role: '高级软装设计师',
                        company: '广州亦境空间设计有限公司',
                        description: '负责样板房与售楼部软装全过程设计，从概念深化、选型清单制作下单，到产品细节工艺对接、采购验收与现场摆场落实。',
                        items: [
                            '根据样板房/售楼部项目风格、主题、色彩制作概念到深化方案',
                            '进行清单制作、细化及下单，整体把控项目产品选择及细节尺寸面料等工艺对接，把控产品与空间结合度',
                            '协助采购团队收货验收，跟进项目现场摆场及最终验收工作'
                        ]
                    }
                ],
                honors: [
                    { id: 'honor1', number: '01', year: '2015-2016', image: '', organization: '南昌理工学院', title: '荣获2015—2016学年度国家励志奖学金' },
                    { id: 'honor2', number: '02', year: '2018', image: '', organization: '广州大者设计有限公司', title: '2018年最佳优秀员工奖' },
                    { id: 'honor3', number: '03', year: '2023', image: '', organization: '喜马拉雅 · 设计之巅', title: '2023年喜马拉雅设计之巅 — 团队奖' },
                    { id: 'honor4', number: '04', year: '2020', image: '', organization: '金外滩奖组委会', title: '2020 金外滩奖 最佳色彩运用奖' }
                ],
                skills: {
                    professional: [
                        { id: 'sk1', name: '软装方案设计', en: 'Soft Furnishing Scheme Design', value: 95 },
                        { id: 'sk2', name: '方案深化能力', en: 'Concept To Detail / Design Development', value: 92 },
                        { id: 'sk3', name: '材料与工艺把控', en: 'Material / Craft Process', value: 90 },
                        { id: 'sk4', name: '项目管理与落地', en: 'Project Coordination / Execution', value: 88 },
                        { id: 'sk5', name: '灵活变通思维', en: 'Adaptive Thinking / Flexibility', value: 85 }
                    ],
                    software: [
                        { id: 'sw1', name: 'AutoCAD', desc: '工程制图', icon: '', level: '精通' },
                        { id: 'sw2', name: '3ds Max', desc: '效果图渲染', icon: '', level: '精通' },
                        { id: 'sw3', name: 'SketchUp', desc: '方案草图', icon: '', level: '熟练' },
                        { id: 'sw4', name: 'Photoshop', desc: '后期处理', icon: '', level: '精通' },
                        { id: 'sw5', name: 'Illustrator', desc: '矢量绘图', icon: '', level: '熟练' },
                        { id: 'sw6', name: 'PPT', desc: '方案演示', icon: '', level: '精通' }
                    ]
                },
                projects: [
                    { id: 'proj1', year: '2024', brand: '保利地产', name: '保利天悦样板间', category: '房地产样板房', cover: '', photos: [], description: '为保利地产高端住宅项目打造的样板间软装设计，融合现代简约与东方美学，展现品质生活方式。', pdfFile: '', pdfName: '' },
                    { id: 'proj2', year: '2023', brand: '万科集团', name: '万科城市花园售楼部', category: '售楼处', cover: '', photos: [], description: '为万科城市花园项目设计的售楼处软装，以自然生态为主题，营造舒适温馨的购房体验。', pdfFile: '', pdfName: '' },
                    { id: 'proj3', year: '2023', brand: '星河湾', name: '星河湾别墅私宅', category: '别墅私宅', cover: '', photos: [], description: '为星河湾业主私人定制的别墅软装设计，法式轻奢风格，展现优雅浪漫的居家氛围。', pdfFile: '', pdfName: '' },
                    { id: 'proj4', year: '2022', brand: '华润置地', name: '华润万象城商业展厅', category: '商业展厅', cover: '', photos: [], description: '华润万象城商业项目的展示空间软装设计，现代都市风格，体现商业空间的品质与活力。', pdfFile: '', pdfName: '' }
                ],
                brands: [
                    { id: 'b1', name: '保利地产', logo: '', desc: '高端住宅' },
                    { id: 'b2', name: '万科集团', logo: '', desc: '城市开发' },
                    { id: 'b3', name: '星河湾', logo: '', desc: '品质豪宅' },
                    { id: 'b4', name: '华润置地', logo: '', desc: '商业地产' },
                    { id: 'b5', name: '恒大集团', logo: '', desc: '多元化产业' },
                    { id: 'b6', name: '碧桂园', logo: '', desc: '住宅开发' }
                ]
            };
        }
    };

    let state = Storage.load();
    let editMode = false;

    function $(id) { return document.getElementById(id); }
    function $$(sel, parent) { return Array.from((parent || document).querySelectorAll(sel)); }
    
    function showToast(msg) {
        const toast = $('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 初始化文本内容
    function initTextContent() {
        $$('[data-editable]').forEach(el => {
            const key = el.dataset.key;
            if (state.text[key] !== undefined) {
                el.textContent = state.text[key];
            }
        });
    }

    // ===== 导航 =====
    function initNavigation() {
        const navLinks = $$('.nav-link');
        const sections = $$('.section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = $(href.substring(1));
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                $('navMenu').classList.remove('show');
            });
        });

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY + 200;
            sections.forEach(section => {
                if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
                    const id = section.getAttribute('id');
                    navLinks.forEach(l => {
                        l.classList.toggle('active', l.getAttribute('href') === '#' + id);
                    });
                }
            });
        });

        $('menuToggle').addEventListener('click', () => {
            $('navMenu').classList.toggle('show');
        });
    }

    // ===== 编辑模式 =====
    function initEditMode() {
        const toggle = $('editToggle');
        const toolbar = $('editToolbar');
        
        toggle.addEventListener('click', () => {
            editMode = !editMode;
            toggle.classList.toggle('active', editMode);
            toolbar.classList.toggle('show', editMode);
            document.body.classList.toggle('edit-mode', editMode);
            if (editMode) showToast('编辑模式已开启 - 点击任意文字进行编辑');
        });

        $('saveAllBtn').addEventListener('click', () => {
            if (Storage.save(state)) {
                showToast('✓ 已保存所有修改');
            } else {
                showToast('✗ 保存失败');
            }
        });

        $('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置所有数据吗？这将恢复默认内容。')) {
                state = Storage.reset();
                initTextContent();
                renderAll();
                showToast('已重置为默认内容');
            }
        });

        document.addEventListener('click', (e) => {
            const editable = e.target.closest('[data-editable]');
            if (!editable || !editMode) return;
            
            e.preventDefault();
            e.stopPropagation();

            const type = editable.dataset.editable;
            const key = editable.dataset.key;
            const currentText = state.text[key] || editable.textContent;

            if (type === 'text' || type === 'textarea') {
                const input = prompt('编辑内容:', currentText);
                if (input !== null && input !== currentText) {
                    state.text[key] = input;
                    editable.textContent = input;
                    Storage.save(state);
                    showToast('已保存');
                }
            }
        });
    }

    // ===== 首页视频 =====
    function initHeroVideo() {
        const upload = $('videoUpload');
        const replaceBtn = $('replaceVideoBtn');
        const iframe = $('heroIframe');
        const videoBg = $('heroVideoBg');

        // 如果用户之前上传了本地视频，替换iframe为video
        if (state.hero.videoBg && state.hero.videoBg.startsWith('data:')) {
            videoBg.innerHTML = `
                <video autoplay muted loop playsinline id="heroVideo" style="width:100%;height:100%;object-fit:cover;">
                    <source src="${state.hero.videoBg}" type="video/mp4">
                </video>
                <div class="hero-video-controls">
                    <button id="replaceVideoBtn" title="替换背景视频">
                        <i class="fas fa-video"></i> 替换背景
                    </button>
                </div>
                <input type="file" id="videoUpload" accept="video/*" hidden>
            `;
            setupUpload();
        }

        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => {
                $('videoUpload').click();
            });
        }

        setupUpload();

        function setupUpload() {
            const up = $('videoUpload');
            if (up) {
                up.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    state.hero.videoBg = await fileToBase64(file);
                    Storage.save(state);
                    showToast('背景视频已更新');
                    // 替换iframe为video
                    location.reload();
                });
            }
        }
    }

    // ===== 关于我 =====
    function initAboutCard() {
        const card = $('card3d');

        if (state.about.profileImg) {
            $('profileImg').src = state.about.profileImg;
            $('profileImg').style.display = 'block';
            $('photoPlaceholder').style.display = 'none';
            $('photoReplace').style.display = 'flex';
        }
        if (state.about.qrImg) {
            $('qrImg').src = state.about.qrImg;
            $('qrImg').style.display = 'block';
            $('qrPlaceholder').style.display = 'none';
            $('qrReplace').style.display = 'flex';
        }

        const updatePhotoUI = () => {
            if (state.about.profileImg) {
                $('profileImg').style.display = 'block';
                $('photoPlaceholder').style.display = 'none';
                $('photoReplace').style.display = 'flex';
            } else {
                $('profileImg').style.display = 'none';
                $('photoPlaceholder').style.display = 'flex';
                $('photoReplace').style.display = 'none';
            }
        };

        $('cardPhoto').addEventListener('click', () => $('profileUpload').click());
        $('metaEdit').addEventListener('click', (e) => {
            e.stopPropagation();
            $('profileUpload').click();
        });
        $('profileUpload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            state.about.profileImg = await fileToBase64(file);
            $('profileImg').src = state.about.profileImg;
            updatePhotoUI();
            Storage.save(state);
            showToast('照片已更新');
        });

        const updateQRUI = () => {
            if (state.about.qrImg) {
                $('qrImg').style.display = 'block';
                $('qrPlaceholder').style.display = 'none';
                $('qrReplace').style.display = 'flex';
            } else {
                $('qrImg').style.display = 'none';
                $('qrPlaceholder').style.display = 'flex';
                $('qrReplace').style.display = 'none';
            }
        };

        $('qrCode').addEventListener('click', () => $('qrUpload').click());
        $('qrUpload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            state.about.qrImg = await fileToBase64(file);
            $('qrImg').src = state.about.qrImg;
            updateQRUI();
            Storage.save(state);
            showToast('二维码已更新');
        });

        $('flipBtn').addEventListener('click', () => card.classList.toggle('flipped'));

        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                card.classList.toggle('flipped', btn.dataset.tab === 'back');
            });
        });

        $('resumeUploadBtn').addEventListener('click', () => $('resumeUpload').click());
        $('resumeUpload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            state.about.resumeFile = await fileToBase64(file);
            state.about.resumeName = file.name;
            Storage.save(state);
            showToast('简历已上传');
        });

        $('resumeDownload').addEventListener('click', () => {
            if (!state.about.resumeFile) {
                showToast('请先上传简历文件');
                return;
            }
            const a = document.createElement('a');
            a.href = state.about.resumeFile;
            a.download = state.about.resumeName || 'resume.pdf';
            a.click();
        });
    }

    // ===== 工作经历 =====
    function renderExperience() {
        const timeline = $('timeline');
        timeline.innerHTML = '';
        state.experiences.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="experience-card fade-in">
                    <div class="exp-header">
                        <div class="exp-date"><i class="far fa-calendar"></i> ${exp.date}</div>
                        <span class="exp-role">${exp.role}</span>
                    </div>
                    <div class="exp-company"><i class="fas fa-building"></i> ${exp.company}</div>
                    <p class="exp-desc">${exp.description}</p>
                    <ul class="exp-list">
                        ${exp.items.map(i => `<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}
                    </ul>
                    <div class="exp-actions">
                        <button data-exp-edit="${exp.id}"><i class="fas fa-edit"></i> 编辑</button>
                        <button data-exp-del="${exp.id}"><i class="fas fa-trash"></i> 删除</button>
                    </div>
                </div>
            `;
            timeline.appendChild(item);
        });
        
        $$('[data-exp-edit]').forEach(btn => {
            btn.addEventListener('click', () => editExperience(btn.dataset.expEdit));
        });
        $$('[data-exp-del]').forEach(btn => {
            btn.addEventListener('click', () => deleteExperience(btn.dataset.expDel));
        });
    }

    function editExperience(id) {
        const exp = state.experiences.find(e => e.id === id);
        if (!exp) return;
        const date = prompt('日期:', exp.date); if (date !== null) exp.date = date;
        const role = prompt('职位:', exp.role); if (role !== null) exp.role = role;
        const company = prompt('公司:', exp.company); if (company !== null) exp.company = company;
        const description = prompt('描述:', exp.description); if (description !== null) exp.description = description;
        const itemsStr = prompt('工作内容 (每行一项):', exp.items.join('\n'));
        if (itemsStr !== null) exp.items = itemsStr.split('\n').filter(i => i.trim());
        Storage.save(state);
        renderExperience();
        showToast('修改已保存');
    }

    function deleteExperience(id) {
        if (!confirm('确定删除这条工作经历吗？')) return;
        state.experiences = state.experiences.filter(e => e.id !== id);
        Storage.save(state);
        renderExperience();
        showToast('已删除');
    }

    function addExperience() {
        const date = prompt('日期 (如: 2021.03 - 2025.04):'); if (!date) return;
        const role = prompt('职位:'); if (!role) return;
        const company = prompt('公司名称:'); if (!company) return;
        const description = prompt('工作描述:'); if (!description) return;
        const itemsStr = prompt('工作内容 (每行一项):'); if (!itemsStr) return;

        state.experiences.push({
            id: generateId('exp'), date, role, company, description,
            items: itemsStr.split('\n').filter(i => i.trim())
        });
        Storage.save(state);
        renderExperience();
        showToast('已添加新经历');
    }

    // ===== 荣誉 =====
    function renderHonors() {
        const grid = $('honorsGrid');
        grid.innerHTML = '';

        state.honors.forEach(honor => {
            const card = document.createElement('div');
            card.className = 'honor-card fade-in';
            card.innerHTML = `
                <div class="honor-img" data-honor-id="${honor.id}">
                    ${honor.image 
                        ? `<img src="${honor.image}" alt="${honor.title}" data-honor-preview="${honor.id}">` 
                        : `<div class="honor-img-placeholder"><i class="fas fa-certificate"></i><span>点击上传证书</span></div>`
                    }
                    <div class="honor-badge"><i class="fas fa-trophy"></i> ${honor.number}</div>
                    <div class="honor-year">${honor.year}</div>
                </div>
                <div class="honor-body">
                    <div class="honor-org">${honor.organization}</div>
                    <div class="honor-title-text">${honor.title}</div>
                    <div class="honor-footer">
                        <span class="honor-link" data-honor-edit="${honor.id}"><i class="fas fa-external-link-alt"></i> 编辑详情</span>
                        <span class="honor-custom" data-honor-del="${honor.id}">删除</span>
                    </div>
                </div>
                <input type="file" class="honor-upload" accept="image/*" data-honor-id="${honor.id}" hidden>
            `;
            grid.appendChild(card);
        });

        // 绑定事件
        $$('.honor-img').forEach(div => {
            const id = div.dataset.honorId;
            div.addEventListener('click', (e) => {
                if (e.target.matches('img')) {
                    previewHonorImage(id);
                } else {
                    div.nextElementSibling.click();
                }
            });
        });

        $$('.honor-upload').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const honor = state.honors.find(h => h.id === input.dataset.honorId);
                honor.image = await fileToBase64(file);
                Storage.save(state);
                renderHonors();
                showToast('证书图片已更新');
            });
        });

        $$('[data-honor-edit]').forEach(btn => btn.addEventListener('click', () => editHonor(btn.dataset.honorEdit)));
        $$('[data-honor-del]').forEach(btn => btn.addEventListener('click', () => deleteHonor(btn.dataset.honorDel)));
    }

    function previewHonorImage(id) {
        const honor = state.honors.find(h => h.id === id);
        if (!honor || !honor.image) return;
        $('lightboxImg').src = honor.image;
        $('lightbox').classList.add('show');
    }

    function editHonor(id) {
        const honor = state.honors.find(h => h.id === id);
        if (!honor) return;
        const org = prompt('颁发机构:', honor.organization); if (org !== null) honor.organization = org;
        const title = prompt('荣誉名称:', honor.title); if (title !== null) honor.title = title;
        const year = prompt('年份:', honor.year); if (year !== null) honor.year = year;
        Storage.save(state);
        renderHonors();
        showToast('修改已保存');
    }

    function deleteHonor(id) {
        if (!confirm('确定删除这条荣誉吗？')) return;
        state.honors = state.honors.filter(h => h.id !== id);
        Storage.save(state);
        renderHonors();
        showToast('已删除');
    }

    function addHonor() {
        const org = prompt('颁发机构:'); if (!org) return;
        const title = prompt('荣誉名称:'); if (!title) return;
        const year = prompt('年份:'); if (!year) return;
        state.honors.push({
            id: generateId('honor'),
            number: String(state.honors.length + 1).padStart(2, '0'),
            year, organization: org, title, image: ''
        });
        Storage.save(state);
        renderHonors();
        showToast('已添加新荣誉');
    }

    // ===== 熟悉软件 =====
    function renderSkills() {
        // 条形图
        const barsContainer = $('skillsBars');
        barsContainer.innerHTML = '';
        state.skills.professional.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'skill-bar-item fade-in';
            item.innerHTML = `
                <div class="skill-bar-header">
                    <div>
                        <span class="skill-bar-name">${skill.name}</span>
                        <span class="skill-bar-en">${skill.en}</span>
                    </div>
                    <span class="skill-bar-value" data-skill-id="${skill.id}" data-field="value" contenteditable="true">${skill.value}%</span>
                </div>
                <div class="skill-bar-track">
                    <div class="skill-bar-fill" style="width: ${skill.value}%"></div>
                </div>
            `;
            barsContainer.appendChild(item);
        });

        // 环形图
        const circlesContainer = $('skillsCircles');
        circlesContainer.innerHTML = '';
        state.skills.professional.slice(0, 5).forEach(skill => {
            const circle = document.createElement('div');
            circle.className = 'skill-circle-item fade-in';
            const circumference = 2 * Math.PI * 55;
            const offset = circumference - (skill.value / 100) * circumference;
            circle.innerHTML = `
                <div class="circle-progress">
                    <svg width="140" height="140">
                        <defs>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#a88840"/>
                                <stop offset="100%" style="stop-color:#c9a962"/>
                            </linearGradient>
                        </defs>
                        <circle class="circle-bg" cx="70" cy="70" r="55"></circle>
                        <circle class="circle-fill" cx="70" cy="70" r="55"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"></circle>
                    </svg>
                    <div class="circle-text">
                        <span class="circle-value">${skill.value}</span>
                        <span class="circle-value-percent">%</span>
                    </div>
                </div>
                <div class="circle-label">${skill.name}</div>
            `;
            circlesContainer.appendChild(circle);
        });

        // 绑定数值编辑
        $$('.skill-bar-value').forEach(el => {
            el.addEventListener('blur', () => {
                let val = parseInt(el.textContent) || 0;
                val = Math.max(0, Math.min(100, val));
                if (isNaN(val)) val = 0;
                el.textContent = val + '%';
                const skill = state.skills.professional.find(s => s.id === el.dataset.skillId);
                if (skill) {
                    skill.value = val;
                    Storage.save(state);
                    renderSkills();
                }
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    el.blur();
                }
            });
        });

        // 软件卡片
        const softwareGrid = $('softwareGrid');
        softwareGrid.innerHTML = '';
        state.skills.software.forEach(sw => {
            const card = document.createElement('div');
            card.className = 'software-card fade-in';
            card.innerHTML = `
                <div class="software-del" data-sw-del="${sw.id}"><i class="fas fa-times"></i></div>
                <div class="software-icon" data-sw-icon="${sw.id}">
                    ${sw.icon 
                        ? `<img src="${sw.icon}" alt="${sw.name}">` 
                        : `<i class="fas fa-desktop"></i>`
                    }
                </div>
                <div style="display:none" class="sw-upload">
                    <input type="file" accept="image/*" data-sw-input="${sw.id}" hidden>
                </div>
                <div class="software-name" data-sw-text="${sw.id}" data-field="name" contenteditable="true">${sw.name}</div>
                <div class="software-desc" data-sw-text="${sw.id}" data-field="desc" contenteditable="true">${sw.desc}</div>
                <div class="software-level">
                    <span data-sw-text="${sw.id}" data-field="level" contenteditable="true">${sw.level}</span>
                </div>
            `;
            softwareGrid.appendChild(card);
        });

        // 软件图标上传
        $$('[data-sw-icon]').forEach(iconDiv => {
            iconDiv.addEventListener('click', () => {
                const id = iconDiv.dataset.swIcon;
                iconDiv.parentElement.querySelector('.sw-upload input').click();
            });
        });

        $$('[data-sw-input]').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const sw = state.skills.software.find(s => s.id === input.dataset.swInput);
                sw.icon = await fileToBase64(file);
                Storage.save(state);
                renderSkills();
                showToast('软件图标已更新');
            });
        });

        // 软件文字编辑
        $$('[data-sw-text]').forEach(el => {
            el.addEventListener('blur', () => {
                const id = el.dataset.swText;
                const field = el.dataset.field;
                const sw = state.skills.software.find(s => s.id === id);
                if (sw) {
                    sw[field] = el.textContent.trim();
                    Storage.save(state);
                }
            });
        });

        // 删除软件
        $$('[data-sw-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('确定删除这个软件吗？')) return;
                state.skills.software = state.skills.software.filter(s => s.id !== btn.dataset.swDel);
                Storage.save(state);
                renderSkills();
                showToast('已删除');
            });
        });
    }

    function addSoftware() {
        const name = prompt('软件名称:'); if (!name) return;
        const desc = prompt('软件说明:') || '';
        const level = prompt('熟练度 (如: 精通/熟练/掌握):') || '掌握';
        state.skills.software.push({ id: generateId('sw'), name, desc, level, icon: '' });
        Storage.save(state);
        renderSkills();
        showToast('已添加新软件');
    }

    // ===== 合作项目 =====
    function renderProjects() {
        const grid = $('projectsGrid');
        grid.innerHTML = '';

        const sorted = [...state.projects].sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearB - yearA;
        });

        // 筛选按钮
        const categories = ['全部', ...new Set(state.projects.map(p => p.category))];
        const filtersContainer = $('projectFilters');
        filtersContainer.innerHTML = '';
        categories.forEach((cat, i) => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                $$('.filter-btn', filtersContainer).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProjects();
            });
            filtersContainer.appendChild(btn);
        });

        const activeFilter = $$('.filter-btn', filtersContainer).find(b => b.classList.contains('active'));
        const filter = activeFilter ? activeFilter.textContent : '全部';
        const filtered = filter === '全部' ? sorted : sorted.filter(p => p.category === filter);

        filtered.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card fade-in';
            card.innerHTML = `
                <div class="project-cover" data-proj-cover="${proj.id}">
                    ${proj.cover 
                        ? `<img src="${proj.cover}" alt="${proj.name}">` 
                        : `<div class="project-cover-placeholder"><i class="fas fa-image"></i><span>点击上传封面</span></div>`
                    }
                    <div class="project-year">${proj.year}</div>
                    <div class="project-category">${proj.category}</div>
                </div>
                <div class="project-body">
                    <div class="project-brand"><i class="fas fa-building"></i> ${proj.brand}</div>
                    <h3 class="project-name">${proj.name}</h3>
                    <p class="project-desc">${proj.description}</p>
                    <div class="project-actions">
                        <button data-proj-view="${proj.id}"><i class="fas fa-eye"></i> 查看详情</button>
                        <button data-proj-edit="${proj.id}"><i class="fas fa-edit"></i> 编辑</button>
                        <button data-proj-del="${proj.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <input type="file" class="project-cover-upload" accept="image/*" data-proj-upload="${proj.id}" hidden>
            `;
            grid.appendChild(card);
        });

        // 封面点击上传
        $$('[data-proj-cover]').forEach(cover => {
            const id = cover.dataset.projCover;
            const proj = state.projects.find(p => p.id === id);
            if (!proj.cover) {
                cover.style.cursor = 'pointer';
                cover.addEventListener('click', (e) => {
                    if (e.target.closest('.project-actions')) return;
                    cover.parentElement.querySelector('[data-proj-upload]').click();
                });
            }
        });

        $$('[data-proj-upload]').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const proj = state.projects.find(p => p.id === input.dataset.projUpload);
                proj.cover = await fileToBase64(file);
                Storage.save(state);
                renderProjects();
                showToast('封面已更新');
            });
        });

        // 按钮绑定
        $$('[data-proj-view]').forEach(btn => btn.addEventListener('click', () => viewProject(btn.dataset.projView)));
        $$('[data-proj-edit]').forEach(btn => btn.addEventListener('click', () => editProject(btn.dataset.projEdit)));
        $$('[data-proj-del]').forEach(btn => btn.addEventListener('click', () => {
            if (!confirm('确定删除这个项目吗？')) return;
            state.projects = state.projects.filter(p => p.id !== btn.dataset.projDel);
            Storage.save(state);
            renderProjects();
            showToast('已删除');
        }));
    }

    function viewProject(id) {
        const proj = state.projects.find(p => p.id === id);
        if (!proj) return;

        const content = $('projectModalContent');
        content.innerHTML = `
            <button class="project-modal-close" onclick="closeProjectModal()"><i class="fas fa-times"></i></button>
            <div class="project-modal-cover">
                ${proj.cover 
                    ? `<img src="${proj.cover}" alt="${proj.name}">` 
                    : `<div style="background: var(--bg-secondary); height: 300px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">暂无封面</div>`
                }
            </div>
            <div class="project-modal-body">
                <div class="project-modal-meta">
                    <span>${proj.year}</span>
                    <span>${proj.category}</span>
                </div>
                <h2>${proj.name}</h2>
                <div class="project-brand" style="margin-bottom: 20px;"><i class="fas fa-building"></i> ${proj.brand}</div>
                <p class="project-modal-desc">${proj.description}</p>
                ${proj.photos && proj.photos.length > 0 ? `
                    <h4 style="margin-bottom: 16px; color: var(--gold);">落地照片</h4>
                    <div class="project-modal-photos">
                        ${proj.photos.map((photo, i) => `
                            <div class="project-modal-photo" data-photo-index="${i}">
                                <img src="${photo}" alt="Photo ${i + 1}">
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-add-item" id="addMorePhotos" style="margin-top: 16px; margin-bottom: 16px;">
                        <i class="fas fa-plus"></i> 添加更多照片
                    </button>
                ` : `
                    <button class="btn-add-item" id="addPhotosBtn" style="margin-bottom: 16px;">
                        <i class="fas fa-plus"></i> 上传落地照片
                    </button>
                `}
                ${proj.pdfFile ? `
                    <div class="project-modal-pdf">
                        <div class="project-modal-pdf-info">
                            <i class="fas fa-file-pdf"></i>
                            <div>
                                <div class="project-modal-pdf-name">${proj.pdfName || '项目方案.pdf'}</div>
                                <div class="project-modal-pdf-size">PDF 文档</div>
                            </div>
                        </div>
                        <button data-pdf-preview="${id}">
                            <i class="fas fa-eye"></i> 在线预览
                        </button>
                    </div>
                    <button class="btn-ghost" data-pdf-replace="${id}" style="margin-top: 12px;"><i class="fas fa-upload"></i> 更换PDF</button>
                ` : `
                    <button class="btn-gold" data-pdf-upload="${id}" style="margin-top: 16px;"><i class="fas fa-upload"></i> 上传项目方案PDF</button>
                `}
            </div>
        `;

        $('projectModal').classList.add('show');

        // 绑定事件
        content.querySelectorAll('[data-photo-index]').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.photoIndex);
                $('lightboxImg').src = proj.photos[idx];
                $('lightbox').classList.add('show');
            });
        });

        const addPhotosBtn = $('addPhotosBtn');
        if (addPhotosBtn) addPhotosBtn.addEventListener('click', () => uploadProjectPhotos(id));
        const addMoreBtn = $('addMorePhotos');
        if (addMoreBtn) addMoreBtn.addEventListener('click', () => uploadProjectPhotos(id));

        content.querySelectorAll('[data-pdf-upload], [data-pdf-replace]').forEach(btn => {
            btn.addEventListener('click', () => uploadProjectPdf(id));
        });

        const previewBtn = content.querySelector('[data-pdf-preview]');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                $('pdfFrame').src = proj.pdfFile;
                $('pdfModal').classList.add('show');
            });
        }
    }

    function closeProjectModal() {
        $('projectModal').classList.remove('show');
    }

    function editProject(id) {
        const proj = state.projects.find(p => p.id === id);
        if (!proj) return;
        const year = prompt('年份:', proj.year); if (year !== null) proj.year = year;
        const brand = prompt('合作品牌:', proj.brand); if (brand !== null) proj.brand = brand;
        const name = prompt('项目名称:', proj.name); if (name !== null) proj.name = name;
        const category = prompt('项目类别:', proj.category); if (category !== null) proj.category = category;
        const description = prompt('项目描述:', proj.description); if (description !== null) proj.description = description;
        Storage.save(state);
        renderProjects();
        showToast('项目已更新');
    }

    async function uploadProjectPhotos(id) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            const proj = state.projects.find(p => p.id === id);
            if (!proj.photos) proj.photos = [];
            for (const file of files) {
                proj.photos.push(await fileToBase64(file));
            }
            Storage.save(state);
            renderProjects();
            viewProject(id);
            showToast(`已上传 ${files.length} 张照片`);
        };
        fileInput.click();
    }

    async function uploadProjectPdf(id) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const proj = state.projects.find(p => p.id === id);
            proj.pdfFile = await fileToBase64(file);
            proj.pdfName = file.name;
            Storage.save(state);
            renderProjects();
            viewProject(id);
            showToast('PDF已上传');
        };
        fileInput.click();
    }

    function addProject() {
        const year = prompt('年份 (如: 2024):'); if (!year) return;
        const brand = prompt('合作品牌:'); if (!brand) return;
        const name = prompt('项目名称:'); if (!name) return;
        const category = prompt('项目类别:'); if (!category) return;
        const description = prompt('项目描述:'); if (!description) return;

        state.projects.push({
            id: generateId('proj'), year, brand, name, category, description,
            cover: '', photos: [], pdfFile: '', pdfName: ''
        });
        Storage.save(state);
        renderProjects();
        showToast('已添加新项目');
    }

    // ===== 合作品牌 =====
    function renderBrands() {
        const grid = $('brandsGrid');
        grid.innerHTML = '';
        state.brands.forEach(brand => {
            const card = document.createElement('div');
            card.className = 'brand-card fade-in';
            card.innerHTML = `
                <div class="brand-del" data-brand-del="${brand.id}"><i class="fas fa-times"></i></div>
                <div class="brand-logo" data-brand-icon="${brand.id}">
                    ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}">` : `<i class="fas fa-building"></i>`}
                </div>
                <input type="file" accept="image/*" data-brand-upload="${brand.id}" hidden>
                <div class="brand-name" data-brand-text="${brand.id}" data-field="name" contenteditable="true">${brand.name}</div>
                <div class="brand-desc" data-brand-text="${brand.id}" data-field="desc" contenteditable="true">${brand.desc}</div>
            `;
            grid.appendChild(card);
        });

        $$('[data-brand-icon]').forEach(el => {
            el.addEventListener('click', () => {
                el.nextElementSibling.click();
            });
        });

        $$('[data-brand-upload]').forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const brand = state.brands.find(b => b.id === input.dataset.brandUpload);
                brand.logo = await fileToBase64(file);
                Storage.save(state);
                renderBrands();
                showToast('品牌LOGO已更新');
            });
        });

        $$('[data-brand-text]').forEach(el => {
            el.addEventListener('blur', () => {
                const brand = state.brands.find(b => b.id === el.dataset.brandText);
                if (brand) {
                    brand[el.dataset.field] = el.textContent.trim();
                    Storage.save(state);
                }
            });
        });

        $$('[data-brand-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('确定删除这个品牌吗？')) return;
                state.brands = state.brands.filter(b => b.id !== btn.dataset.brandDel);
                Storage.save(state);
                renderBrands();
                showToast('已删除');
            });
        });
    }

    function addBrand() {
        const name = prompt('品牌名称:'); if (!name) return;
        const desc = prompt('品牌描述:') || '';
        state.brands.push({ id: generateId('brand'), name, desc, logo: '' });
        Storage.save(state);
        renderBrands();
        showToast('已添加新品牌');
    }

    // ===== 弹窗 =====
    function initModals() {
        $('pdfClose').addEventListener('click', () => $('pdfModal').classList.remove('show'));
        $('lightboxClose').addEventListener('click', () => $('lightbox').classList.remove('show'));
        $('projectModal').addEventListener('click', (e) => {
            if (e.target.id === 'projectModal') closeProjectModal();
        });
        $('pdfModal').addEventListener('click', (e) => {
            if (e.target.id === 'pdfModal') $('pdfModal').classList.remove('show');
        });
        $('lightbox').addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') $('lightbox').classList.remove('show');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeProjectModal();
                $('pdfModal').classList.remove('show');
                $('lightbox').classList.remove('show');
            }
        });
    }

    function renderAll() {
        renderExperience();
        renderHonors();
        renderSkills();
        renderProjects();
        renderBrands();
    }

    function init() {
        initTextContent();
        initNavigation();
        initEditMode();
        initHeroVideo();
        initAboutCard();
        initModals();

        $('addExperienceBtn').addEventListener('click', addExperience);
        $('addHonorBtn').addEventListener('click', addHonor);
        $('addSoftwareBtn').addEventListener('click', addSoftware);
        $('resetSoftwareBtn').addEventListener('click', () => {
            if (confirm('重置所有软件技能为默认？')) {
                state.skills.software = Storage.getDefault().skills.software;
                Storage.save(state);
                renderSkills();
            }
        });
        $('addProjectBtn').addEventListener('click', addProject);
        $('addBrandBtn').addEventListener('click', addBrand);

        renderAll();

        // 入场动画观察
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('fade-in');
            });
        }, { threshold: 0.05 });
        $$('.section, .timeline-item, .honor-card, .software-card, .project-card, .brand-card, .skill-bar-item, .skill-circle-item').forEach(el => {
            observer.observe(el);
        });
    }

    // 全局函数
    window.closeProjectModal = closeProjectModal;
    window.PortfolioApp = {
        editExperience, deleteExperience, addExperience,
        editHonor, deleteHonor, addHonor, previewHonorImage,
        deleteSoftware: () => {},
        addSoftware
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
