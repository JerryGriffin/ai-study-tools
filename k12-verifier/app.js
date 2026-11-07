/* ===========================================================
   作业校验台 · K12 Homework Lab
   Verification-first homework workspace.
   =========================================================== */
(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const KEYS = {
    settings: 'hw.settings',
    history: 'hw.history',
    theme: 'hw.theme',
    grade: 'hw.grade',
    subject: 'hw.subject'
  };

  const PRESETS = [
    { id: 'demo', label: '本地示例', base: '', model: '', hint: '不调用模型，体验内置题库' },
    { id: 'kilo', label: '在线服务', base: 'https://api.kilo.ai/api/gateway', model: 'kilo-auto/free', hint: '免 Key，推荐' },
    { id: 'opencode', label: '本机服务', base: 'opencode', model: 'opencode/deepseek-v4.1-flash-free', hint: '使用本机服务' },
    { id: 'pollinations', label: '在线服务（限速）', base: 'https://text.pollinations.ai/openai', model: 'openai', hint: '免 Key，约 45 秒限 1 次' },
    { id: 'vllm', label: '本地服务', base: 'http://127.0.0.1:8000/v1', model: 'qwen2.5-math-7b-instruct', hint: '数学专用模型' },
    { id: 'omni', label: '本地服务', base: 'http://127.0.0.1:8000/v1', model: 'omniedu-9b', hint: '本地服务' },
    { id: 'deepseek', label: '自定义接口', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', hint: '需要 API Key' },
    { id: 'openai', label: '自定义接口', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', hint: '需要 API Key' },
    { id: 'ollama', label: '本地服务', base: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b', hint: '本地运行' }
  ];

  const ANSWER_TYPES = {
    number: '数值',
    expression: '表达式',
    equation: '方程解',
    interval: '区间/不等式',
    set: '集合',
    choice: '选择题',
    text: '文字',
    proof: '证明',
    tuple: '多值'
  };

  const STATUS_CLASS = {
    verified: 'verified',
    consensus: 'consensus',
    checked: 'checked',
    demo: 'demo',
    unverified: 'unverified',
    disputed: 'disputed'
  };

  const STATUS_LABEL = {
    verified: '独立验证通过',
    consensus: '多解一致',
    checked: '本地校验通过',
    demo: '本地示例',
    unverified: '未做完整验证',
    disputed: '存在分歧，建议核对'
  };

  /* ---------- storage ---------- */

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
      /* storage may be disabled */
    }
  }

  function loadJSON(key, fallback) {
    const raw = getLocal(key);
    if (!raw) return fallback;
    try {
      const value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    setLocal(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatTime(ts) {
    const date = new Date(ts || Date.now());
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    if (sameDay) return '今天 ' + hh + ':' + mm;
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
  }

  /* ---------- markdown + KaTeX ---------- */

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
        /* fall through */
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
      const line = lines[i].trim();

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
      stash('<pre><code>' + escapeHtml(code) + '</code></pre>'));

    source = source.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => stash(mathHtml(tex, true)));
    source = source.replace(/\\\[([\s\S]+?)\\\]/g, (match, tex) => stash(mathHtml(tex, true)));
    source = source.replace(/\\\(([\s\S]+?)\\\)/g, (match, tex) => stash(mathHtml(tex, false)));
    source = source.replace(/(^|[^\\$])\$([^\n$]+?)\$(?!\$)/g, (match, pre, tex) => pre + stash(mathHtml(tex, false)));

    source = escapeHtml(source);
    let html = renderBlocks(source);
    html = html.replace(/\u0001(\d+)\u0001/g, (match, index) => tokens[Number(index)] || '');
    return html;
  }

  function ensureMath(value) {
    const text = String(value == null ? '' : value).trim();
    if (text.includes('$')) return text;
    if (/\\[a-zA-Z]+|[_^]\{/.test(text)) return '$' + text + '$';
    return text;
  }

  /* ---------- state ---------- */

  const savedSettings = loadJSON(KEYS.settings, null);
  const state = {
    grade: getLocal(KEYS.grade) === '高中' ? '高中' : '初中',
    subject: ['数学', '物理', '化学'].includes(getLocal(KEYS.subject)) ? getLocal(KEYS.subject) : '数学',
    theme: getLocal(KEYS.theme) === 'dark' ? 'dark' : 'light',
    settings: Object.assign(
      { baseUrl: '', model: '', apiKey: '', samples: 3, critic: true },
      savedSettings && typeof savedSettings === 'object' ? savedSettings : {}
    ),
    serverConfig: null,
    configReady: false,
    publicMode: false,
    staticMode: false,
    staticDemo: null,
    pyodidePromise: null,
    demoQuestions: [],
    history: loadJSON(KEYS.history, []),
    pendingImage: null,
    streaming: false,
    abort: null,
    result: null,
    stages: new Map(),
    lastQuestion: '',
    timer: null,
    startedAt: 0,
    requestError: null
  };

  if (!Array.isArray(state.history)) state.history = [];
  state.history = state.history.filter((item) => item && item.result && item.question).slice(0, 20);

  /* ---------- element refs ---------- */

  const app = $('body');
  const statusBtn = $('#statusBtn');
  const statusText = $('#statusText');
  const gradeGroup = $('#gradeGroup');
  const subjectGroup = $('#subjectGroup');
  const scopeHint = $('#scopeHint');
  const questionInput = $('#questionInput');
  const solveBtn = $('#solveBtn');
  const solveLabel = $('.solve-label', solveBtn);
  const sampleChips = $('#sampleChips');
  const historyList = $('#historyList');
  const emptyReport = $('#emptyReport');
  const progressCard = $('#progressCard');
  const progressTime = $('#progressTime');
  const progressBar = $('#progressBar');
  const stageList = $('#stageList');
  const candidateStrip = $('#candidateStrip');
  const report = $('#report');
  const statusBadge = $('#statusBadge');
  const statusBadgeText = $('#statusBadgeText');
  const reportMeta = $('#reportMeta');
  const confidenceValue = $('#confidenceValue');
  const confidenceWord = $('#confidenceWord');
  const confidenceBar = $('#confidenceBar');
  const finalAnswer = $('#finalAnswer');
  const answerTypeLabel = $('#answerTypeLabel');
  const answerNote = $('#answerNote');
  const checkCount = $('#checkCount');
  const checkList = $('#checkList');
  const verificationNote = $('#verificationNote');
  const candidatesCard = $('#candidatesCard');
  const candidateList = $('#candidateList');
  const agreementText = $('#agreementText');
  const studentAnswer = $('#studentAnswer');
  const checkAnswerBtn = $('#checkAnswerBtn');
  const studentResult = $('#studentResult');
  const stepsList = $('#stepsList');
  const knowledgeList = $('#knowledgeList');
  const mistakeList = $('#mistakeList');
  const errorCard = $('#errorCard');
  const errorText = $('#errorText');
  const fileInput = $('#fileInput');
  const pendingImages = $('#pendingImages');
  const settingsDialog = $('#settingsDialog');
  const presetRow = $('#presetRow');
  const setBaseUrl = $('#setBaseUrl');
  const setModel = $('#setModel');
  const setApiKey = $('#setApiKey');
  const setSamples = $('#setSamples');
  const setCritic = $('#setCritic');
  const testBtn = $('#testBtn');
  const testStatus = $('#testStatus');
  const toastWrap = $('#toastWrap');

  /* ---------- status / theme ---------- */

  function isConfigured() {
    return !!(state.settings.baseUrl && state.settings.model);
  }

  function renderStatus() {
    if (state.staticMode) {
      statusBtn.classList.add('demo');
      statusBtn.classList.remove('online');
      statusText.textContent = '在线';
      statusBtn.title = '在线';
      statusBtn.setAttribute('aria-label', '模型连接状态：在线');
      return;
    }
    const configured = isConfigured();
    statusBtn.classList.toggle('online', configured);
    statusBtn.classList.toggle('demo', !configured);
    if (configured) {
      statusText.textContent = '在线';
      statusBtn.title = '已连接';
      statusBtn.setAttribute('aria-label', '模型连接状态：在线');
    } else if (state.serverConfig) {
      statusText.textContent = '示例';
      statusBtn.title = '本地示例';
      statusBtn.setAttribute('aria-label', '模型连接状态：示例');
    } else {
      statusText.textContent = '离线';
      statusBtn.title = '打开设置';
      statusBtn.setAttribute('aria-label', '模型连接状态：离线');
    }
  }

  function renderTheme() {
    document.documentElement.dataset.theme = state.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#0b1220' : '#f3f6fb');
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    renderTheme();
    setLocal(KEYS.theme, state.theme);
  }

  /* ---------- scope ---------- */

  function renderScope() {
    $$('.segment', gradeGroup).forEach((button) => {
      button.classList.toggle('active', button.dataset.grade === state.grade);
      button.setAttribute('aria-pressed', button.dataset.grade === state.grade ? 'true' : 'false');
    });
    $$('.segment', subjectGroup).forEach((button) => {
      button.classList.toggle('active', button.dataset.subject === state.subject);
      button.setAttribute('aria-pressed', button.dataset.subject === state.subject ? 'true' : 'false');
    });
    if (state.subject === '数学') scopeHint.textContent = '数学支持符号级校验';
    else if (state.subject === '物理') scopeHint.textContent = '物理：数值 + 多解一致';
    else scopeHint.textContent = '化学：多解一致 + 复核';
    setLocal(KEYS.grade, state.grade);
    setLocal(KEYS.subject, state.subject);
  }

  /* ---------- server config / samples ---------- */

  async function loadConfig() {
    try {
      const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const config = await response.json();
      state.serverConfig = config;
      state.publicMode = !!config.publicMode;
      if (state.publicMode) {
        const settingsButton = document.querySelector('#settingsBtn');
        if (settingsButton) settingsButton.style.display = 'none';
        const publicImageButton = document.querySelector('#imageBtn');
        if (publicImageButton) publicImageButton.style.display = 'none';
      }
      state.demoQuestions = Array.isArray(config.demoQuestions) ? config.demoQuestions : [];
      if (!savedSettings) {
        state.settings.baseUrl = config.baseUrl || '';
        state.settings.model = config.model || '';
        state.settings.samples = config.samples || 3;
        state.settings.critic = config.critic !== false;
      }
    } catch (err) {
      state.serverConfig = null;
      state.staticMode = true;
      try {
        const response = await fetch('static-demo.json', { headers: { Accept: 'application/json' } });
        if (response.ok) {
          const demo = await response.json();
          state.staticDemo = demo;
          state.demoQuestions = Array.isArray(demo.demoQuestions) ? demo.demoQuestions : [];
          state.settings = {
            baseUrl: 'https://text.pollinations.ai/openai',
            model: 'openai',
            apiKey: '',
            samples: 1,
            critic: false,
            allowVision: false
          };
        } else {
          state.demoQuestions = [];
        }
      } catch (demoError) {
        state.demoQuestions = [];
      }
      const settingsButton = document.querySelector('#settingsBtn');
      if (settingsButton) settingsButton.style.display = 'none';
      // Static mode still supports images: they are OCR'd in the browser and
      // turned into editable text before the free model is called.
      const imageButton = document.querySelector('#imageBtn');
      if (imageButton) imageButton.title = '上传题目图片，浏览器内 OCR 识别为文字（识别结果可编辑）';
    }
    state.configReady = true;
    renderStatus();
    renderSamples();
    populateSettingsForm();
  }

  function renderSamples() {
    if (!state.demoQuestions.length) {
      sampleChips.innerHTML = '<span class="history-empty" style="padding:8px 12px">后端未启动或暂无示例题，请先运行 python server.py</span>';
      return;
    }
    sampleChips.innerHTML = state.demoQuestions.slice(0, 6).map((item, index) =>
      '<button class="sample-chip" data-sample="' + index + '" title="' + escapeHtml(item.question) + '">' +
        '<span class="sample-grade">' + escapeHtml(item.grade || '') + '</span>' +
        '<span>' + escapeHtml(item.title || item.question) + '</span>' +
      '</button>'
    ).join('');
  }

  /* ---------- history ---------- */

  function renderHistory() {
    if (!state.history.length) {
      historyList.innerHTML = '<div class="history-empty">还没有记录。解一道题，建立你的可验证学习档案。</div>';
      return;
    }
    historyList.innerHTML = state.history.map((item) => {
      const result = item.result;
      const dotClass = result.demo && result.status === 'checked' ? 'demo' : (STATUS_CLASS[result.status] || 'unverified');
      return '<button class="history-item" data-history="' + item.id + '">' +
        '<span class="history-status ' + dotClass + '"></span>' +
        '<span class="history-main">' +
          '<strong>' + escapeHtml(displayQuestion(item.question).slice(0, 48)) + '</strong>' +
          '<span>' + escapeHtml(item.grade + ' · ' + item.subject + ' · ' + formatTime(item.ts)) + '</span>' +
        '</span>' +
        '<span class="history-answer">' + escapeHtml(stripMath(item.result.finalAnswer || '')) + '</span>' +
      '</button>';
    }).join('');
  }

  function stripMath(value) {
    let text = String(value || '');
    text = text.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
    text = text.replace(/\\frac\s*(\S)\s*(\S)/g, '$1/$2');
    text = text.replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)');
    text = text.replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\div/g, '÷');
    text = text.replace(/\\int/g, '∫').replace(/\\pi/g, 'π').replace(/\\infty/g, '∞');
    text = text.replace(/\\circ/g, '°');
    text = text.replace(/\\text\s*\{([^{}]*)\}/g, '$1').replace(/\\mathrm\s*\{([^{}]*)\}/g, '$1');
    text = text.replace(/\^°/g, '°');
    text = text.replace(/\\[a-zA-Z]+/g, '').replace(/[${}]/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  function displayQuestion(value) {
    return stripMath(value).replace(/\\,/g, ' ');
  }

  function saveHistory(result) {
    const item = {
      id: uid('h'),
      ts: Date.now(),
      question: result.question,
      grade: result.grade,
      subject: result.subject,
      result
    };
    state.history = [item, ...state.history.filter((entry) => entry.question !== item.question)].slice(0, 20);
    saveJSON(KEYS.history, state.history);
    renderHistory();
  }

  function clearHistory() {
    if (!state.history.length) {
      toast('还没有历史记录');
      return;
    }
    if (!window.confirm('清空全部最近记录？')) return;
    state.history = [];
    saveJSON(KEYS.history, []);
    renderHistory();
    toast('历史记录已清空');
  }

  /* ---------- images ---------- */

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('图片解析失败'));
        image.onload = () => {
          const maxSide = 1000;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.74));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPendingImage() {
    if (!state.pendingImage) {
      pendingImages.hidden = true;
      pendingImages.innerHTML = '';
      return;
    }
    pendingImages.hidden = false;
    pendingImages.innerHTML =
      '<div class="pending-thumb">' +
        '<img src="' + state.pendingImage + '" alt="待发送的题目截图" />' +
        '<button class="pending-remove" data-remove-image aria-label="移除图片"><svg class="icon"><use href="#i-close"></use></svg></button>' +
      '</div>';
  }

  /* ---------- OCR (static / GitHub Pages mode) ---------- */

  function loadScriptOnce(src, globalName) {
    return new Promise((resolve, reject) => {
      if (globalName && window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      const existing = document.querySelector('script[data-ocr-src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === '1') {
          resolve(globalName ? window[globalName] : undefined);
          return;
        }
        existing.addEventListener('load', () => resolve(globalName ? window[globalName] : undefined), { once: true });
        existing.addEventListener('error', () => reject(new Error('OCR 脚本加载失败')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.dataset.ocrSrc = src;
      script.onload = () => {
        script.dataset.loaded = '1';
        resolve(globalName ? window[globalName] : undefined);
      };
      script.onerror = () => reject(new Error('OCR 脚本加载失败：' + src));
      document.head.appendChild(script);
    });
  }

  async function ocrImageDataUrl(dataUrl) {
    addStage({ id: 'ocr', label: '识别题目图片', detail: '首次使用需要下载中文 OCR 模型', progress: 6 });
    const Tesseract = await loadScriptOnce(
      'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
      'Tesseract'
    );
    if (!Tesseract) throw new Error('OCR 引擎没有加载成功');
    let lastProgress = 0;
    const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js',
      langPath: new URL('ocr/', location.href).href,
      logger: (message) => {
        if (!message || message.status !== 'recognizing text') return;
        const progress = 6 + Math.round((message.progress || 0) * 8);
        if (progress > lastProgress) {
          lastProgress = progress;
          addStage({ id: 'ocr', label: '识别题目图片', detail: '正在识别文字 ' + Math.round((message.progress || 0) * 100) + '%', progress });
        }
      }
    });
    try {
      const result = await worker.recognize(dataUrl);
      const text = String((result && result.data && result.data.text) || '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return text;
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
      toast(err.message || '图片读取失败');
      return;
    }
    if (!dataUrl) return;
    startProgress('识别图片中的题目');
    try {
      const text = await ocrImageDataUrl(dataUrl);
      if (!text || text.replace(/\s/g, '').length < 2) {
        throw new Error('没有识别出清晰文字，请换一张更清楚的照片，或直接输入题目');
      }
      questionInput.value = text;
      autoResize();
      state.pendingImage = null;
      renderPendingImage();
      finishProgress();
      toast('已识别为文字，请先核对再点击“开始校验”');
      questionInput.focus();
    } catch (err) {
      finishProgress();
      toast(err.message || '图片识别失败');
    }
  }

  /* ---------- progress ---------- */

  function stageIcon(status) {
    if (status === 'done') return '<svg class="icon"><use href="#i-check"></use></svg>';
    if (status === 'error') return '<svg class="icon"><use href="#i-alert"></use></svg>';
    return '';
  }

  function startProgress(question) {
    state.stages = new Map();
    stageList.innerHTML = '';
    candidateStrip.innerHTML = '';
    progressBar.style.width = '4%';
    progressTime.textContent = '0s';
    errorCard.hidden = true;
    report.hidden = true;
    emptyReport.hidden = true;
    progressCard.hidden = false;
    state.result = null;
    state.requestError = null;

    const first = document.createElement('div');
    first.className = 'stage active';
    first.dataset.stage = 'start';
    first.innerHTML = '<span class="stage-icon"></span><div class="stage-text"><strong>正在提交题目</strong><span>' + escapeHtml(question.slice(0, 72)) + '</span></div>';
    stageList.appendChild(first);
    state.stages.set('start', first);

    state.startedAt = Date.now();
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      progressTime.textContent = Math.max(0, Math.round((Date.now() - state.startedAt) / 1000)) + 's';
    }, 500);
  }

  function markStage(id, options) {
    const element = state.stages.get(id);
    if (!element) return null;
    element.classList.remove('active', 'done', 'error');
    element.classList.add(options.status || 'done');
    const icon = $('.stage-icon', element);
    if (icon) icon.innerHTML = stageIcon(options.status || 'done');
    return element;
  }

  function addStage(data) {
    if (!data || !data.id) return;
    // Mark the previous active stage as done when a new stage arrives.
    $$('.stage.active', stageList).forEach((element) => {
      if (element.dataset.stage !== data.id) {
        markStage(element.dataset.stage, { status: 'done' });
      }
    });

    let element = state.stages.get(data.id);
    if (!element) {
      element = document.createElement('div');
      element.dataset.stage = data.id;
      stageList.appendChild(element);
      state.stages.set(data.id, element);
    }
    const isError = /error|fail/i.test(data.id) || /未成功|失败/.test(data.label || '');
    element.className = 'stage ' + (isError ? 'error' : 'active');
    element.innerHTML =
      '<span class="stage-icon">' + (isError ? stageIcon('error') : '') + '</span>' +
      '<div class="stage-text"><strong>' + escapeHtml(data.label || '') + '</strong>' +
      '<span>' + escapeHtml(data.detail || '') + '</span></div>';
    if (typeof data.progress === 'number') {
      progressBar.style.width = clamp(data.progress, 0, 97) + '%';
    }
  }

  function addCandidate(data) {
    if (!data) return;
    const pill = document.createElement('span');
    pill.className = 'candidate-pill';
    pill.textContent = '第 ' + (Number(data.index) + 1) + ' 路：' + stripMath(data.answer || '');
    pill.title = String(data.answer || '');
    candidateStrip.appendChild(pill);
  }

  function finishProgress() {
    $$('.stage.active', stageList).forEach((element) => markStage(element.dataset.stage, { status: 'done' }));
    progressBar.style.width = '100%';
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    progressCard.hidden = true;
  }

  /* ---------- report ---------- */

  function statusInfo(result) {
    if (result.demo) {
      if (result.status === 'checked') {
        return { className: 'checked', label: '示例题 · 本地校验通过', note: '本地题库' };
      }
      if (result.status === 'disputed') {
        return { className: 'disputed', label: '示例题 · 校验失败', note: '本地题库' };
      }
      return { className: 'demo', label: '示例题 · 仅提供解析', note: '本地题库' };
    }
    return {
      className: STATUS_CLASS[result.status] || 'unverified',
      label: result.statusText || STATUS_LABEL[result.status] || '待核对',
      note: ''
    };
  }

  function renderChecks(checks) {
    if (!Array.isArray(checks) || !checks.length) {
      checkList.innerHTML = '<li class="check-item skip"><span class="check-icon"><svg class="icon"><use href="#i-minus"></use></svg></span><span class="check-body"><strong>未执行本地符号校验</strong><span>本题类型或输入格式暂不支持确定性校验，请结合多路结果与人工判断。</span></span></li>';
      checkCount.textContent = '0 项检查';
      return;
    }
    checkCount.textContent = checks.length + ' 项检查';
    checkList.innerHTML = checks.map((check) => {
      const status = check.status === 'pass' ? 'pass' : check.status === 'fail' ? 'fail' : 'skip';
      const icon = status === 'pass' ? '#i-check' : status === 'fail' ? '#i-alert' : '#i-minus';
      return '<li class="check-item ' + status + '">' +
        '<span class="check-icon"><svg class="icon"><use href="' + icon + '"></use></svg></span>' +
        '<span class="check-body"><strong>' + escapeHtml(check.name || '校验') + '</strong>' +
        '<span>' + escapeHtml(check.detail || '') + '</span></span>' +
      '</li>';
    }).join('');
  }

  function renderCandidates(result) {
    const consensus = result.consensus || { total: 1, groups: [] };
    const groups = Array.isArray(consensus.groups) ? consensus.groups : [];
    if (result.demo || consensus.total <= 1) {
      candidatesCard.hidden = true;
      return;
    }
    candidatesCard.hidden = false;
    const chosenSize = groups.find((group) => String(group.answer) === String(result.finalAnswer))?.size || 1;
    agreementText.textContent = consensus.total + ' 路求解 · ' + chosenSize + '/' + consensus.total + ' 一致';
    candidateList.innerHTML = groups.map((group, index) =>
      '<div class="candidate-row">' +
        '<span class="candidate-index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="candidate-answer" title="' + escapeHtml(group.answer) + '">' + escapeHtml(stripMath(group.answer)) + '</span>' +
        '<span class="candidate-vote">' + group.size + '/' + consensus.total + ' 票</span>' +
      '</div>'
    ).join('');
  }

  function renderReport(result) {
    state.result = result;
    finishProgress();
    emptyReport.hidden = true;
    errorCard.hidden = true;
    progressCard.hidden = true;
    report.hidden = false;

    const info = statusInfo(result);
    statusBadge.className = 'status-badge status-' + info.className;
    statusBadgeText.textContent = info.label;
    reportMeta.textContent = [
      result.grade,
      result.subject,
      result.demo ? '本地示例' : (result.consensus?.total || 1) + ' 路求解',
      result.demo ? '' : ((result.elapsedMs || 0) / 1000).toFixed(1) + 's'
    ].filter(Boolean).join(' · ');

    const percent = Math.round(clamp(Number(result.confidence) || 0, 0, 1) * 100);
    confidenceValue.textContent = percent + '%';
    confidenceWord.textContent = result.confidenceLabel || (percent >= 90 ? '高' : percent >= 70 ? '中' : '待核对');
    confidenceBar.style.width = percent + '%';

    finalAnswer.innerHTML = renderRich(ensureMath(result.finalAnswer || '—'));
    answerTypeLabel.textContent = ANSWER_TYPES[result.answerType] || result.answerType || '—';

    const notes = [];
    if (result.assumptions && result.assumptions.length) notes.push('题目假设：' + result.assumptions.join('；'));
    if (result.demo) {
      notes.push('本地题库 · 单路解析');
    } else if (result.consensus) {
      notes.push('多路一致度：' + (result.consensus.agreement ? Math.round(result.consensus.agreement * 100) : 100) + '%');
    }
    answerNote.textContent = notes.join(' · ') || '请核对题目条件是否被完整输入。';

    renderChecks(result.checks || []);
    verificationNote.textContent = result.verificationNote || '';
    renderCandidates(result);

    const steps = Array.isArray(result.steps) && result.steps.length ? result.steps : ['暂无分步解析。'];
    stepsList.innerHTML = steps.map((step, index) =>
      '<div class="step-item">' +
        '<span class="step-num">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<div class="step-body rich">' + renderRich(step) + '</div>' +
      '</div>'
    ).join('');

    const knowledge = result.knowledgePoints || [];
    knowledgeList.innerHTML = knowledge.length
      ? knowledge.map((item) => '<span class="tag">' + escapeHtml(item) + '</span>').join('')
      : '<span class="muted-note">未标注</span>';

    const mistakes = result.commonMistakes || [];
    mistakeList.innerHTML = mistakes.length
      ? mistakes.map((item) => '<li>' + escapeHtml(item) + '</li>').join('')
      : '<li>暂无标注</li>';

    studentAnswer.value = '';
    studentResult.textContent = '';
    studentResult.className = 'student-result';

    if (window.innerWidth <= 1180) {
      report.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderError(message) {
    finishProgress();
    emptyReport.hidden = true;
    report.hidden = true;
    progressCard.hidden = true;
    errorCard.hidden = false;
    errorText.textContent = message;
    state.result = null;
  }

  function clearView() {
    if (state.streaming) stopSolve();
    state.result = null;
    state.pendingImage = null;
    renderPendingImage();
    questionInput.value = '';
    autoResize();
    report.hidden = true;
    errorCard.hidden = true;
    progressCard.hidden = true;
    emptyReport.hidden = false;
    studentResult.textContent = '';
    emptyReport.scrollIntoView({ behavior: 'smooth', block: 'start' });
    questionInput.focus();
  }

  /* ---------- solve pipeline ---------- */

  function friendlyError(message) {
    const text = String(message || '');
    if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(text)) {
      return '无法连接本地校验服务。请确认已经运行 python server.py，并通过它提供的地址打开页面。';
    }
    if (/timeout|timed out/i.test(text)) {
      return '模型请求超时。可以稍后重试，或在设置中减少独立求解次数。';
    }
    return text;
  }

  async function readSSE(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventName = 'message';
    let dataLines = [];

    const dispatch = () => {
      if (!dataLines.length) {
        eventName = 'message';
        return;
      }
      const raw = dataLines.join('\n');
      dataLines = [];
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        data = { message: raw };
      }
      onEvent(eventName || 'message', data);
      eventName = 'message';
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, '');
        buffer = buffer.slice(index + 1);
        if (line === '') {
          dispatch();
        } else if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
    }
    if (buffer.trim()) {
      if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).trimStart());
    }
    dispatch();
    try {
      reader.releaseLock();
    } catch (err) {
      /* ignore */
    }
  }

  async function requestSolve(question, image, forceDemo) {
    const config = forceDemo
      ? { baseUrl: '', model: '', apiKey: '', samples: 1, critic: false }
      : {
          baseUrl: state.settings.baseUrl,
          model: state.settings.model,
          apiKey: state.settings.apiKey,
          samples: state.settings.samples,
          critic: state.settings.critic
        };
    const payload = {
      question: question,
      grade: state.grade,
      subject: state.subject,
      image: image || null,
      config: config,
      stream: true
    };
    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
      signal: state.abort.signal
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      let message = 'HTTP ' + response.status;
      try {
        const data = await response.json();
        message = data.error || data.message || message;
      } catch (err) {
        /* ignore */
      }
      throw new Error(message);
    }

    if (!contentType.includes('event-stream')) {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      renderReport(data);
      return;
    }

    await readSSE(response, (event, data) => {
      if (event === 'stage') {
        addStage(data);
      } else if (event === 'candidate') {
        addCandidate(data);
      } else if (event === 'result') {
        renderReport(data);
      } else if (event === 'error') {
        state.requestError = data.message || '校验失败。';
      }
    });

    if (state.requestError) throw new Error(state.requestError);
    if (!state.result) throw new Error('求解流程提前结束，没有收到结果。');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === '1') resolve();
        else {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('脚本加载失败')), { once: true });
        }
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.dataset.src = src;
      script.onload = () => {
        script.dataset.loaded = '1';
        resolve();
      };
      script.onerror = () => reject(new Error('脚本加载失败：' + src));
      document.head.appendChild(script);
    });
  }

  async function getPyodide() {
    if (state.pyodidePromise) return state.pyodidePromise;
    state.pyodidePromise = (async () => {
      if (!window.loadPyodide) {
        await loadScript('https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js');
      }
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/'
      });
      await pyodide.loadPackage('sympy');
      const source = await (await fetch('verifier.py?v=7', { cache: 'no-store' })).text();
      pyodide.FS.writeFile('/verifier.py', source);
      await pyodide.runPythonAsync("import sys; sys.path.insert(0, '/'); import verifier");
      return pyodide;
    })();
    try {
      return await state.pyodidePromise;
    } catch (err) {
      state.pyodidePromise = null;
      throw err;
    }
  }

  async function verifyInBrowser(question, answer, answerType) {
    const pyodide = await getPyodide();
    pyodide.globals.set('_q', question);
    pyodide.globals.set('_a', answer);
    pyodide.globals.set('_t', answerType || 'text');
    const raw = await pyodide.runPythonAsync(
      "import json\njson.dumps(verifier.verify_answer(_q, _a, _t, '数学'), ensure_ascii=False)"
    );
    return JSON.parse(raw);
  }

  async function compareInBrowser(question, expected, answer, answerType) {
    const pyodide = await getPyodide();
    pyodide.globals.set('_q', question);
    pyodide.globals.set('_e', expected);
    pyodide.globals.set('_s', answer);
    pyodide.globals.set('_t', answerType || 'text');
    const raw = await pyodide.runPythonAsync(
      "import json\njson.dumps(verifier.compare_answers(_q, _e, _s, _t, '数学'), ensure_ascii=False)"
    );
    return JSON.parse(raw);
  }

  function parseJsonLoose(text) {
    let source = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      return JSON.parse(source);
    } catch (err) {
      /* continue */
    }
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(source.slice(start, end + 1));
      } catch (err) {
        /* continue */
      }
    }
    return {};
  }

  function staticSolverSystem() {
    return '你是中国初高中数学作业辅导老师。请只输出一个 JSON 对象，不要 Markdown 代码围栏。' +
      '字段：final_answer（最终答案，可用 LaTeX）、answer_plain（便于程序校验的纯文本，如 x=4、1/3、(-oo,3)）、' +
      'answer_type（number|expression|equation|interval|set|choice|text|proof|tuple）、steps（字符串数组）、' +
      'knowledge_points（字符串数组）、common_mistakes（字符串数组）、assumptions（字符串数组）、confidence（0-1）。' +
      '必须分步推导并自检；不确定时降低 confidence。';
  }

  async function staticSolve(question) {
    const started = Date.now();
    addStage({ id: 'static-model', label: '调用在线模型', detail: '单路求解', progress: 18 });
    const response = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: staticSolverSystem() },
          { role: 'user', content: '学段：' + state.grade + '\n学科：' + state.subject + '\n题目：' + question }
        ],
        temperature: 0.1,
        max_tokens: 1800,
        stream: false
      }),
      signal: state.abort ? state.abort.signal : undefined
    });
    if (!response.ok) {
      let detail = 'HTTP ' + response.status;
      try {
        const data = await response.json();
        detail = (data.error && (data.error.message || data.error.code)) || data.message || detail;
      } catch (err) {
        /* ignore */
      }
      throw new Error(detail + '（在线服务约 45 秒限 1 次）');
    }
    const payload = await response.json();
    const content = (payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content) || '';
    let data = parseJsonLoose(content);
    let finalAnswer = String(data.final_answer || data.answer || '').trim();
    if (!finalAnswer) {
      const match = content.match(/(?:最终答案|答案)\s*[:：]\s*([^\n]+)/);
      finalAnswer = match ? match[1].trim() : content.trim().split('\n').slice(-1)[0] || '';
    }
    if (!finalAnswer) throw new Error('在线模型没有返回可识别的答案。');
    const answerType = String(data.answer_type || 'text').toLowerCase();
    const answerPlain = String(data.answer_plain || finalAnswer).trim();
    const steps = Array.isArray(data.steps) ? data.steps.map(String) : [];
    const knowledge = Array.isArray(data.knowledge_points) ? data.knowledge_points.map(String) : [];
    const mistakes = Array.isArray(data.common_mistakes) ? data.common_mistakes.map(String) : [];
    const assumptions = Array.isArray(data.assumptions) ? data.assumptions.map(String) : [];

    addStage({ id: 'static-engine', label: '加载浏览器数学引擎', detail: '首次使用需要下载 Pyodide + SymPy', progress: 55 });
    let verification = {
      checks: [],
      verdict: 'none',
      independent_verified: false,
      contradicted: false,
      strong_check_count: 0
    };
    try {
      verification = await verifyInBrowser(question, answerPlain, answerType);
      addStage({ id: 'static-verify', label: '浏览器内独立校验', detail: 'SymPy 正在检查答案', progress: 82 });
    } catch (err) {
      verification.checks = [{
        name: '浏览器 SymPy 校验',
        status: 'skip',
        detail: '数学引擎加载失败：' + (err.message || err),
        strength: 'weak'
      }];
    }

    let status = 'unverified';
    let confidence = 0.5;
    if (verification.contradicted) {
      status = 'disputed';
      confidence = 0.35;
    } else if (verification.independent_verified) {
      status = 'verified';
      confidence = 0.88;
    }
    const statusText = {
      verified: '浏览器内校验通过',
      disputed: '存在分歧，建议核对',
      unverified: '在线演示 · 未独立校验'
    }[status];
    return {
      id: 'static-' + Date.now().toString(36),
      question,
      grade: state.grade,
      subject: state.subject,
      status,
      statusText,
      confidence,
      confidenceLabel: confidence >= 0.8 ? '中高' : '偏低',
      finalAnswer,
      answerType: answerType || 'text',
      steps: steps.length ? steps : ['在线演示没有返回分步解析。'],
      knowledgePoints: knowledge,
      commonMistakes: mistakes,
      assumptions,
      checks: verification.checks || [],
      verification: {
        verdict: verification.verdict,
        independentVerified: !!verification.independent_verified,
        contradicted: !!verification.contradicted,
        strongCheckCount: verification.strong_check_count || 0
      },
      consensus: {
        total: 1,
        agreement: 1,
        groups: [{ answer: finalAnswer, size: 1, answerType }]
      },
      candidates: [{ answer: finalAnswer, answerType, confidence: 0.7 }],
      critic: null,
      demo: false,
      static: true,
      verificationNote: 'GitHub Pages 在线演示：单路在线模型 + 浏览器内 SymPy 校验；没有多路一致与模型复核，网络限速时请稍后重试。',
      elapsedMs: Date.now() - started
    };
  }

  async function solve(questionOverride, options) {
    if (state.streaming) {
      stopSolve();
      return;
    }
    if (!state.configReady) {
      toast('正在加载模型配置，请稍候…');
      return;
    }
    const forceDemo = !!(options && options.demo);
    const question = String(questionOverride != null ? questionOverride : questionInput.value).trim();
    if (!question && !state.pendingImage) {
      toast('请先输入题目，或上传一张题目截图');
      questionInput.focus();
      return;
    }
    if (state.staticMode && forceDemo && state.staticDemo) {
      const results = state.staticDemo.results || {};
      const normalize = (value) => String(value || '').replace(/\s+/g, '').replace(/\$/g, '');
      const found = Object.values(results).find((item) => normalize(item.question) === normalize(question));
      if (found) {
        state.result = found;
        renderReport(found);
        saveHistory(found);
        return;
      }
    }

    state.lastQuestion = question || '请解答图片中的题目。';
    startProgress(state.lastQuestion);
    state.streaming = true;
    solveBtn.classList.add('running');
    solveLabel.textContent = '停止生成';
    solveBtn.disabled = false;

    const image = state.pendingImage;
    state.pendingImage = null;
    renderPendingImage();
    state.abort = new AbortController();

    try {
      if (state.staticMode) {
        let finalQuestion = question;
        if (!finalQuestion && image) {
          finalQuestion = await ocrImageDataUrl(image);
          if (!finalQuestion) throw new Error('没有从图片中识别出题目，请直接输入文字。');
          questionInput.value = finalQuestion;
          autoResize();
        }
        const result = await staticSolve(finalQuestion);
        state.result = result;
        renderReport(result);
        saveHistory(result);
        finishProgress();
      } else {
        await requestSolve(question, image, forceDemo);
        if (state.result) {
          saveHistory(state.result);
          finishProgress();
        }
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        finishProgress();
        if (!state.result) {
          emptyReport.hidden = false;
          questionInput.focus();
        }
        toast('已停止本次求解');
      } else {
        renderError(friendlyError(err && err.message ? err.message : String(err)));
      }
    } finally {
      state.streaming = false;
      state.abort = null;
      solveBtn.classList.remove('running');
      solveLabel.textContent = '开始解题';
      solveBtn.disabled = false;
    }
  }

  function stopSolve() {
    if (state.abort) {
      try {
        state.abort.abort();
      } catch (err) {
        /* ignore */
      }
    }
  }

  /* ---------- student answer check ---------- */

  async function checkStudentAnswer() {
    if (!state.result) return;
    const answer = studentAnswer.value.trim();
    if (!answer) {
      toast('先输入你的答案');
      studentAnswer.focus();
      return;
    }
    checkAnswerBtn.disabled = true;
    studentResult.textContent = '正在比较…';
    studentResult.className = 'student-result';
    try {
      let data;
      if (state.staticMode) {
        data = await compareInBrowser(
          state.result.question,
          state.result.finalAnswer,
          answer,
          state.result.answerType
        );
      } else {
        const response = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: state.result.question,
            expected: state.result.finalAnswer,
            answerType: state.result.answerType,
            student: answer,
            subject: state.result.subject
          })
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || '比较失败');
      }
      studentResult.className = 'student-result ' + (data.equivalent ? 'ok' : 'bad');
      studentResult.textContent = (data.equivalent ? '✓ ' : '✗ ') + data.reason;
      if (!data.equivalent) {
        studentResult.textContent += ' 你的答案：' + answer + '。';
      }
      if (['disputed', 'unverified', 'consensus', 'demo'].includes(state.result.status)) {
        studentResult.textContent += ' 注意：标准答案本身尚未通过独立验证，本次比较仅供参考。';
      }
    } catch (err) {
      studentResult.className = 'student-result bad';
      studentResult.textContent = err.message || '比较失败';
    } finally {
      checkAnswerBtn.disabled = false;
    }
  }

  /* ---------- settings ---------- */

  function populateSettingsForm() {
    setBaseUrl.value = state.settings.baseUrl || '';
    setModel.value = state.settings.model || '';
    setApiKey.value = state.settings.apiKey || '';
    setSamples.value = String(state.settings.samples || 3);
    setCritic.checked = state.settings.critic !== false;
    highlightPreset();
  }

  function highlightPreset() {
    const base = setBaseUrl.value.trim().replace(/\/+$/, '');
    const model = setModel.value.trim();
    $$('.preset-chip', presetRow).forEach((chip) => {
      const preset = PRESETS.find((item) => item.id === chip.dataset.preset);
      chip.classList.toggle('active', !!preset && preset.base.replace(/\/+$/, '') === base && preset.model === model);
    });
  }

  function readSettingsForm() {
    return {
      baseUrl: setBaseUrl.value.trim().replace(/\/+$/, ''),
      model: setModel.value.trim(),
      apiKey: setApiKey.value.trim(),
      samples: clamp(parseInt(setSamples.value, 10) || 3, 1, 5),
      critic: setCritic.checked
    };
  }

  function openSettings() {
    if (state.publicMode || state.staticMode) {
      toast('在线演示');
      return;
    }
    populateSettingsForm();
    testStatus.textContent = '尚未测试';
    testStatus.className = 'test-status';
    if (!settingsDialog.open) settingsDialog.showModal();
  }

  function closeSettings() {
    if (settingsDialog.open) settingsDialog.close();
  }

  function saveSettings() {
    const next = readSettingsForm();
    if (next.baseUrl && !next.model) {
      toast('请填写模型名称');
      setModel.focus();
      return;
    }
    if (next.model && !next.baseUrl) {
      toast('请填写接口地址');
      setBaseUrl.focus();
      return;
    }
    state.settings = next;
    saveJSON(KEYS.settings, state.settings);
    renderStatus();
    closeSettings();
    toast(next.baseUrl ? '已保存模型设置 · ' + next.model : '已切换到本地示例模式');
  }

  async function testConnection() {
    const config = readSettingsForm();
    if (!config.baseUrl || !config.model) {
      testStatus.textContent = '先填写接口地址和模型名称';
      testStatus.className = 'test-status bad';
      return;
    }
    testBtn.disabled = true;
    testStatus.textContent = '正在连接…';
    testStatus.className = 'test-status';
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '连接失败');
      testStatus.textContent = '连接成功：' + (data.message || '服务已响应');
      testStatus.className = 'test-status ok';
    } catch (err) {
      testStatus.textContent = friendlyError(err.message || String(err));
      testStatus.className = 'test-status bad';
    } finally {
      testBtn.disabled = false;
    }
  }

  /* ---------- toast ---------- */

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = '<svg class="icon"><use href="#i-check"></use></svg><span>' + escapeHtml(message) + '</span>';
    toastWrap.appendChild(node);
    while (toastWrap.children.length > 3) toastWrap.firstElementChild.remove();
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 220);
    }, 2400);
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

  /* ---------- copy report ---------- */

  function buildReportMarkdown() {
    const result = state.result;
    if (!result) return '';
    const lines = [
      '# ' + (result.question || '题目'),
      '',
      '**最终答案：** ' + stripMath(result.finalAnswer),
      '**状态：** ' + (result.statusText || STATUS_LABEL[result.status] || '待核对') +
        '（可信度 ' + Math.round((result.confidence || 0) * 100) + '%）',
      '',
      '## 分步解析',
      ...(result.steps || []).map((step, index) => (index + 1) + '. ' + step),
      ''
    ];
    if (result.knowledgePoints?.length) {
      lines.push('## 知识点', result.knowledgePoints.join('、'), '');
    }
    if (result.commonMistakes?.length) {
      lines.push('## 易错点', ...result.commonMistakes.map((item) => '- ' + item), '');
    }
    if (result.checks?.length) {
      lines.push('## 校验依据');
      result.checks.forEach((check) => {
        const status = check.status === 'pass' ? '通过' : check.status === 'fail' ? '失败' : '跳过';
        lines.push('- [' + status + '] ' + check.name + '：' + (check.detail || ''));
      });
      lines.push('');
    }
    if (result.verificationNote) lines.push('> ' + result.verificationNote, '');
    lines.push('— 由作业校验台生成，请核对题目条件。');
    return lines.join('\n');
  }

  /* ---------- events ---------- */

  function autoResize() {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 260) + 'px';
  }

  function newQuestion() {
    clearView();
    renderHistory();
  }

  function bind() {
    document.documentElement.dataset.theme = state.theme;

    presetRow.innerHTML = PRESETS.map((preset) =>
      '<button class="preset-chip" data-preset="' + preset.id + '" title="' + escapeHtml(preset.hint) + '">' +
        escapeHtml(preset.label) +
      '</button>'
    ).join('');

    $('#brandBtn').addEventListener('click', (event) => {
      event.preventDefault();
      newQuestion();
    });
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#settingsBtn').addEventListener('click', openSettings);
    statusBtn.addEventListener('click', openSettings);
    $('#clearHistoryBtn').addEventListener('click', clearHistory);

    gradeGroup.addEventListener('click', (event) => {
      const button = event.target.closest('[data-grade]');
      if (!button) return;
      state.grade = button.dataset.grade;
      renderScope();
    });
    subjectGroup.addEventListener('click', (event) => {
      const button = event.target.closest('[data-subject]');
      if (!button) return;
      state.subject = button.dataset.subject;
      renderScope();
    });

    questionInput.addEventListener('input', () => {
      autoResize();
      if (errorCard.hidden === false && !state.streaming) errorCard.hidden = true;
    });
    questionInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        solve();
      }
    });

    solveBtn.addEventListener('click', () => solve());
    $('#checkAnswerBtn').addEventListener('click', checkStudentAnswer);
    studentAnswer.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') checkStudentAnswer();
    });

    sampleChips.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-sample]');
      if (!chip) return;
      const item = state.demoQuestions[Number(chip.dataset.sample)];
      if (!item) return;
      state.grade = item.grade || state.grade;
      state.subject = item.subject || state.subject;
      renderScope();
      questionInput.value = displayQuestion(item.question);
      autoResize();
      solve(item.question, { demo: true });
    });

    historyList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-history]');
      if (!item) return;
      const entry = state.history.find((row) => row.id === item.dataset.history);
      if (!entry) return;
      state.grade = entry.grade;
      state.subject = entry.subject;
      state.lastQuestion = entry.question;
      questionInput.value = displayQuestion(entry.question);
      autoResize();
      renderScope();
      renderReport(entry.result);
    });

    $('#imageBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = (fileInput.files || [])[0];
      fileInput.value = '';
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        toast('请选择图片文件');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast('图片超过 10MB，请压缩后再试');
        return;
      }
      try {
        if (state.staticMode) {
          await recognizeStaticImage(file);
          return;
        }
        state.pendingImage = await readImage(file);
        renderPendingImage();
      } catch (err) {
        toast(err.message || '图片读取失败');
      }
    });
    pendingImages.addEventListener('click', (event) => {
      if (!event.target.closest('[data-remove-image]')) return;
      state.pendingImage = null;
      renderPendingImage();
    });

    // settings
    presetRow.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-preset]');
      if (!chip) return;
      const preset = PRESETS.find((item) => item.id === chip.dataset.preset);
      if (!preset) return;
      setBaseUrl.value = preset.base;
      setModel.value = preset.model;
      if (['vllm', 'omni', 'ollama', 'demo', 'kilo', 'opencode', 'pollinations'].includes(preset.id)) setApiKey.value = '';
      highlightPreset();
    });
    setBaseUrl.addEventListener('input', highlightPreset);
    setModel.addEventListener('input', highlightPreset);
    $('#saveSettingsBtn').addEventListener('click', saveSettings);
    testBtn.addEventListener('click', testConnection);
    $$('[data-close]', settingsDialog).forEach((button) => button.addEventListener('click', closeSettings));
    settingsDialog.addEventListener('click', (event) => {
      if (event.target === settingsDialog) closeSettings();
    });
    $('#resetDataBtn').addEventListener('click', () => {
      if (!window.confirm('清除全部本地数据？历史、设置和主题都会被删除。')) return;
      Object.keys(localStorage).filter((key) => key.indexOf('hw.') === 0).forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    });

    // report actions
    $('#copyReportBtn').addEventListener('click', () => copyText(buildReportMarkdown(), '解析已复制'));
    $('#newQuestionBtn').addEventListener('click', newQuestion);
    $('#errorSettingsBtn').addEventListener('click', openSettings);
    $('#errorRetryBtn').addEventListener('click', () => solve(state.lastQuestion || questionInput.value));

    document.addEventListener('keydown', (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        questionInput.focus();
      }
      if (mod && event.key === ',') {
        event.preventDefault();
        openSettings();
      }
      if (event.key === 'Escape' && settingsDialog.open) closeSettings();
    });
  }

  /* ---------- boot ---------- */

  bind();
  renderTheme();
  renderScope();
  renderHistory();
  autoResize();
  renderPendingImage();
  loadConfig();

  window.HomeworkLab = {
    state,
    solve,
    openSettings,
    loadConfig
  };
})();
