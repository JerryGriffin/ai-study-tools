/* ===========================================================
   高数答疑室 · Calculus Studio
   A local-first calculus tutoring workspace.
   =========================================================== */
(function () {
  'use strict';

  const DATA = window.CALC_DATA || {};
  const CHAPTERS = DATA.CHAPTERS || [];
  const QUESTIONS = DATA.QUESTIONS || [];
  const L = String.raw;

  if (!CHAPTERS.length) {
    document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">课程数据加载失败，请确认 data.js 与 index.html 在同一目录。</p>';
    return;
  }

  /* ---------- constants ---------- */

  const KEYS = {
    settings: 'gs.settings',
    sessions: 'gs.sessions',
    current: 'gs.current',
    wrong: 'gs.wrongbook',
    stats: 'gs.stats',
    chapter: 'gs.chapter',
    mode: 'gs.mode',
    theme: 'gs.theme'
  };

  const MODES = {
    guide: {
      label: '引导式',
      short: '引导',
      desc: '先给一层提示，等你尝试后再展开。',
      instruction: '采用苏格拉底式引导：先用一两句话复述题目与考点，再给一个不暴露最终答案的关键提示，最后用一个具体问题引导学生写出下一步。除非学生明确说“直接讲”或“不会”，不要一次性给出完整解答。'
    },
    explain: {
      label: '精讲',
      short: '精讲',
      desc: '完整推导、依据与易错点。',
      instruction: '给出完整、严谨、分步的讲解：说明思路从哪里来，每一步的依据是什么，最后指出易错点并总结方法。'
    },
    exam: {
      label: '速解',
      short: '速解',
      desc: '先给路线与答案，再补关键步骤。',
      instruction: '以考试速解为目标：先给可执行的解题路线和最终答案，再给关键步骤，最后用一句话点出本题最容易丢分的地方。省略冗长铺垫。'
    }
  };

  const MODE_COLORS = {
    guide: 'var(--accent)',
    explain: 'var(--warm)',
    exam: 'var(--muted)'
  };

  const PRESETS = [
    { id: 'kilo', label: 'Kilo 免费', base: '/api', model: 'kilo-auto/free', hint: '免 Key，推荐（先运行 python serve.py）' },
    { id: 'opencode', label: 'OpenCode 免费', base: '/api', model: 'opencode/deepseek-v4.1-flash-free', hint: '使用本机 OpenCode 免费模型' },
    { id: 'pollinations', label: 'Pollinations', base: 'https://text.pollinations.ai/openai', model: 'openai', hint: '免 Key，匿名限速' },
    { id: 'proxy', label: '自定义代理', base: '/api', model: 'omniedu-4b', hint: '先运行 python serve.py' },
    { id: 'vllm', label: 'OmniEdu · vLLM', base: 'http://127.0.0.1:8000/v1', model: 'omniedu-4b', hint: 'OpenAI 兼容接口' },
    { id: 'ollama', label: 'Ollama', base: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b', hint: '本地模型' },
    { id: 'deepseek', label: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', hint: '需要 API Key' },
    { id: 'openai', label: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', hint: '需要 API Key' }
  ];

  const FORMULA_SNIPPETS = [
    { label: '分数', insert: L`$\frac{}{}$`, offset: 7 },
    { label: '根号', insert: L`$\sqrt{}$`, offset: 6 },
    { label: '上标', insert: L`$^{}$`, offset: 3 },
    { label: '下标', insert: L`$_{}$`, offset: 3 },
    { label: '积分', insert: L`$\int_{}^{}$`, offset: 7 },
    { label: '极限', insert: L`$\lim_{x\to 0}$`, offset: 16 },
    { label: '求和', insert: L`$\sum_{n=1}^{\infty}$`, offset: 20 },
    { label: '无穷', insert: L`$\infty$`, offset: 8 }
  ];

  const DEMO_STEPS = {
    limits: [
      '判断极限类型：能直接代入吗？是 $\\frac00$、$\\frac{\\infty}{\\infty}$、$1^{\\infty}$，还是含根式的差？',
      '优先尝试**等价无穷小**和**两个重要极限**，它们通常比洛必达更快。',
      '如果分子或分母出现“相减”结构，考虑**泰勒展开**，并展开到与分母同阶。',
      '使用洛必达前，确认满足未定式条件，且求导后的极限确实存在。'
    ],
    derivative: [
      '先明确“对谁求导”，以及题目要求的是导数、微分还是切线斜率。',
      '识别结构：乘积用乘积法则，嵌套用链式法则，隐函数两边同时求导。',
      '参数方程先分别对参数求导，再相除；二阶导要再对参数求导后除以 $\\frac{dx}{dt}$。',
      '求完后检查定义域和不可导点，必要时用导数定义验证分段点。'
    ],
    mvt: [
      '把待证结论改写成 $f(b)-f(a)$ 或 $F\'(x)$ 的形式，反推辅助函数。',
      '验证闭区间连续、开区间可导；使用罗尔定理时还要检查端点函数值相等。',
      '对 $\\frac{1}{1+\\xi}$、$\\xi$ 这类量做范围估计，得到不等式。',
      '如果是极限或函数性态问题，比较泰勒展开与洛必达的成本。'
    ],
    indefinite: [
      '先看结构：能否凑成 $f(\\varphi(x))\\varphi\'(x)$？能否令 $u$ 消去根号？',
      '乘积结构优先考虑分部积分，按“反对幂指三”选择 $u$ 和 $dv$。',
      '有理函数先做多项式除法，再部分分式分解。',
      '算完一定求导验算，并检查是否漏掉 $+C$。'
    ],
    definite: [
      '先画草图，确定积分区域、上下曲线和交点。',
      '求原函数后用牛顿-莱布尼茨公式；分段函数要在分段点拆开。',
      '优先用奇偶性、周期性、对称性简化，再考虑换元。',
      '反常积分先写成极限，再判断收敛性；几何应用注意“上减下”和半径的选取。'
    ],
    multivariable: [
      '求偏导时固定其他变量；复合结构用链式法则。',
      '方向导数先把方向单位化，再与梯度做点积。',
      '求极值先解 $f_x=f_y=0$，再用 $D=f_{xx}f_{yy}-f_{xy}^2$ 或配方法判定。',
      '检查边界与不可微点，避免把驻点直接当成最值点。'
    ],
    multiple: [
      '先画区域并写出不等式描述，再决定积分次序。',
      '被积函数含 $x^2+y^2$ 或区域是圆/环时，优先极坐标，记得乘 $r$。',
      '交换次序的关键是“固定一个变量”，重新描述另一个变量的范围。',
      '三重积分根据区域形状选择柱坐标或球坐标，并写出雅可比因子。'
    ],
    'line-surface': [
      '先分清第一类还是第二类：第一类看弧长/面积，第二类看方向。',
      '第二类曲线积分可以参数化，也可以尝试格林公式；注意曲线是否闭、方向是否为正。',
      '曲面积分先判断投影方向，第二类注意法向量与正负号。',
      '使用高斯公式时，封闭曲面才可直接用；不封闭时先补面并减去补面上的积分。'
    ],
    series: [
      '先看通项是否趋于 $0$：不趋于 $0$ 直接发散。',
      '根据结构选择判别法：$p$ 级数、比值法、根值法、比较法或莱布尼茨法。',
      '判断绝对收敛与条件收敛要分开讨论。',
      '幂级数先求收敛半径，再单独检查两个端点。'
    ],
    ode: [
      '先识别类型：可分离、一阶线性、齐次、可降阶，还是二阶常系数。',
      '可分离方程分离变量后积分；一阶线性方程用积分因子。',
      '二阶常系数先写特征方程，按特征根类型写通解。',
      '有初值条件时最后代入定常数，并检查是否漏掉特解。'
    ]
  };

  const DEMO_QUESTIONS = {
    limits: '你能否先判断它属于哪一种未定式？如果分子是“相减”的结构，直接替换等价无穷小会丢失哪一阶？',
    derivative: '题目里的 $y$ 是显式函数、隐函数，还是由参数给出的？这决定了你应该先做哪一步。',
    mvt: '要证明的结论更像“函数值之差”，还是“导数符号”？前者提示中值定理，后者提示单调性。',
    indefinite: '被积函数里有没有“某个函数乘以它的导数”的影子？如果有，换元会比分部更省力。',
    definite: '先别算原函数：画出区域，确认上限曲线和下限曲线分别是谁。',
    multivariable: '这道题的自变量之间有没有依赖关系？如果没有，求偏导时把另一个变量当成常数。',
    multiple: '区域是矩形、圆、还是由两条曲线围成？先把它画出来，积分限自然就出现了。',
    'line-surface': '曲线/曲面是封闭的吗？方向或侧确定了吗？这两个问题决定能不能直接用格林/高斯公式。',
    series: '通项趋于 $0$ 了吗？如果趋于 $0$，它更像 $p$ 级数、几何级数，还是需要比值判别？',
    ode: '方程里最高阶导数是几阶？它更像“可分离”“一阶线性”，还是“常系数齐次”？'
  };

  const DEMO_TIPS = {
    limits: '等价无穷小只能在**乘除**中整体替换。像 $\\sin x-x$ 这样的加减结构，直接替换会丢掉高阶项。',
    derivative: '隐函数求导时，遇到 $y$ 要乘 $y\'$；参数方程的二阶导不是把 $\\frac{dy}{dx}$ 再对 $x$ 求导那么简单。',
    mvt: '中值定理的难点通常不是定理本身，而是辅助函数。先看结论，再反推需要验证的 $F\'$。',
    indefinite: '不定积分最容易丢的是 $+C$；第二容易丢的是换元后忘记回代。',
    definite: '定积分几何应用最常见的问题是上下曲线弄反，以及旋转体半径取错。',
    multivariable: '偏导数存在不代表函数连续，更不代表可微；可微的判定要看全增量与全微分之差。',
    multiple: '极坐标换元时忘记乘 $r$ 是高频错误；交换次序前不画图也容易定错限。',
    'line-surface': '格林公式要求曲线闭、方向为正、$P,Q$ 有连续偏导；三者缺一不可。',
    series: '“通项趋于 0”只是收敛的必要条件，不能反过来用来证明收敛。',
    ode: '一阶线性方程的积分因子公式不要死背，理解“乘上去让左边变成乘积的导数”更稳。'
  };

  /* ---------- helpers ---------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let seq = 0;
  function uid(prefix) {
    seq += 1;
    return prefix + '_' + Date.now().toString(36) + '_' + seq.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLocal(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function setLocal(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (err) {
      /* storage may be disabled (private mode / file origin) */
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function shiftDate(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatTime(ts) {
    const d = new Date(ts || Date.now());
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDate(ts) {
    const d = new Date(ts || Date.now());
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  const chapterMap = new Map(CHAPTERS.map((c) => [c.id, c]));
  const questionMap = new Map(QUESTIONS.map((q) => [q.id, q]));

  function chapterOf(id) {
    return chapterMap.get(id) || CHAPTERS[0];
  }

  function inferChapter(text) {
    const source = String(text || '');
    let best = chapterOf(state.chapterId);
    let bestScore = 0;
    CHAPTERS.forEach((chapter) => {
      let score = 0;
      (chapter.keywords || []).forEach((keyword) => {
        if (source.includes(keyword)) score += keyword.length >= 4 ? 2 : 1;
      });
      if (score > bestScore) {
        bestScore = score;
        best = chapter;
      }
    });
    return best;
  }

  function questionsOf(chapterId) {
    return QUESTIONS.filter((q) => q.chapter === chapterId);
  }

  /* ---------- state ---------- */

  const defaultStats = () => ({
    asked: 0,
    practice: 0,
    solved: [],
    byChapter: {},
    modes: { guide: 0, explain: 0, exam: 0 },
    days: {}
  });

  const rawSettings = loadJSON(KEYS.settings, {});
  const hasSavedSettings = !!getLocal(KEYS.settings);
  const rawStats = loadJSON(KEYS.stats, defaultStats());
  const settings = {
    baseUrl: '',
    model: '',
    apiKey: '',
    temperature: 0.3,
    maxTokens: 1800,
    stream: true,
    allowVision: true
  };
  Object.assign(settings, rawSettings && typeof rawSettings === 'object' ? rawSettings : {});

  const stats = Object.assign(defaultStats(), rawStats && typeof rawStats === 'object' ? rawStats : {});
  if (!Array.isArray(stats.solved)) stats.solved = [];
  if (!stats.modes || typeof stats.modes !== 'object') stats.modes = { guide: 0, explain: 0, exam: 0 };
  if (!stats.byChapter || typeof stats.byChapter !== 'object') stats.byChapter = {};
  if (!stats.days || typeof stats.days !== 'object') stats.days = {};

  let sessions = loadJSON(KEYS.sessions, []);
  if (!Array.isArray(sessions)) sessions = [];
  sessions = sessions.filter((s) => s && typeof s === 'object' && Array.isArray(s.messages)).slice(0, 30);
  sessions.forEach((s) => {
    s.messages.forEach((m) => {
      if (m && m.streaming) {
        m.streaming = false;
        if (!m.content) m.content = '*（上次生成被中断）*';
      }
    });
  });

  let wrongbook = loadJSON(KEYS.wrong, []);
  if (!Array.isArray(wrongbook)) wrongbook = [];

  const state = {
    settings,
    stats,
    sessions,
    wrongbook,
    currentId: getLocal(KEYS.current) || null,
    chapterId: chapterMap.has(getLocal(KEYS.chapter)) ? getLocal(KEYS.chapter) : CHAPTERS[0].id,
    mode: MODES[getLocal(KEYS.mode)] ? getLocal(KEYS.mode) : 'guide',
    theme: getLocal(KEYS.theme) === 'dark' ? 'dark' : 'light',
    pendingImages: [],
    streaming: false,
    abort: null,
    practice: { question: null, filter: null, hint: false, solution: false },
    suggestions: [],
    demoNoticeShown: false,
    publicMode: false,
    staticMode: false,
    storageWarned: false
  };

  if (state.currentId && !sessions.some((s) => s.id === state.currentId)) state.currentId = null;

  function currentSession() {
    return state.sessions.find((s) => s.id === state.currentId) || null;
  }

  /* ---------- persistence ---------- */

  function stripOldImages() {
    for (let i = 2; i < state.sessions.length; i += 1) {
      state.sessions[i].messages.forEach((m) => {
        if (m.images) m.images = [];
      });
    }
  }

  function persist() {
    let saved = false;
    try {
      saveJSON(KEYS.sessions, state.sessions.slice(0, 24));
      saved = true;
    } catch (err) {
      stripOldImages();
      try {
        saveJSON(KEYS.sessions, state.sessions.slice(0, 24));
        saved = true;
      } catch (err2) {
        try {
          saveJSON(KEYS.sessions, state.sessions.slice(0, 8));
          saved = true;
        } catch (err3) {
          if (!state.storageWarned) {
            state.storageWarned = true;
            toast('本地存储空间不足，旧对话可能未完整保存', 'warn');
          }
        }
      }
    }

    try {
      saveJSON(KEYS.stats, state.stats);
      saveJSON(KEYS.wrong, state.wrongbook);
    } catch (err) {
      /* stats are small; ignore transient quota errors */
    }

    try {
      localStorage.setItem(KEYS.chapter, state.chapterId);
      localStorage.setItem(KEYS.mode, state.mode);
      localStorage.setItem(KEYS.theme, state.theme);
      if (state.currentId) localStorage.setItem(KEYS.current, state.currentId);
      else localStorage.removeItem(KEYS.current);
    } catch (err) {
      /* ignore */
    }

    return saved;
  }

  function markDay() {
    const key = dateKey();
    state.stats.days[key] = (state.stats.days[key] || 0) + 1;
    const keys = Object.keys(state.stats.days);
    if (keys.length > 420) {
      keys.sort();
      keys.slice(0, keys.length - 400).forEach((k) => delete state.stats.days[k]);
    }
  }

  function calcStreak() {
    let cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!state.stats.days[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    for (let i = 0; i < 800; i += 1) {
      if (!state.stats.days[dateKey(cursor)]) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function solvedInChapter(chapterId) {
    return state.stats.solved.filter((id) => {
      const q = questionMap.get(id);
      return q && q.chapter === chapterId;
    }).length;
  }

  /* ---------- markdown + math ---------- */

  function mathHtml(tex, display) {
    const source = String(tex == null ? '' : tex).trim();
    if (window.katex) {
      try {
        return '<span class="' + (display ? 'math-block' : 'math-inline') + '">' +
          window.katex.renderToString(source, {
            displayMode: !!display,
            throwOnError: false,
            strict: 'ignore',
            trust: false
          }) + '</span>';
      } catch (err) {
        /* fall through to plain text */
      }
    }
    return '<code class="math-fallback">' + escapeHtml(source) + '</code>';
  }

  function inlineFormat(text) {
    let out = text;
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return out;
  }

  function splitTableRow(line) {
    return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((cell) => cell.trim());
  }

  function renderBlocks(source) {
    const lines = source.split('\n');
    const out = [];
    let paragraph = [];
    let listType = null;

    const flushParagraph = () => {
      if (paragraph.length) {
        out.push('<p>' + inlineFormat(paragraph.join('<br>')) + '</p>');
        paragraph = [];
      }
    };
    const closeList = () => {
      if (listType) {
        out.push('</' + listType + '>');
        listType = null;
      }
    };
    const flushAll = () => {
      flushParagraph();
      closeList();
    };

    for (let i = 0; i < lines.length; i += 1) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        flushAll();
        continue;
      }

      if (/^\u0001\d+\u0001$/.test(line)) {
        flushAll();
        out.push(line);
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushAll();
        const level = heading[1].length;
        out.push('<h' + level + '>' + inlineFormat(heading[2]) + '</h' + level + '>');
        continue;
      }

      if (/^([-*_])\1{2,}$/.test(line)) {
        flushAll();
        out.push('<hr>');
        continue;
      }

      if (line.includes('|') && i + 1 < lines.length &&
          /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        flushAll();
        const header = splitTableRow(line);
        const rows = [];
        i += 2;
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          rows.push(splitTableRow(lines[i].trim()));
          i += 1;
        }
        i -= 1;
        out.push(
          '<table><thead><tr>' + header.map((cell) => '<th>' + inlineFormat(cell) + '</th>').join('') +
          '</tr></thead><tbody>' + rows.map((row) =>
            '<tr>' + row.map((cell) => '<td>' + inlineFormat(cell) + '</td>').join('') + '</tr>'
          ).join('') + '</tbody></table>'
        );
        continue;
      }

      if (/^&gt;\s?/.test(line)) {
        flushAll();
        const quote = [];
        while (i < lines.length && /^&gt;\s?/.test(lines[i].trim())) {
          quote.push(lines[i].trim().replace(/^&gt;\s?/, ''));
          i += 1;
        }
        i -= 1;
        out.push('<blockquote>' + renderBlocks(quote.join('\n')) + '</blockquote>');
        continue;
      }

      const unordered = line.match(/^[-*+]\s+(.*)$/);
      const ordered = line.match(/^\d+[.)]\s+(.*)$/);
      if (unordered || ordered) {
        flushParagraph();
        const type = unordered ? 'ul' : 'ol';
        if (listType && listType !== type) closeList();
        if (!listType) {
          out.push('<' + type + '>');
          listType = type;
        }
        out.push('<li>' + inlineFormat(unordered ? unordered[1] : ordered[1]) + '</li>');
        continue;
      }

      closeList();
      paragraph.push(line);
    }

    flushAll();
    return out.join('\n');
  }

  function renderRich(text) {
    const tokens = [];
    const stash = (html) => {
      tokens.push(html);
      return '\u0001' + (tokens.length - 1) + '\u0001';
    };

    let source = String(text == null ? '' : text);

    source = source.replace(/```[a-zA-Z0-9_+-]*\n?([\s\S]*?)```/g, (match, code) =>
      stash('<pre class="code-block"><code>' + escapeHtml(code) + '</code></pre>'));

    source = source.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => stash(mathHtml(tex, true)));
    source = source.replace(/\\\[([\s\S]+?)\\\]/g, (match, tex) => stash(mathHtml(tex, true)));
    source = source.replace(/\\\(([\s\S]+?)\\\)/g, (match, tex) => stash(mathHtml(tex, false)));
    source = source.replace(/(^|[^\\$])\$([^\n$]+?)\$(?!\$)/g, (match, pre, tex) => pre + stash(mathHtml(tex, false)));

    source = escapeHtml(source);
    let html = renderBlocks(source);
    html = html.replace(/\u0001(\d+)\u0001/g, (match, index) => tokens[Number(index)] || '');
    return html;
  }

  /* ---------- demo engine ---------- */

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[^0-9a-z\u4e00-\u9fff]+/g, '');
  }

  function bigrams(value) {
    const set = new Set();
    for (let i = 0; i < value.length - 1; i += 1) set.add(value.slice(i, i + 2));
    return set;
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length > 10 && b.includes(a)) return 0.9;
    if (b.length > 10 && a.includes(b)) return 0.9;
    const A = bigrams(a);
    const B = bigrams(b);
    if (!A.size || !B.size) return 0;
    let overlap = 0;
    A.forEach((item) => {
      if (B.has(item)) overlap += 1;
    });
    return (2 * overlap) / (A.size + B.size);
  }

  function matchBank(text) {
    const needle = normalizeText(text);
    if (needle.length < 6) return null;
    let best = null;
    let bestScore = 0;
    QUESTIONS.forEach((q) => {
      const target = normalizeText(q.title + ' ' + q.question + ' ' + q.answer);
      const score = similarity(needle, target);
      if (score > bestScore) {
        bestScore = score;
        best = q;
      }
    });
    return bestScore >= 0.42 ? best : null;
  }

  function demoBankAnswer(question, chapter, mode) {
    const note = '> **离线演示**：当前还没有连接模型。下面是本地题库中的完整解析，接入模型后可继续针对你的追问讲解。\n\n';
    let out = note + '### 题目\n' + question.question + '\n\n';

    if (mode === 'guide') {
      out += '### 先想一步\n' + question.hint + '\n\n';
      out += '### 引导问题\n' + (DEMO_QUESTIONS[chapter.id] || '你打算先做哪一步？') + '\n\n';
      out += '> 试着写出你的下一步，再让我帮你检查。想看完整解析，可以把模式切换到「精讲」。';
      return out;
    }

    if (mode === 'exam') {
      out += '### 答案\n' + question.answer + '\n\n';
      out += '### 关键步骤\n' + question.solution;
      return out;
    }

    out += '### 思路提示\n' + question.hint + '\n\n';
    out += '### 分步解析\n' + question.solution + '\n\n';
    out += '### 答案\n' + question.answer;
    return out;
  }

  function buildDemoAnswer(questionText, chapter, mode, bankQuestion) {
    if (bankQuestion) return demoBankAnswer(bankQuestion, chapter, mode);

    if (/出.*题|练一练|练习题|自测|考考我/.test(questionText)) {
      const pool = questionsOf(chapter.id);
      const q = pool[Math.floor(Math.random() * pool.length)] || QUESTIONS[0];
      return '> **离线演示**：还没有连接模型。先做一道本地题库里的题，接入模型后可获得针对性讲解。\n\n' +
        '### 练习 · ' + q.title + '\n' + q.question + '\n\n' +
        '**只给一个提示：** ' + q.hint + '\n\n' +
        '> 想好后，可以在「每日一练」里展开完整解析，或接入模型继续追问。';
    }

    const steps = (DEMO_STEPS[chapter.id] || []).map((step, index) => (index + 1) + '. ' + step).join('\n');
    const tip = DEMO_TIPS[chapter.id] || '先把题目条件翻译成数学语言，再选择方法。';
    const guiding = DEMO_QUESTIONS[chapter.id] || '你卡在哪一步？';

    if (mode === 'exam') {
      return '> **离线演示**：还没有连接模型。下面是这类题的速解框架。\n\n' +
        '### 题目定位\n这道题属于 **' + chapter.name + '**。' + chapter.intro + '\n\n' +
        '### 速解路线\n' + steps + '\n\n' +
        '### 最容易丢分的地方\n' + tip + '\n\n' +
        '> 接入模型后，我会直接给出本题的答案与关键步骤。';
    }

    let out = '> **离线演示**：还没有连接模型。下面是根据「' + chapter.name + '」生成的教学框架，不是针对你题目条件的最终解答。\n\n';
    out += '### 定位\n';
    out += '这道题属于 **' + chapter.name + '**。' + chapter.intro + '\n\n';
    out += '### 解题路线\n' + steps + '\n\n';
    if (mode === 'guide') {
      out += '### 先别急着算\n' + guiding + '\n\n';
      out += '> 写出你的第一步，我会沿着你的思路继续追问。';
    } else {
      out += '### 关键提醒\n' + tip + '\n\n';
      out += '### 一个自测问题\n' + guiding + '\n\n';
      out += '> 把完整题目（包括条件与所求）发来，或点击右上角「设置」接入模型，就能得到分步推导。';
    }
    return out;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function streamDemo(text, onDelta, signal) {
    await sleep(260);
    const chunkSize = text.length > 1400 ? 5 : 3;
    for (let i = 0; i < text.length; i += chunkSize) {
      if (signal.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }
      onDelta(text.slice(i, i + chunkSize));
      await sleep(text.length > 1400 ? 5 : 9);
    }
  }

  /* ---------- API ---------- */

  function apiEndpoint(baseUrl) {
    const base = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!base) return '';
    if (base === '/api') return '/api/chat';
    if (/\/chat\/completions$/i.test(base)) return base;
    return base + '/chat/completions';
  }

  function apiHeaders(cfg) {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
    return headers;
  }

  function extractContent(data) {
    if (!data) return '';
    const choice = data.choices && data.choices[0];
    if (!choice) return '';
    const content = choice.message ? choice.message.content : choice.text;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => (typeof part === 'string' ? part : part && part.text ? part.text : '')).join('');
    }
    return '';
  }

  function extractDelta(data) {
    if (!data) return '';
    const choice = data.choices && data.choices[0];
    if (!choice) return '';
    const delta = choice.delta || choice.message;
    const content = delta ? delta.content : choice.text;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => (typeof part === 'string' ? part : part && part.text ? part.text : '')).join('');
    }
    return '';
  }

  function formatHttpError(status, body) {
    let detail = String(body || '').trim();
    try {
      const parsed = JSON.parse(body);
      detail = (parsed.error && (parsed.error.message || parsed.error.type)) || parsed.message || detail;
    } catch (err) {
      /* keep text */
    }
    detail = detail.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 360);
    const hints = {
      400: '请求格式被服务拒绝。',
      401: 'API Key 无效或缺失。',
      403: '密钥没有访问该模型的权限。',
      404: '接口地址或模型名称不正确。',
      413: '输入内容过长。',
      429: '请求过于频繁或额度不足。',
      500: '模型服务内部错误。',
      502: '模型服务网关错误。',
      503: '模型服务暂时不可用。'
    };
    return (hints[status] || ('HTTP ' + status + '。')) + (detail ? ' ' + detail : '');
  }

  function friendlyError(err) {
    const message = err && err.message ? err.message : String(err);
    if (/Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed/i.test(message)) {
      return '无法连接到模型服务。请确认服务已经启动、地址填写正确；如果浏览器拦截了跨域请求，请运行 python serve.py，然后把 Base URL 填成 /api。';
    }
    if (/timed out|timeout/i.test(message)) {
      return '连接超时。模型可能正在加载，或网络不可达。可以稍后再试，或在设置里检查接口地址。';
    }
    if (/CORS/i.test(message)) {
      return '浏览器拦截了跨域请求。请使用 python serve.py 的本地代理（Base URL 填 /api），或在模型服务端开启 CORS。';
    }
    return message;
  }

  async function readSSE(response, onDelta) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) return false;
      const payload = trimmed.slice(5).trim();
      if (!payload) return false;
      if (payload === '[DONE]') return true;
      try {
        const json = JSON.parse(payload);
        const delta = extractDelta(json);
        if (delta) onDelta(delta);
      } catch (err) {
        /* ignore malformed keep-alives */
      }
      return false;
    };

    while (!finished) {
      const result = await reader.read();
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (handleLine(line)) {
          finished = true;
          break;
        }
      }
    }

    if (!finished && buffer.trim()) handleLine(buffer);
    try {
      reader.releaseLock();
    } catch (err) {
      /* ignore */
    }
  }

  async function requestCompletion(messages, onDelta, signal, cfg, baseUrlOverride) {
    const options = cfg || state.settings;
    const endpoint = apiEndpoint(baseUrlOverride || options.baseUrl);
    if (!endpoint) throw new Error('还没有配置模型接口。请打开设置填写 Base URL，或继续使用离线演示。');
    if (!options.model) throw new Error('还没有填写模型名称。请打开设置补充模型名称。');

    const body = {
      model: options.model,
      messages,
      temperature: Number(options.temperature) || 0,
      max_tokens: Number(options.maxTokens) || 1800,
      stream: !!options.stream
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: apiHeaders(options),
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      let text = '';
      try {
        text = await response.text();
      } catch (err) {
        text = '';
      }
      throw new Error(formatHttpError(response.status, text));
    }

    const contentType = response.headers.get('content-type') || '';
    if (!options.stream || (contentType.includes('application/json') && !contentType.includes('event-stream'))) {
      const data = await response.json();
      const content = extractContent(data);
      if (!content) throw new Error('模型返回了空内容。请检查模型名称，或换一个兼容 OpenAI 的接口。');
      onDelta(content);
      return;
    }

    await readSSE(response, onDelta);
  }

  function buildSystemPrompt(mode, chapter) {
    const modeInfo = MODES[mode] || MODES.guide;
    return '你叫「高数助教」，是「高数答疑室」里的大学高等数学老师。你的学生是中国高校本科生，正在学习高数（微积分）。\n\n' +
      '当前章节：' + chapter.name + '。章节导读：' + chapter.intro + '\n' +
      '回答模式：' + modeInfo.label + '。' + modeInfo.instruction + '\n\n' +
      '教学原则：\n' +
      '1. 先诊断：用一两句话判断题目考点、学生可能卡住的地方；如果题目信息不全，先问一个最关键的问题。\n' +
      '2. 引导优先：引导式模式下先给提示和追问，不直接给出完整答案；学生明确说“直接讲/不会”时再展开。\n' +
      '3. 分步推导：每一步写清依据（定理、公式、换元、判别法），不跳关键步骤。\n' +
      '4. 多表征：必要时给几何直观、数值检验或反例。\n' +
      '5. 纠错：指出本题最常见的错误，而不是泛泛而谈。\n' +
      '6. 收尾：用一小段总结方法；如合适，给一道同类型自测题，但不要立刻给答案。\n' +
      '7. 如果题目明显不属于当前章节，以题目实际考点为准，并在开头简要说明。\n\n' +
      '格式要求：\n' +
      '- 用中文回答，语气温和、具体，不空泛鼓励。\n' +
      '- 数学公式必须用 LaTeX：行内 $...$，独立公式 $$...$$。\n' +
      '- 用 Markdown 小标题和编号步骤组织；不要输出 HTML。\n' +
      '- 不编造定理或答案；不确定时明确说明，并给出验证思路。\n' +
      '- 如果学生只是打招呼，简短回应并邀请他写出题目或卡点。';
  }

  function buildApiMessages(session) {
    const chapter = chapterOf(session.chapterId);
    const mode = session.mode || state.mode;
    const messages = [{ role: 'system', content: buildSystemPrompt(mode, chapter) }];

    session.messages
      .filter((m) => m && !m.error && !m.streaming && !m.demo)
      .slice(-24)
      .forEach((m) => {
        if (m.role === 'user') {
          const text = m.content || '请看这道题。';
          if (m.images && m.images.length && state.settings.allowVision) {
            const parts = [{ type: 'text', text: text }];
            m.images.forEach((url) => {
              parts.push({ type: 'image_url', image_url: { url: url } });
            });
            messages.push({ role: 'user', content: parts });
          } else {
            messages.push({
              role: 'user',
              content: text + (m.images && m.images.length ? '\n（用户上传了题目截图，但当前未启用图片输入。）' : '')
            });
          }
        } else if (m.role === 'assistant' && m.content) {
          messages.push({ role: 'assistant', content: m.content });
        }
      });

    return messages;
  }

  /* ---------- message generation ---------- */

  function isDemo() {
    return !state.settings.baseUrl || !state.settings.model;
  }

  function findMessage(id) {
    const session = currentSession();
    if (!session) return null;
    return session.messages.find((m) => m.id === id) || null;
  }

  function scrollToBottom(force) {
    if (force) {
      chatScroll.scrollTop = chatScroll.scrollHeight;
      return;
    }
    requestAnimationFrame(() => {
      chatScroll.scrollTop = chatScroll.scrollHeight;
    });
  }

  function isNearBottom() {
    return chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight < 180;
  }

  async function generateAssistant(session) {
    if (state.streaming) return;
    const mode = session.mode || state.mode;
    const demo = isDemo();

    const placeholder = {
      id: uid('m'),
      role: 'assistant',
      content: '',
      ts: Date.now(),
      mode,
      streaming: true,
      demo
    };
    session.messages.push(placeholder);

    state.streaming = true;
    const controller = new AbortController();
    state.abort = controller;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 120000);

    renderAll();
    updateComposer();
    scrollToBottom(true);

    let paintTimer = null;
    const paint = () => {
      paintTimer = null;
      const target = messageList.querySelector('[data-mid="' + placeholder.id + '"] .rich');
      if (!target) return;
      const stick = isNearBottom();
      target.innerHTML = renderRich(placeholder.content) + '<span class="streaming-caret"></span>';
      if (stick) scrollToBottom(true);
    };
    const onDelta = (delta) => {
      if (!delta) return;
      placeholder.content += delta;
      if (!paintTimer) paintTimer = setTimeout(paint, 60);
    };

    try {
      if (demo) {
        const lastUser = [...session.messages].reverse().find((m) => m.role === 'user' && !m.demo);
        let bank = null;
        if (lastUser && lastUser.bankId) bank = questionMap.get(lastUser.bankId) || null;
        if (!bank && lastUser) bank = matchBank(lastUser.content || '');
        const demoChapter = bank ? chapterOf(bank.chapter) : inferChapter(lastUser ? lastUser.content : '');
        const answer = buildDemoAnswer(lastUser ? lastUser.content || '' : '', demoChapter, mode, bank);
        await streamDemo(answer, onDelta, controller.signal);
        if (!placeholder.content.trim()) throw new Error('演示内容生成失败。');
      } else {
        const messages = buildApiMessages(session);
        await requestCompletion(messages, onDelta, controller.signal);
        if (!placeholder.content.trim()) throw new Error('模型返回了空内容。请检查模型名称，或换一个兼容 OpenAI 的接口。');
      }
      placeholder.streaming = false;
    } catch (err) {
      placeholder.streaming = false;
      if (err && err.name === 'AbortError') {
        if (timedOut) {
          placeholder.error = true;
          placeholder.errorText = '请求超时（120 秒）。模型可能正在加载，或网络不可达。';
        } else if (placeholder.content.trim()) {
          placeholder.content += '\n\n*（已停止生成）*';
        } else {
          placeholder.content = '*（已停止生成）*';
        }
      } else {
        placeholder.error = true;
        placeholder.errorText = friendlyError(err);
      }
    } finally {
      clearTimeout(timeout);
      if (paintTimer) clearTimeout(paintTimer);
      if (state.abort === controller) state.abort = null;
      state.streaming = false;
      placeholder.streaming = false;
      session.updatedAt = Date.now();
      persist();
      renderAll();
      updateComposer();
      if (isNearBottom()) scrollToBottom(true);
    }
  }

  function stopGeneration() {
    if (state.abort) {
      try {
        state.abort.abort();
      } catch (err) {
        /* ignore */
      }
    }
  }

  async function sendMessage(text, extra) {
    if (state.streaming) return;
    const clean = String(text || '').trim();
    if (!clean && !state.pendingImages.length) return;

    let session = currentSession();
    if (!session) {
      session = {
        id: uid('s'),
        title: '新对话',
        chapterId: state.chapterId,
        mode: state.mode,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.sessions.unshift(session);
      state.currentId = session.id;
    }

    const images = state.pendingImages.slice();
    const message = {
      id: uid('m'),
      role: 'user',
      content: clean,
      images,
      ts: Date.now(),
      bankId: extra && extra.bankId ? extra.bankId : undefined
    };
    session.messages.push(message);
    session.chapterId = state.chapterId;
    session.mode = state.mode;
    session.updatedAt = Date.now();

    if (!session.title || session.title === '新对话') {
      const title = clean ? clean.replace(/\s+/g, ' ').slice(0, 24) : '图片提问';
      session.title = title || '新对话';
    }

    state.stats.asked += 1;
    state.stats.byChapter[session.chapterId] = (state.stats.byChapter[session.chapterId] || 0) + 1;
    state.stats.modes[state.mode] = (state.stats.modes[state.mode] || 0) + 1;
    markDay();

    state.pendingImages = [];
    input.value = '';
    autoResizeInput();
    renderPendingImages();
    persist();
    renderAll();
    scrollToBottom(true);
    await generateAssistant(session);
  }

  /* ---------- render: chrome ---------- */

  function renderStatus() {
    if (state.staticMode) {
      statusBtn.classList.add('demo');
      statusBtn.classList.remove('online');
      statusText.textContent = 'Pollinations 在线演示';
      statusBtn.title = 'GitHub Pages 在线演示：Pollinations 免费模型，匿名约 45 秒限 1 次。';
      statusBtn.setAttribute('aria-label', '模型连接状态：Pollinations 在线演示');
      return;
    }
    const configured = !isDemo();
    statusBtn.classList.toggle('online', configured);
    statusBtn.classList.toggle('demo', !configured);
    statusText.textContent = configured ? state.settings.model : '离线演示';
    statusBtn.title = configured
      ? '已配置：' + state.settings.baseUrl + ' · ' + state.settings.model
      : '尚未连接模型，点击打开设置';
  }

  function updateComposer() {
    const hasContent = input.value.trim().length > 0 || state.pendingImages.length > 0;
    sendBtn.disabled = !state.streaming && !hasContent;
    composer.classList.toggle('streaming', state.streaming);
    sendBtn.setAttribute('aria-label', state.streaming ? '停止生成' : '发送');
  }

  function updatePlaceholder() {
    const chapter = chapterOf(state.chapterId);
    input.placeholder = '关于「' + chapter.name + '」，你卡在哪一步？例如：为什么这里可以用洛必达？';
  }

  function renderModeButtons() {
    $$('.mode-btn', modeGroup).forEach((btn) => {
      const active = btn.dataset.mode === state.mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderTheme() {
    document.documentElement.dataset.theme = state.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#141713' : '#f6f2e9');
  }

  function renderWrongBadge() {
    wrongCount.textContent = String(state.wrongbook.length);
    wrongTitleCount.textContent = String(state.wrongbook.length);
  }

  /* ---------- render: sidebar ---------- */

  function renderChapters() {
    chapterList.innerHTML = CHAPTERS.map((chapter) => {
      const percent = Math.round((solvedInChapter(chapter.id) / Math.max(1, questionsOf(chapter.id).length)) * 100);
      const active = chapter.id === state.chapterId;
      return '<button class="chapter-item' + (active ? ' active' : '') + '" data-chapter="' + chapter.id + '" title="' + escapeHtml(chapter.intro) + '">' +
        '<span class="chapter-glyph">' + escapeHtml(chapter.glyph) + '</span>' +
        '<span class="chapter-meta">' +
          '<span class="chapter-name">' + escapeHtml(chapter.name) + '</span>' +
          '<span class="chapter-progress"><span style="width:' + percent + '%"></span></span>' +
        '</span>' +
      '</button>';
    }).join('');
  }

  function renderRecent() {
    const list = state.sessions.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 7);
    if (!list.length) {
      recentList.innerHTML = '<p class="recent-empty">还没有对话。选一个章节，把卡点写下来。</p>';
      return;
    }
    recentList.innerHTML = list.map((session) => {
      const chapter = chapterOf(session.chapterId);
      return '<div class="recent-item' + (session.id === state.currentId ? ' current' : '') + '">' +
        '<button class="recent-open" data-session="' + session.id + '" title="' + escapeHtml(session.title) + '">' +
          escapeHtml(session.title || '未命名对话') +
        '</button>' +
        '<button class="recent-del" data-del-session="' + session.id + '" title="删除对话" aria-label="删除对话">' +
          '<svg class="icon"><use href="#i-close"></use></svg>' +
        '</button>' +
      '</div>';
    }).join('');
  }

  /* ---------- render: welcome / messages ---------- */

  function renderWelcome() {
    const chapter = chapterOf(state.chapterId);
    welcomeChapterMeta.textContent = '第 ' + chapter.index + ' 章 · ' + chapter.name;
    const prompts = chapter.prompts || [];
    state.suggestions = [
      { tag: '第 ' + chapter.index + ' 章 · 概念', text: prompts[0] || ('帮我梳理' + chapter.name + '的核心概念。') },
      { tag: '方法辨析', text: prompts[1] || ('学习' + chapter.name + '时最容易混淆的地方是什么？') },
      { tag: '练习', text: '给我一道' + chapter.name + '的练习题，先不要给答案。' },
      { tag: '自测', text: '帮我用 3 个问题自测' + chapter.name + '，一次问一个。' }
    ];

    suggestGrid.innerHTML = state.suggestions.map((item, index) =>
      '<button class="suggest-card" data-suggest="' + index + '">' +
        '<span class="suggest-tag">' + escapeHtml(item.tag) + '</span>' +
        '<span class="suggest-text">' + escapeHtml(item.text) + '</span>' +
        '<span class="suggest-arrow"><svg class="icon"><use href="#i-arrow"></use></svg></span>' +
      '</button>'
    ).join('');

    wAsk.textContent = String(state.stats.asked);
    wSolved.textContent = String(state.stats.solved.length);
    wDays.textContent = String(calcStreak());
  }

  function messageElement(message) {
    const wrap = document.createElement('article');
    wrap.className = 'message ' + message.role;
    wrap.dataset.mid = message.id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = message.role === 'user' ? '我' : '∑';

    const main = document.createElement('div');
    main.className = 'message-main';

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    if (message.role === 'user') {
      meta.innerHTML = '<strong>你</strong><span>' + formatTime(message.ts) + '</span>';
    } else {
      const modeLabel = (MODES[message.mode] || MODES.guide).label;
      meta.innerHTML = '<strong>高数助教</strong><span>' + modeLabel + '</span><span>' + formatTime(message.ts) + '</span>';
    }
    main.appendChild(meta);

    if (message.role === 'user') {
      const bubble = document.createElement('div');
      bubble.className = 'user-bubble';
      bubble.innerHTML = renderRich(message.content || '（图片题目）');
      main.appendChild(bubble);
      if (message.images && message.images.length) {
        message.images.forEach((src) => {
          const img = document.createElement('img');
          img.className = 'msg-image';
          img.src = src;
          img.alt = '题目截图';
          img.loading = 'lazy';
          main.appendChild(img);
        });
      }
    } else if (message.error) {
      const error = document.createElement('div');
      error.className = 'error-card';
      error.innerHTML = '<strong><svg class="icon"><use href="#i-alert"></use></svg>连接模型失败</strong>' +
        '<div>' + escapeHtml(message.errorText || '未知错误') + '</div>' +
        '<div class="error-actions">' +
          '<button class="btn ghost" data-action="settings">打开设置</button>' +
          '<button class="btn ghost" data-action="retry">重试</button>' +
        '</div>';
      main.appendChild(error);
    } else {
      const body = document.createElement('div');
      body.className = 'rich';
      if (!message.content && message.streaming) {
        body.innerHTML = '<span class="thinking">正在组织思路…</span><span class="streaming-caret"></span>';
      } else {
        body.innerHTML = renderRich(message.content || '') + (message.streaming ? '<span class="streaming-caret"></span>' : '');
      }
      main.appendChild(body);

      if (!message.streaming) {
        const tools = document.createElement('div');
        tools.className = 'message-tools';
        tools.innerHTML =
          '<button class="tool-chip" data-action="copy"><svg class="icon"><use href="#i-copy"></use></svg>复制</button>' +
          '<button class="tool-chip" data-action="simpler"><svg class="icon"><use href="#i-light"></use></svg>再讲简单点</button>' +
          '<button class="tool-chip" data-action="hint"><svg class="icon"><use href="#i-spark"></use></svg>给我提示</button>' +
          '<button class="tool-chip" data-action="similar"><svg class="icon"><use href="#i-refresh"></use></svg>同类题</button>' +
          '<button class="tool-chip" data-action="save"><svg class="icon"><use href="#i-book"></use></svg>存错题本</button>';
        main.appendChild(tools);
      }
    }

    wrap.appendChild(avatar);
    wrap.appendChild(main);
    return wrap;
  }

  function renderMessages() {
    const session = currentSession();
    const hasMessages = !!(session && session.messages.length);
    welcome.hidden = hasMessages;
    messageList.innerHTML = '';
    if (!hasMessages) {
      renderWelcome();
      return;
    }
    const fragment = document.createDocumentFragment();
    session.messages.forEach((message) => fragment.appendChild(messageElement(message)));
    messageList.appendChild(fragment);
  }

  /* ---------- render: rail ---------- */

  function renderRail() {
    const chapter = chapterOf(state.chapterId);
    railChapter.innerHTML = '<span class="rail-glyph">' + escapeHtml(chapter.glyph) + '</span>' +
      '<span class="rail-chapter-text"><strong>' + escapeHtml(chapter.name) + '</strong>' +
      '<span>第 ' + chapter.index + ' 章 · ' + questionsOf(chapter.id).length + ' 道练习</span></span>';
    railIntro.textContent = chapter.intro;

    formulaList.innerHTML = chapter.formulas.map((formula, index) =>
      '<button class="formula-item" data-formula="' + index + '" title="点击复制 LaTeX">' +
        '<span class="formula-name">' + escapeHtml(formula.name) + '</span>' +
        '<span class="formula-tex">' + mathHtml(formula.tex, false) + '</span>' +
      '</button>'
    ).join('');

    const solved = state.stats.solved.length;
    const total = QUESTIONS.length;
    const progress = Math.round((solved / Math.max(1, total)) * 100);
    statsMini.innerHTML = '<div class="card-heading"><span>学习进度</span><span class="muted-note">' + solved + '/' + total + '</span></div>' +
      '<div class="mini-grid">' +
        '<div><strong>' + state.stats.asked + '</strong><span>次提问</span></div>' +
        '<div><strong>' + state.stats.practice + '</strong><span>次练习</span></div>' +
        '<div><strong>' + calcStreak() + '</strong><span>天连续</span></div>' +
      '</div>' +
      '<div class="mini-progress">' +
        '<div class="mini-progress-head"><span>题库掌握度</span><span>' + progress + '%</span></div>' +
        '<div class="progress-track"><span style="width:' + progress + '%"></span></div>' +
      '</div>';

    const daily = dailyQuestion();
    const dailyChapter = chapterOf(daily.chapter);
    dailyCard.dataset.qid = daily.id;
    dailyCard.innerHTML = '<div class="card-heading"><span>今日一题</span><span class="daily-tag">' + escapeHtml(dailyChapter.short) + '</span></div>' +
      '<div class="daily-q">' + renderRich(daily.question) + '</div>' +
      '<button class="btn ghost" id="dailyBtn">开始思考<svg class="icon"><use href="#i-arrow"></use></svg></button>';
  }

  function dailyQuestion() {
    const key = dateKey();
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const start = hash % QUESTIONS.length;
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      const question = QUESTIONS[(start + i) % QUESTIONS.length];
      if (!state.stats.solved.includes(question.id)) return question;
    }
    return QUESTIONS[start];
  }

  /* ---------- render: all ---------- */

  function renderAll() {
    renderStatus();
    renderTheme();
    renderModeButtons();
    renderChapters();
    renderRecent();
    renderMessages();
    renderRail();
    renderWrongBadge();
    renderWelcome();
    updatePlaceholder();
    updateComposer();
    if (currentSession() && currentSession().messages.length) {
      /* keep the newest content visible when switching sessions */
      requestAnimationFrame(() => {
        if (isNearBottom()) scrollToBottom(true);
      });
    }
  }

  /* ---------- drafts / images ---------- */

  function autoResizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 190) + 'px';
  }

  function renderPendingImages() {
    if (!state.pendingImages.length) {
      pendingImages.hidden = true;
      pendingImages.innerHTML = '';
      updateComposer();
      return;
    }
    pendingImages.hidden = false;
    pendingImages.innerHTML = state.pendingImages.map((src, index) =>
      '<div class="pending-thumb">' +
        '<img src="' + src + '" alt="待发送的题目截图" />' +
        '<button class="pending-remove" data-remove-image="' + index + '" aria-label="移除图片">' +
          '<svg class="icon"><use href="#i-close"></use></svg>' +
        '</button>' +
      '</div>'
    ).join('');
    updateComposer();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('图片解析失败'));
        image.onload = () => {
          const maxSide = 760;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- OCR (static / GitHub Pages mode) ---------- */

  function loadOcrScript() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
        return;
      }
      const src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      const existing = document.querySelector('script[data-ocr-src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === '1') {
          resolve(window.Tesseract);
          return;
        }
        existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
        existing.addEventListener('error', () => reject(new Error('OCR 脚本加载失败')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.dataset.ocrSrc = src;
      script.onload = () => {
        script.dataset.loaded = '1';
        resolve(window.Tesseract);
      };
      script.onerror = () => reject(new Error('OCR 脚本加载失败'));
      document.head.appendChild(script);
    });
  }

  async function ocrImageDataUrl(dataUrl) {
    const Tesseract = await loadOcrScript();
    if (!Tesseract) throw new Error('OCR 引擎没有加载成功');
    const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js',
      langPath: new URL('ocr/', location.href).href
    });
    try {
      const result = await worker.recognize(dataUrl);
      return String((result && result.data && result.data.text) || '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } finally {
      try {
        await worker.terminate();
      } catch (err) {
        /* ignore */
      }
    }
  }

  async function recognizeStaticImage(file) {
    let dataUrl;
    try {
      dataUrl = await readImage(file);
    } catch (err) {
      toast(err.message || '图片读取失败', 'warn');
      return;
    }
    toast('正在识别图片文字…');
    try {
      const text = await ocrImageDataUrl(dataUrl);
      if (!text || text.replace(/\s/g, '').length < 2) {
        throw new Error('没有识别出清晰文字，请换一张更清楚的照片，或直接输入题目');
      }
      const current = (input && input.value ? input.value.trim() : '');
      const merged = current ? current + '\n' + text : text;
      if (input) {
        input.value = merged;
        input.focus();
        autoResizeInput();
        updateComposer();
      }
      toast('已识别为文字，请核对后再发送');
    } catch (err) {
      toast(err.message || '图片识别失败', 'warn');
    }
  }

  /* ---------- practice ---------- */

  function practicePool() {
    return state.practice.filter && state.practice.filter !== 'all'
      ? questionsOf(state.practice.filter)
      : QUESTIONS.slice();
  }

  function pickPracticeQuestion() {
    const pool = practicePool();
    if (!pool.length) return null;
    const unsolved = pool.filter((q) => !state.stats.solved.includes(q.id));
    let candidates = (unsolved.length ? unsolved : pool).filter((q) => !state.practice.question || q.id !== state.practice.question.id);
    if (!candidates.length) candidates = pool;
    return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
  }

  function renderPracticeFilter() {
    const options = ['<option value="all">全部章节</option>'].concat(
      CHAPTERS.map((chapter) => '<option value="' + chapter.id + '">' + escapeHtml(chapter.name) + '</option>')
    );
    practiceFilter.innerHTML = options.join('');
    practiceFilter.value = state.practice.filter || 'all';
  }

  function levelDots(level) {
    let dots = '';
    for (let i = 1; i <= 3; i += 1) dots += '<i class="' + (i <= level ? 'on' : '') + '"></i>';
    return '<span class="level-dots" title="难度 ' + level + '/3">' + dots + '</span>';
  }

  function renderPractice() {
    const question = state.practice.question;
    if (!question) {
      practiceBody.innerHTML = '<div class="empty-state">这个章节暂时还没有练习题。</div>';
      return;
    }
    const chapter = chapterOf(question.chapter);
    const levelText = ['', '基础', '进阶', '挑战'][question.level] || '基础';
    const hintVisible = state.practice.hint;
    const solutionVisible = state.practice.solution;

    practiceBody.innerHTML =
      '<div class="practice-topline">' +
        '<span class="pill">' + escapeHtml(chapter.name) + '</span>' +
        '<span class="pill warm">' + levelText + '</span>' +
        levelDots(question.level) +
      '</div>' +
      '<div class="practice-question rich">' + renderRich(question.question) + '</div>' +
      '<div class="reveal-actions">' +
        (hintVisible ? '' : '<button class="btn ghost" data-reveal="hint"><svg class="icon"><use href="#i-light"></use></svg>看提示</button>') +
        (solutionVisible ? '' : '<button class="btn ghost" data-reveal="solution"><svg class="icon"><use href="#i-eye"></use></svg>看完整解析</button>') +
      '</div>' +
      '<div class="reveal-block ' + (hintVisible ? '' : 'hidden') + '">' +
        '<h3><svg class="icon"><use href="#i-light"></use></svg>提示</h3>' +
        '<div class="rich">' + renderRich(question.hint) + '</div>' +
      '</div>' +
      '<div class="reveal-block ' + (solutionVisible ? '' : 'hidden') + '">' +
        '<h3><svg class="icon"><use href="#i-check"></use></svg>分步解析</h3>' +
        '<div class="rich">' + renderRich(question.solution) + '</div>' +
      '</div>' +
      '<div class="reveal-block answer ' + (solutionVisible ? '' : 'hidden') + '">' +
        '<h3>答案</h3><div class="rich">' + renderRich(question.answer) + '</div>' +
      '</div>' +
      '<div class="reveal-actions ' + (solutionVisible ? '' : 'hidden') + '">' +
        '<button class="btn primary" data-rate="solved"><svg class="icon"><use href="#i-check"></use></svg>这题我会了</button>' +
        '<button class="btn ghost" data-rate="again"><svg class="icon"><use href="#i-refresh"></use></svg>还不熟</button>' +
      '</div>';

    practiceFilter.value = state.practice.filter || 'all';
  }

  function openPractice(filterOrQuestion) {
    if (filterOrQuestion && typeof filterOrQuestion === 'object') {
      const question = filterOrQuestion;
      state.practice.filter = question.chapter;
      state.practice.question = question;
    } else {
      state.practice.filter = filterOrQuestion || state.chapterId;
      state.practice.question = pickPracticeQuestion();
    }
    state.practice.hint = false;
    state.practice.solution = false;
    renderPracticeFilter();
    renderPractice();
    openDialog(practiceDialog);
  }

  function nextPractice() {
    state.practice.question = pickPracticeQuestion();
    state.practice.hint = false;
    state.practice.solution = false;
    renderPractice();
  }

  function ratePractice(known) {
    const question = state.practice.question;
    if (!question) return;
    state.stats.practice += 1;
    markDay();
    if (known) {
      if (!state.stats.solved.includes(question.id)) state.stats.solved.push(question.id);
      toast('已记为掌握 · ' + question.title);
    } else {
      addWrong(question.question, question.chapter, '练习');
      toast('已加入错题本，稍后再来一次');
    }
    persist();
    renderAll();
    nextPractice();
  }

  function renderWrongList() {
    renderWrongBadge();
    if (!state.wrongbook.length) {
      wrongList.innerHTML = '<div class="empty-state">' +
        '<svg class="icon"><use href="#i-book"></use></svg>' +
        '<strong>错题本还是空的</strong>' +
        '<p>在对话里点「存错题本」，或在练习中标记「还不熟」，题目就会出现在这里。</p>' +
      '</div>';
      return;
    }
    wrongList.innerHTML = state.wrongbook.map((item) => {
      const chapter = chapterOf(item.chapterId);
      return '<div class="wrong-item">' +
        '<div class="wrong-item-head">' +
          '<span class="pill">' + escapeHtml(chapter.short) + '</span>' +
          '<span class="muted-note">' + escapeHtml(item.source || '对话') + '</span>' +
          '<time>' + formatDate(item.ts) + '</time>' +
          '<button class="icon-btn" data-wrong-del="' + item.id + '" title="删除" aria-label="删除错题">' +
            '<svg class="icon"><use href="#i-trash"></use></svg>' +
          '</button>' +
        '</div>' +
        '<div class="wrong-question rich">' + renderRich(item.question) + '</div>' +
        '<div class="wrong-item-foot">' +
          '<button class="btn ghost" data-wrong-ask="' + item.id + '">问 AI 老师</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function addWrong(question, chapterId, source) {
    const text = String(question || '').trim();
    if (!text) return false;
    const existing = state.wrongbook.find((item) => item.question === text);
    if (existing) {
      existing.ts = Date.now();
      persist();
      renderWrongBadge();
      toast('这道题已经在错题本里');
      return false;
    }
    state.wrongbook.unshift({
      id: uid('w'),
      question: text,
      chapterId: chapterId || state.chapterId,
      source: source || '对话',
      ts: Date.now()
    });
    persist();
    renderWrongBadge();
    toast('已加入错题本');
    return true;
  }

  /* ---------- stats ---------- */

  function renderStats() {
    const asked = state.stats.asked;
    const practice = state.stats.practice;
    const solved = state.stats.solved.length;
    const streak = calcStreak();
    const daysActive = Object.keys(state.stats.days).length;

    const bars = CHAPTERS.map((chapter) => {
      const count = questionsOf(chapter.id).length;
      const done = solvedInChapter(chapter.id);
      const percent = Math.round((done / Math.max(1, count)) * 100);
      return '<div class="chapter-bar">' +
        '<span class="bar-label">' + escapeHtml(chapter.name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + percent + '%"></span></span>' +
        '<span class="bar-value">' + done + '/' + count + '</span>' +
      '</div>';
    }).join('');

    const modeTotal = Object.values(state.stats.modes).reduce((sum, n) => sum + (Number(n) || 0), 0);
    const split = modeTotal
      ? Object.keys(MODES).map((key) => {
          const value = Number(state.stats.modes[key]) || 0;
          return value ? '<span style="width:' + ((value / modeTotal) * 100) + '%;background:' + MODE_COLORS[key] + '"></span>' : '';
        }).join('')
      : '<span style="width:100%;background:var(--line)"></span>';

    const legend = Object.keys(MODES).map((key) =>
      '<span><i style="background:' + MODE_COLORS[key] + '"></i>' + MODES[key].label + ' ' + (Number(state.stats.modes[key]) || 0) + '</span>'
    ).join('');

    const week = [];
    let weekMax = 1;
    for (let i = 6; i >= 0; i -= 1) {
      const d = shiftDate(-i);
      const value = Number(state.stats.days[dateKey(d)]) || 0;
      weekMax = Math.max(weekMax, value);
      week.push({ d: d, value: value });
    }
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekHtml = week.map((item) => {
      const height = item.value ? Math.max(6, Math.round((item.value / weekMax) * 38)) : 4;
      return '<div class="streak-day' + (item.value ? ' has' : '') + '">' +
        '<i style="height:' + height + 'px"></i><span>' + weekdays[item.d.getDay()] + '</span>' +
      '</div>';
    }).join('');

    statsBody.innerHTML =
      '<div class="stats-overview">' +
        '<div class="stat-tile"><strong>' + asked + '</strong><span>次提问</span></div>' +
        '<div class="stat-tile"><strong>' + practice + '</strong><span>次练习</span></div>' +
        '<div class="stat-tile"><strong>' + solved + '</strong><span>道已掌握</span></div>' +
        '<div class="stat-tile"><strong>' + streak + '</strong><span>天连续学习</span></div>' +
      '</div>' +
      '<h3 class="stats-section-title">章节掌握度</h3>' +
      '<div class="chapter-bars">' + bars + '</div>' +
      '<h3 class="stats-section-title">提问模式分布</h3>' +
      '<div class="mode-split">' + split + '</div>' +
      '<div class="mode-legend">' + legend + '</div>' +
      '<h3 class="stats-section-title">最近 7 天</h3>' +
      '<div class="streak-row">' + weekHtml + '</div>' +
      '<p class="fineprint">累计学习 ' + daysActive + ' 天。进度只保存在当前浏览器，清除本地数据后会重置。</p>';
  }

  /* ---------- dialogs ---------- */

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.body.classList.add('modal-open');
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }

  function openSettings() {
    if (state.staticMode) {
      toast('在线演示已固定使用 Pollinations 免费模型；完整版可下载本地运行');
      return;
    }
    if (state.publicMode) {
      toast('公共服务已固定使用 Kilo 免费模型，无需配置');
      return;
    }
    setBaseUrl.value = state.settings.baseUrl || '';
    setModel.value = state.settings.model || '';
    setApiKey.value = state.settings.apiKey || '';
    setTemp.value = String(state.settings.temperature == null ? 0.3 : state.settings.temperature);
    tempOut.textContent = Number(setTemp.value).toFixed(2);
    setMaxTokens.value = String(state.settings.maxTokens || 1800);
    setStream.checked = !!state.settings.stream;
    setVision.checked = !!state.settings.allowVision;
    testStatus.textContent = '尚未测试';
    testStatus.className = 'test-status';
    highlightPreset();
    openDialog(settingsDialog);
  }

  function highlightPreset() {
    const base = setBaseUrl.value.trim().replace(/\/+$/, '');
    $$('.preset-chip', presetRow).forEach((chip) => {
      const preset = PRESETS.find((p) => p.id === chip.dataset.preset);
      chip.classList.toggle('active', !!preset && preset.base.replace(/\/+$/, '') === base);
    });
  }

  function readSettingsForm() {
    return {
      baseUrl: setBaseUrl.value.trim(),
      model: setModel.value.trim(),
      apiKey: setApiKey.value.trim(),
      temperature: clamp(parseFloat(setTemp.value) || 0, 0, 1),
      maxTokens: clamp(parseInt(setMaxTokens.value, 10) || 1800, 128, 8192),
      stream: setStream.checked,
      allowVision: setVision.checked
    };
  }

  function saveSettings() {
    const next = readSettingsForm();
    if (next.baseUrl && !next.model) {
      toast('请填写模型名称');
      setModel.focus();
      return;
    }
    state.settings = next;
    persist();
    try {
      saveJSON(KEYS.settings, state.settings);
    } catch (err) {
      toast('设置已生效，但浏览器拒绝写入本地存储');
    }
    renderStatus();
    closeDialog(settingsDialog);
    if (!next.baseUrl) toast('已切换到离线演示模式');
    else toast('设置已保存 · ' + next.model);
  }

  async function testConnection() {
    const cfg = readSettingsForm();
    if (!cfg.baseUrl) {
      testStatus.textContent = '先填写接口地址';
      testStatus.className = 'test-status bad';
      return;
    }
    if (!cfg.model) {
      testStatus.textContent = '先填写模型名称';
      testStatus.className = 'test-status bad';
      return;
    }

    testBtn.disabled = true;
    testStatus.textContent = '正在连接…';
    testStatus.className = 'test-status';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      let output = '';
      await requestCompletion(
        [{ role: 'user', content: '请只回复四个字：连接成功' }],
        (delta) => { output += delta; },
        controller.signal,
        Object.assign({}, cfg, { stream: false, maxTokens: 24, temperature: 0 }),
        cfg.baseUrl
      );
      testStatus.textContent = '连接成功：' + (output.trim().slice(0, 60) || '服务已响应');
      testStatus.className = 'test-status ok';
    } catch (err) {
      const message = err && err.name === 'AbortError'
        ? '连接超时（20 秒）。'
        : friendlyError(err);
      testStatus.textContent = message;
      testStatus.className = 'test-status bad';
    } finally {
      clearTimeout(timeout);
      testBtn.disabled = false;
    }
  }

  /* ---------- toast / copy ---------- */

  let toastTimer = null;

  function toast(message, type) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = '<svg class="icon"><use href="' + (type === 'warn' ? '#i-alert' : '#i-check') + '"></use></svg><span>' + escapeHtml(message) + '</span>';
    toastWrap.appendChild(node);
    while (toastWrap.children.length > 3) toastWrap.firstElementChild.remove();
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 220);
    }, 2400);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      /* keep the wrapper from growing in long sessions */
      if (!toastWrap.children.length) toastWrap.innerHTML = '';
    }, 2800);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(label || '已复制');
    } catch (err) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try {
        document.execCommand('copy');
        toast(label || '已复制');
      } catch (err2) {
        toast('复制失败，请手动选择文本');
      }
      helper.remove();
    }
  }

  /* ---------- drawers / theme / sessions ---------- */

  function setSidebar(open) {
    if (open) app.classList.remove('rail-open');
    app.classList.toggle('sidebar-open', !!open);
    syncScrim();
  }

  function setRail(open) {
    if (window.innerWidth > 1240) {
      app.classList.toggle('rail-hidden', !open);
      railBtn.classList.toggle('active', !!open);
      railBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
      setLocal('gs.rail', open ? '1' : '0');
      return;
    }
    if (open && window.innerWidth <= 980) app.classList.remove('sidebar-open');
    state.railOpen = !!open;
    app.classList.toggle('rail-open', !!open);
    railBtn.classList.toggle('active', !!open);
    railBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
    syncScrim();
  }

  function syncScrim() {
    const scrimOn = app.classList.contains('sidebar-open') || app.classList.contains('rail-open');
    scrim.classList.toggle('show', scrimOn);
  }

  function closeDrawers() {
    app.classList.remove('sidebar-open', 'rail-open');
    railBtn.classList.remove('active');
    railBtn.setAttribute('aria-pressed', 'false');
    syncScrim();
    state.railOpen = false;
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    renderTheme();
    persist();
    toast(state.theme === 'dark' ? '已切换到深色主题' : '已切换到浅色主题');
  }

  function newChat() {
    if (state.streaming) stopGeneration();
    state.currentId = null;
    state.pendingImages = [];
    input.value = '';
    autoResizeInput();
    renderPendingImages();
    persist();
    renderAll();
    chatScroll.scrollTop = 0;
    closeDrawers();
    input.focus();
  }

  function openSession(id) {
    const session = state.sessions.find((s) => s.id === id);
    if (!session) return;
    if (state.streaming) stopGeneration();
    state.currentId = id;
    state.chapterId = chapterMap.has(session.chapterId) ? session.chapterId : state.chapterId;
    state.mode = MODES[session.mode] ? session.mode : state.mode;
    state.practice.filter = state.chapterId;
    persist();
    renderAll();
    closeDrawers();
    scrollToBottom(true);
  }

  function deleteSession(id) {
    const index = state.sessions.findIndex((s) => s.id === id);
    if (index < 0) return;
    state.sessions.splice(index, 1);
    if (state.currentId === id) state.currentId = null;
    persist();
    renderAll();
  }

  function clearSessions() {
    if (!state.sessions.length) {
      toast('还没有可清空的对话');
      return;
    }
    if (!window.confirm('清空全部对话记录？错题本和学习统计不会受影响。')) return;
    state.sessions = [];
    state.currentId = null;
    persist();
    renderAll();
    toast('对话记录已清空');
  }

  function selectChapter(id) {
    if (!chapterMap.has(id)) return;
    state.chapterId = id;
    const session = currentSession();
    if (session) {
      session.chapterId = id;
      session.updatedAt = Date.now();
    }
    state.practice.filter = id;
    persist();
    renderChapters();
    renderRail();
    renderWelcome();
    updatePlaceholder();
    renderPracticeFilter();
    closeDrawers();
  }

  function openStats() {
    renderStats();
    openDialog(statsDialog);
  }

  /* ---------- bindings ---------- */

  const app = $('#app');
  const statusBtn = $('#statusBtn');
  const statusText = $('#statusText');
  const chapterList = $('#chapterList');
  const recentList = $('#recentList');
  const welcome = $('#welcome');
  const welcomeChapterMeta = $('#welcomeChapterMeta');
  const wAsk = $('#wAsk');
  const wSolved = $('#wSolved');
  const wDays = $('#wDays');
  const suggestGrid = $('#suggestGrid');
  const messageList = $('#messageList');
  const chatScroll = $('#chatScroll');
  const input = $('#input');
  const composer = $('#composer');
  const sendBtn = $('#sendBtn');
  const modeGroup = $('#modeGroup');
  const formulaBtn = $('#formulaBtn');
  const formulaPop = $('#formulaPop');
  const pendingImagesEl = $('#pendingImages');
  const imageBtn = $('#imageBtn');
  const fileInput = $('#fileInput');
  const railChapter = $('#railChapter');
  const railIntro = $('#railIntro');
  const formulaList = $('#formulaList');
  const statsMini = $('#statsMini');
  const dailyCard = $('#dailyCard');
  const wrongCount = $('#wrongCount');
  const wrongTitleCount = $('#wrongTitleCount');
  const statsBody = $('#statsBody');
  const practiceBody = $('#practiceBody');
  const practiceFilter = $('#practiceFilter');
  const wrongList = $('#wrongList');
  const settingsDialog = $('#settingsDialog');
  const practiceDialog = $('#practiceDialog');
  const wrongDialog = $('#wrongDialog');
  const statsDialog = $('#statsDialog');
  const presetRow = $('#presetRow');
  const setBaseUrl = $('#setBaseUrl');
  const setModel = $('#setModel');
  const setApiKey = $('#setApiKey');
  const setTemp = $('#setTemp');
  const tempOut = $('#tempOut');
  const setMaxTokens = $('#setMaxTokens');
  const setStream = $('#setStream');
  const setVision = $('#setVision');
  const testBtn = $('#testBtn');
  const testStatus = $('#testStatus');
  const toastWrap = $('#toastWrap');
  const scrim = $('#scrim');
  const railBtn = $('#railBtn');
  const menuBtn = $('#menuBtn');
  const pendingImages = pendingImagesEl;

  function bind() {
    // theme
    document.documentElement.dataset.theme = state.theme;

    // presets
    presetRow.innerHTML = PRESETS.map((preset) =>
      '<button class="preset-chip" data-preset="' + preset.id + '" title="' + escapeHtml(preset.hint) + '">' + escapeHtml(preset.label) + '</button>'
    ).join('');

    // formula popover
    formulaPop.innerHTML = FORMULA_SNIPPETS.map((snippet, index) =>
      '<button class="formula-chip" data-snippet="' + index + '" title="' + escapeHtml(snippet.label) + '">' + escapeHtml(snippet.label) + '</button>'
    ).join('');

    renderPracticeFilter();

    // top bar
    $('#brandBtn').addEventListener('click', (event) => {
      event.preventDefault();
      newChat();
    });
    $('#newChatBtn').addEventListener('click', newChat);
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#settingsBtn').addEventListener('click', openSettings);
    statusBtn.addEventListener('click', openSettings);
    menuBtn.addEventListener('click', () => setSidebar(!app.classList.contains('sidebar-open')));
    railBtn.addEventListener('click', () => {
      const currentlyOpen = window.innerWidth > 1240
        ? !app.classList.contains('rail-hidden')
        : app.classList.contains('rail-open');
      setRail(!currentlyOpen);
    });
    $('#practiceBtn').addEventListener('click', () => openPractice(state.chapterId));
    $('#changeChapterBtn').addEventListener('click', () => {
      if (window.innerWidth <= 980) setSidebar(true);
      else {
        const active = $('.chapter-item.active', chapterList);
        if (active) active.focus();
      }
    });
    scrim.addEventListener('click', closeDrawers);

    // sidebar
    chapterList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chapter]');
      if (!button) return;
      selectChapter(button.dataset.chapter);
    });
    recentList.addEventListener('click', (event) => {
      const del = event.target.closest('[data-del-session]');
      if (del) {
        deleteSession(del.dataset.delSession);
        return;
      }
      const open = event.target.closest('[data-session]');
      if (open) openSession(open.dataset.session);
    });
    $('#clearSessionsBtn').addEventListener('click', clearSessions);

    // welcome suggestions
    suggestGrid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-suggest]');
      if (!card) return;
      const item = state.suggestions[Number(card.dataset.suggest)];
      if (item) sendMessage(item.text);
    });

    // messages
    messageList.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if (!action) return;
      const messageNode = action.closest('[data-mid]');
      const message = messageNode ? findMessage(messageNode.dataset.mid) : null;
      const session = currentSession();
      if (!session) return;

      switch (action.dataset.action) {
        case 'copy':
          if (message) copyText(message.content, '回答已复制');
          break;
        case 'simpler':
          sendMessage('请把上一条回答讲得更基础一些，少用术语，并补一个具体例子。');
          break;
        case 'hint':
          sendMessage('先不要给出完整答案，只给我一个循序渐进的提示，帮我往下想一步。');
          break;
        case 'similar':
          sendMessage('请出一道同类型、同难度的练习题，先不要给答案。');
          break;
        case 'save': {
          const index = session.messages.findIndex((m) => m.id === (message ? message.id : ''));
          let question = null;
          for (let i = index; i >= 0; i -= 1) {
            if (session.messages[i].role === 'user') {
              question = session.messages[i];
              break;
            }
          }
          if (question) addWrong(question.content || '图片题目', session.chapterId, '对话');
          else toast('没有找到对应的题目');
          break;
        }
        case 'settings':
          openSettings();
          break;
        case 'retry':
          if (message && message.error) {
            session.messages = session.messages.filter((m) => m.id !== message.id);
            persist();
            renderAll();
            generateAssistant(session);
          }
          break;
        default:
          break;
      }
    });

    // composer
    input.addEventListener('input', () => {
      autoResizeInput();
      updateComposer();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (state.streaming) return;
        sendMessage(input.value);
      }
    });
    modeGroup.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mode]');
      if (!button || !MODES[button.dataset.mode]) return;
      state.mode = button.dataset.mode;
      const session = currentSession();
      if (session) {
        session.mode = state.mode;
        session.updatedAt = Date.now();
      }
      persist();
      renderModeButtons();
      toast('回答模式：' + MODES[state.mode].label);
    });
    sendBtn.addEventListener('click', () => {
      if (state.streaming) {
        stopGeneration();
        return;
      }
      sendMessage(input.value);
    });
    formulaBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      formulaPop.hidden = !formulaPop.hidden;
      formulaBtn.classList.toggle('active', !formulaPop.hidden);
    });
    formulaPop.addEventListener('click', (event) => {
      const button = event.target.closest('[data-snippet]');
      if (!button) return;
      const snippet = FORMULA_SNIPPETS[Number(button.dataset.snippet)];
      if (!snippet) return;
      insertAtCursor(snippet.insert, snippet.offset);
      formulaPop.hidden = true;
      formulaBtn.classList.remove('active');
    });
    document.addEventListener('click', (event) => {
      if (!formulaPop.hidden && !formulaPop.contains(event.target) && !formulaBtn.contains(event.target)) {
        formulaPop.hidden = true;
        formulaBtn.classList.remove('active');
      }
    });
    imageBtn.addEventListener('click', () => {
      if (state.staticMode) {
        fileInput.click();
        return;
      }
      if (!state.settings.allowVision) {
        toast('设置里关闭了图片发送，打开后再试');
        openSettings();
        return;
      }
      fileInput.click();
    });
    fileInput.addEventListener('change', async () => {
      const files = Array.from(fileInput.files || []).slice(0, 2 - state.pendingImages.length);
      fileInput.value = '';
      for (const file of files) {
        if (!/^image\//.test(file.type)) {
          toast('请选择图片文件');
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast('图片超过 8MB，请压缩后再试');
          continue;
        }
        if (state.staticMode) {
          await recognizeStaticImage(file);
          continue;
        }
        try {
          const dataUrl = await readImage(file);
          if (state.pendingImages.length >= 2) {
            toast('一次最多发送 2 张图片');
            break;
          }
          state.pendingImages.push(dataUrl);
        } catch (err) {
          toast(err.message || '图片读取失败');
        }
      }
      renderPendingImages();
    });
    pendingImagesEl.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-image]');
      if (!remove) return;
      state.pendingImages.splice(Number(remove.dataset.removeImage), 1);
      renderPendingImages();
    });

    // settings
    presetRow.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-preset]');
      if (!chip) return;
      const preset = PRESETS.find((p) => p.id === chip.dataset.preset);
      if (!preset) return;
      setBaseUrl.value = preset.base;
      setModel.value = preset.model;
      if (preset.id !== 'proxy' && preset.id !== 'vllm' && preset.id !== 'ollama') setApiKey.value = '';
      highlightPreset();
    });
    setBaseUrl.addEventListener('input', highlightPreset);
    setTemp.addEventListener('input', () => {
      tempOut.textContent = Number(setTemp.value).toFixed(2);
    });
    $('#saveSettingsBtn').addEventListener('click', saveSettings);
    testBtn.addEventListener('click', testConnection);
    $('#resetDataBtn').addEventListener('click', () => {
      if (!window.confirm('清除全部本地数据？对话、错题本、统计和模型设置都会被删除。')) return;
      Object.keys(localStorage).filter((key) => key.indexOf('gs.') === 0).forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    });

    // dialogs
    $$('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) closeDialog(dialog);
      });
    });
    [settingsDialog, practiceDialog, wrongDialog, statsDialog].forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
      dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
    });

    // practice
    practiceFilter.addEventListener('change', () => {
      state.practice.filter = practiceFilter.value;
      state.practice.question = pickPracticeQuestion();
      state.practice.hint = false;
      state.practice.solution = false;
      renderPractice();
    });
    $('#practiceNextBtn').addEventListener('click', nextPractice);
    $('#practiceWrongBtn').addEventListener('click', () => {
      const q = state.practice.question;
      if (!q) return;
      const added = addWrong(q.question, q.chapter, '练习');
      const button = $('#practiceWrongBtn');
      button.textContent = added ? '已加入错题本 ✓' : '已在错题本中';
      setTimeout(() => {
        button.textContent = '加入错题本';
      }, 1600);
    });
    $('#practiceAskBtn').addEventListener('click', () => {
      const q = state.practice.question;
      if (!q) return;
      closeDialog(practiceDialog);
      state.chapterId = q.chapter;
      persist();
      sendMessage(q.question, { bankId: q.id });
    });
    practiceBody.addEventListener('click', (event) => {
      const reveal = event.target.closest('[data-reveal]');
      if (reveal) {
        if (reveal.dataset.reveal === 'hint') state.practice.hint = true;
        if (reveal.dataset.reveal === 'solution') {
          state.practice.solution = true;
          state.practice.hint = true;
        }
        renderPractice();
        return;
      }
      const rate = event.target.closest('[data-rate]');
      if (rate) ratePractice(rate.dataset.rate === 'solved');
    });

    // daily
    dailyCard.addEventListener('click', (event) => {
      const button = event.target.closest('#dailyBtn');
      if (!button) return;
      const question = questionMap.get(dailyCard.dataset.qid) || dailyQuestion();
      openPractice(question);
    });

    // formulas
    formulaList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-formula]');
      if (!item) return;
      const chapter = chapterOf(state.chapterId);
      const formula = chapter.formulas[Number(item.dataset.formula)];
      if (formula) copyText(formula.tex, '公式已复制');
    });

    // stats
    statsMini.addEventListener('click', openStats);
    statsMini.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStats();
      }
    });
    $('#statsBtn').addEventListener('click', openStats);
    $('#wrongBtn').addEventListener('click', () => {
      renderWrongList();
      openDialog(wrongDialog);
    });
    $('#clearWrongBtn').addEventListener('click', () => {
      if (!state.wrongbook.length) {
        toast('错题本已经是空的');
        return;
      }
      if (!window.confirm('清空错题本？此操作不可撤销。')) return;
      state.wrongbook = [];
      persist();
      renderWrongList();
      renderWrongBadge();
      toast('错题本已清空');
    });
    wrongList.addEventListener('click', (event) => {
      const del = event.target.closest('[data-wrong-del]');
      if (del) {
        state.wrongbook = state.wrongbook.filter((item) => item.id !== del.dataset.wrongDel);
        persist();
        renderWrongList();
        renderWrongBadge();
        return;
      }
      const ask = event.target.closest('[data-wrong-ask]');
      if (ask) {
        const item = state.wrongbook.find((w) => w.id === ask.dataset.wrongAsk);
        if (!item) return;
        closeDialog(wrongDialog);
        state.chapterId = item.chapterId;
        const bank = QUESTIONS.find((q) => q.question === item.question);
        persist();
        sendMessage(item.question, bank ? { bankId: bank.id } : undefined);
      }
    });

    // keyboard
    document.addEventListener('keydown', (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        newChat();
      } else if (mod && event.key === ',') {
        event.preventDefault();
        openSettings();
      } else if (event.key === 'Escape') {
        if (!formulaPop.hidden) {
          formulaPop.hidden = true;
          formulaBtn.classList.remove('active');
        }
        closeDrawers();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1240) {
        app.classList.remove('rail-open');
        syncScrim();
      } else {
        app.classList.remove('rail-open');
        railBtn.classList.remove('active');
        railBtn.setAttribute('aria-pressed', 'false');
      }
      if (window.innerWidth > 980) app.classList.remove('sidebar-open');
      syncScrim();
    });

    // initial rail state (desktop)
    if (window.innerWidth > 1240) {
      const savedRail = getLocal('gs.rail');
      const visible = savedRail !== '0';
      app.classList.toggle('rail-hidden', !visible);
      railBtn.classList.toggle('active', visible);
      railBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    }
  }

  function insertAtCursor(text, offset) {
    const start = input.selectionStart == null ? input.value.length : input.selectionStart;
    const end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = before + text + after;
    const position = start + (offset == null ? text.length : offset);
    input.focus();
    input.setSelectionRange(position, position);
    autoResizeInput();
    updateComposer();
  }

  async function detectFreeBackend() {
    if (hasSavedSettings || !/^https?:$/.test(location.protocol)) return false;
    if (location.hostname.endsWith('.github.io')) {
      state.staticMode = true;
      state.settings.baseUrl = 'https://text.pollinations.ai/openai';
      state.settings.model = 'openai';
      state.settings.stream = true;
      state.settings.allowVision = false;
      persist();
      renderStatus();
      renderAll();
      const settingsButton = document.querySelector('#settingsBtn');
      if (settingsButton) settingsButton.style.display = 'none';
      // Images are still supported: static mode OCRs them locally into text.
      const imageButton = document.querySelector('#imageBtn');
      if (imageButton) imageButton.title = '上传题目图片，浏览器内 OCR 识别为文字（识别结果可编辑）';
      toast('在线演示：Pollinations 免费模型（约 45 秒限 1 次）');
      return true;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const response = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!response.ok) return false;
      const data = await response.json();
      if (!data.ok || !data.model) return false;
      state.publicMode = !!data.publicMode;
      if (state.publicMode) {
        const settingsButton = document.querySelector('#settingsBtn');
        if (settingsButton) settingsButton.style.display = 'none';
        state.settings.allowVision = false;
        const publicImageButton = document.querySelector('#imageBtn');
        if (publicImageButton) publicImageButton.style.display = 'none';
      }
      const model = data.model;
      state.settings.baseUrl = '/api';
      state.settings.model = model;
      state.settings.stream = true;
      persist();
      renderStatus();
      renderAll();
      toast('已连接免费模型 · ' + model);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---------- boot ---------- */

  bind();
  renderAll();
  renderPendingImages();
  autoResizeInput();

  // A tiny first-run hint for the demo mode.
  detectFreeBackend().finally(() => {
    if (isDemo() && !state.demoNoticeShown) {
      state.demoNoticeShown = true;
      setTimeout(() => {
        toast('当前为离线演示，点击右上角设置接入模型');
      }, 1200);
    }
  });

  // expose a few functions for console debugging
  window.GaoShu = {
    state: state,
    newChat: newChat,
    sendMessage: sendMessage,
    openSettings: openSettings,
    renderAll: renderAll
  };
})();
