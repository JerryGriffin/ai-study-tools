#!/usr/bin/env node
/**
 * 题库数据 lint —— 在发布前拦住「结构错、引用错、公式没闭合、占位符没删」。
 *
 * 为什么不用 JSON：data.js 里大量 LaTeX 用 String.raw 写，迁移成 JSON 会让
 * 反斜杠翻倍、diff 不可读。这里直接在 vm 里执行数据文件，拿 window.CALC_DATA。
 *
 * 用法：
 *   node scripts/lint-data.mjs
 *   node scripts/lint-data.mjs --strict   # 把 warning 也当成失败
 *
 * 退出码：0 通过；1 有 error（--strict 时含 warning）。
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');

const TARGETS = [
  { name: '高数答疑室', file: 'calculus-tutor/data.js' },
  { name: '物理答疑室', file: 'physics-tutor/data.js' },
];

const errors = [];
const warnings = [];
let checkedQuestions = 0;
let checkedChapters = 0;

const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/** 在隔离上下文里执行 data.js，拿到 window.CALC_DATA。 */
function loadData(relFile) {
  const file = path.join(ROOT, relFile);
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  try {
    vm.runInNewContext(src, sandbox, { filename: relFile, timeout: 5000 });
  } catch (e) {
    err(relFile, `执行失败：${e.message}`);
    return null;
  }
  const data = sandbox.window.CALC_DATA;
  if (!data || !Array.isArray(data.CHAPTERS) || !Array.isArray(data.QUESTIONS)) {
    err(relFile, '没有导出 { CHAPTERS, QUESTIONS }');
    return null;
  }
  return data;
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

/** 检查 LaTeX 的 $ / $$ 与花括号是否成对（跳过 \{ \} 与转义符）。 */
function checkLatex(where, label, text) {
  if (!isText(text)) return;

  // 去掉行内代码 `...`，避免把示例里的 $ 当成公式
  const clean = text.replace(/`[^`]*`/g, '');

  // $$ 必须成对；单个 $ 的数量也必须是偶数
  const display = (clean.match(/\$\$/g) || []).length;
  if (display % 2 !== 0) err(where, `${label} 的 $$ 未闭合`);

  const inline = (clean.replace(/\$\$/g, '').match(/\$/g) || []).length;
  if (inline % 2 !== 0) err(where, `${label} 的行内 $ 未闭合`);

  let depth = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === '\\') { i += 1; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth < 0) {
        err(where, `${label} 出现多余的 }`);
        return;
      }
    }
  }
  if (depth !== 0) err(where, `${label} 的花括号未闭合（差 ${depth} 个）`);

  // 常见的 AI 生成残留
  for (const bad of ['undefined', 'NaN', 'TODO', '????']) {
    if (clean.includes(bad)) err(where, `${label} 含占位符/异常值「${bad}」`);
  }
  if (/\\[a-zA-Z]+\s*\{\s*\}/.test(clean)) warn(where, `${label} 含空参数命令，例如 \\frac{}{}`);
}

function checkChapter(where, ch, index, seenIds) {
  checkedChapters += 1;
  if (!isText(ch.id)) return err(where, '缺少 id');
  if (seenIds.has(ch.id)) err(where, `章节 id 重复：${ch.id}`);
  seenIds.add(ch.id);

  if (ch.index !== index + 1) {
    err(where, `章节 ${ch.id} 的 index=${ch.index}，按顺序应为 ${index + 1}`);
  }
  for (const key of ['name', 'glyph', 'short', 'intro']) {
    if (!isText(ch[key])) err(where, `章节 ${ch.id} 缺少 ${key}`);
  }
  if (!Array.isArray(ch.keywords) || ch.keywords.length < 3) {
    err(where, `章节 ${ch.id} 的 keywords 少于 3 个`);
  } else if (new Set(ch.keywords).size !== ch.keywords.length) {
    warn(where, `章节 ${ch.id} 的 keywords 有重复`);
  }
  if (!Array.isArray(ch.prompts) || ch.prompts.length < 2) {
    err(where, `章节 ${ch.id} 的 prompts 少于 2 条`);
  }
  if (!Array.isArray(ch.formulas) || ch.formulas.length === 0) {
    err(where, `章节 ${ch.id} 没有 formulas`);
  } else {
    ch.formulas.forEach((f, i) => {
      if (!isText(f?.name)) err(where, `章节 ${ch.id} 的 formulas[${i}] 缺少 name`);
      if (!isText(f?.tex)) err(where, `章节 ${ch.id} 的 formulas[${i}] 缺少 tex`);
      else checkLatex(where, `章节 ${ch.id} formulas[${i}]`, f.tex);
    });
  }
}

function checkQuestion(where, q, chapterIds) {
  checkedQuestions += 1;
  const at = where;
  if (!isText(q.id)) return err(at, '题目缺少 id');
  if (!chapterIds.has(q.chapter)) err(at, `chapter 引用了不存在的章节「${q.chapter}」`);
  if (!Number.isInteger(q.level) || q.level < 1 || q.level > 3) {
    err(at, `level 应为 1~3 的整数，实际为 ${JSON.stringify(q.level)}`);
  }
  for (const key of ['title', 'question', 'hint', 'solution', 'answer']) {
    if (!isText(q[key])) err(at, `缺少 ${key}`);
  }
  if (isText(q.solution) && q.solution.trim().length < 40) {
    warn(at, `solution 只有 ${q.solution.trim().length} 字，可能没有写完整过程`);
  }
  if (isText(q.hint) && isText(q.solution) && q.hint.trim() === q.solution.trim()) {
    err(at, 'hint 与 solution 完全相同');
  }
  for (const key of ['title', 'question', 'hint', 'solution', 'answer']) {
    if (isText(q[key])) checkLatex(at, key, q[key]);
  }
}

for (const target of TARGETS) {
  const data = loadData(target.file);
  if (!data) continue;

  const { CHAPTERS, QUESTIONS } = data;
  const chapterIds = new Set();
  const questionIds = new Set();
  const questionTexts = new Map();
  const chapterQuestionCount = new Map();

  if (CHAPTERS.length === 0) err(target.file, 'CHAPTERS 为空');
  CHAPTERS.forEach((ch, i) => checkChapter(target.file, ch, i, chapterIds));

  QUESTIONS.forEach((q, i) => {
    const where = `${target.file} QUESTIONS[${i}]${isText(q?.id) ? ` (${q.id})` : ''}`;
    if (!q || typeof q !== 'object') return err(where, '不是对象');
    if (isText(q.id)) {
      if (questionIds.has(q.id)) err(where, `题目 id 重复：${q.id}`);
      questionIds.add(q.id);
    }
    checkQuestion(where, q, chapterIds);
    if (isText(q.question)) {
      const norm = q.question.replace(/\s+/g, ' ').trim();
      if (questionTexts.has(norm)) {
        err(where, `题干与 ${questionTexts.get(norm)} 重复`);
      } else {
        questionTexts.set(norm, q.id || where);
      }
    }
    if (chapterIds.has(q.chapter)) {
      chapterQuestionCount.set(q.chapter, (chapterQuestionCount.get(q.chapter) || 0) + 1);
    }
  });

  for (const ch of CHAPTERS) {
    const n = chapterQuestionCount.get(ch.id) || 0;
    if (n === 0) err(target.file, `章节 ${ch.id} 没有任何练习题`);
  }
  const empty = QUESTIONS.length === 0;
  if (empty) err(target.file, 'QUESTIONS 为空');

  console.log(
    `\n${target.name}  ${target.file}\n` +
    `  章节 ${CHAPTERS.length} · 题目 ${QUESTIONS.length} · ` +
    `平均每章 ${(QUESTIONS.length / Math.max(1, CHAPTERS.length)).toFixed(1)} 题`,
  );
}

console.log('');
if (warnings.length) {
  console.log(`warning ${warnings.length} 条`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
}
if (errors.length) {
  console.log(`error ${errors.length} 条`);
  errors.forEach((e) => console.log(`  x ${e}`));
}

const failed = errors.length > 0 || (STRICT && warnings.length > 0);
console.log(`\n检查 ${checkedChapters} 章 / ${checkedQuestions} 题：${failed ? '未通过' : '通过'}`);
process.exit(failed ? 1 : 0);
