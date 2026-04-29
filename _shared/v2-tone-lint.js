#!/usr/bin/env node
/* Heart Open — V2 톤 카피 lint (Stage 1 공통)
 * Source: stage_taxonomy.md §V2 톤 카피 가이드
 * Issue:  HEAAA-218
 *
 * 사용:
 *   node _shared/v2-tone-lint.js                # 전체 컨셉 디렉토리 스캔
 *   node _shared/v2-tone-lint.js slot-match     # 특정 컨셉만
 *   node _shared/v2-tone-lint.js path/to/file.html
 *
 * Exit code:
 *   0 = pass / 1 = warning(s) / 2 = error(s)
 *
 * 검사 항목:
 *   1) 금지어 (당신/유저/심층/심리분석/진단/프리미엄/Cosmic/Portal/Aura)
 *   2) 명령형 어미 (~하세요/~해라) — 권장 톤은 제안형
 *   3) 결과 한 줄 카피 길이 (.result-sub 류 15자 룰, 최대 20자)
 *   4) 버튼 라벨 길이 (8자 권장, 최대 12자)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── 룰 정의 ───────────────────────────────────────────────
const FORBIDDEN_WORDS = [
  { pattern: /당신/g,             suggest: '"너" / "나" / 생략' },
  { pattern: /유저/g,             suggest: '"너" / 생략' },
  { pattern: /심층/g,             suggest: '"보기" / "알아보기"' },
  { pattern: /심리\s*분석/g,       suggest: '"마음 들여다보기"' },
  { pattern: /진단/g,             suggest: '"보기" / "알아보기"' },
  { pattern: /프리미엄/g,          suggest: '"더 자세히" / "앱에서"' },
  { pattern: /Cosmic/gi,         suggest: '한국어 일상 표현' },
  { pattern: /Portal/gi,         suggest: '한국어 일상 표현' },
  { pattern: /Aura/gi,           suggest: '한국어 일상 표현' },
];

const IMPERATIVE_ENDINGS = [
  { pattern: /하세요(?=[.!?。\s"'<])/g, suggest: '제안형 "~해볼까?" / "~해봐"' },
  { pattern: /해라(?=[.!?。\s"'<])/g,   suggest: '제안형 "~해볼까?" / "~해봐"' },
];

// 결과 한 줄 카피: <p class="result-sub">…</p>, <h2 class="result-title">…</h2>
const RESULT_SUB_RE   = /<p[^>]*\bclass="[^"]*\bresult-sub\b[^"]*"[^>]*>([^<]+)<\/p>/g;
const RESULT_TITLE_RE = /<h\d[^>]*\bclass="[^"]*\bresult-title\b[^"]*"[^>]*>([^<]+)<\/h\d>/g;

// 버튼 텍스트
const BUTTON_RE = /<button[^>]*>([^<]+)<\/button>/g;

const RESULT_SUB_RECOMMENDED = 15;
const RESULT_SUB_MAX = 20;
const BUTTON_RECOMMENDED = 8;
const BUTTON_MAX = 12;

// ─── 입력 수집 ─────────────────────────────────────────────
const SCAN_EXT = new Set(['.html', '.js', '.md']);
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'assets', '_shared', 'shared',
]);
// Project-root developer docs reference the V2 tone forbidden words by name
// in order to *document the rule*. Skip them only at ROOT — concept-level
// READMEs and other md files still get scanned.
const IGNORE_ROOT_FILES = new Set(['README.md', 'CLAUDE.md']);

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return SCAN_EXT.has(path.extname(target)) ? [target] : [];
  const out = [];
  for (const name of fs.readdirSync(target)) {
    if (IGNORE_DIRS.has(name)) continue;
    if (target === ROOT && IGNORE_ROOT_FILES.has(name)) continue;
    const full = path.join(target, name);
    const s = fs.statSync(full);
    if (s.isDirectory()) out.push(...collectFiles(full));
    else if (SCAN_EXT.has(path.extname(name))) out.push(full);
  }
  return out;
}

// ─── 검사 ──────────────────────────────────────────────────
function visibleLength(s) {
  // 이모지/공백 제거 후 글자수 (Korean grapheme 단위 근사)
  const stripped = s
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ')   // surrogate pair (이모지) → 공백
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(stripped).length;
}

function lineOfIndex(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function lintFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const findings = [];

  // 1) 금지어
  for (const { pattern, suggest } of FORBIDDEN_WORDS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      findings.push({
        level: 'error',
        line: lineOfIndex(text, m.index),
        rule: 'forbidden-word',
        msg: `"${m[0]}" → ${suggest}`,
      });
    }
  }

  // 2) 명령형 어미
  for (const { pattern, suggest } of IMPERATIVE_ENDINGS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      findings.push({
        level: 'warn',
        line: lineOfIndex(text, m.index),
        rule: 'imperative-tone',
        msg: `"${m[0]}" → ${suggest}`,
      });
    }
  }

  // 3) 결과 한 줄 카피 길이 (HTML만)
  if (file.endsWith('.html')) {
    let m;
    RESULT_SUB_RE.lastIndex = 0;
    while ((m = RESULT_SUB_RE.exec(text)) !== null) {
      const len = visibleLength(m[1]);
      if (len > RESULT_SUB_MAX) {
        findings.push({
          level: 'error',
          line: lineOfIndex(text, m.index),
          rule: 'result-sub-length',
          msg: `result-sub ${len}자 (최대 ${RESULT_SUB_MAX}): "${m[1].trim()}"`,
        });
      } else if (len > RESULT_SUB_RECOMMENDED) {
        findings.push({
          level: 'warn',
          line: lineOfIndex(text, m.index),
          rule: 'result-sub-length',
          msg: `result-sub ${len}자 (권장 ${RESULT_SUB_RECOMMENDED}): "${m[1].trim()}"`,
        });
      }
    }

    // 4) 버튼 길이
    BUTTON_RE.lastIndex = 0;
    while ((m = BUTTON_RE.exec(text)) !== null) {
      const len = visibleLength(m[1]);
      if (len === 0) continue;
      if (len > BUTTON_MAX) {
        findings.push({
          level: 'error',
          line: lineOfIndex(text, m.index),
          rule: 'button-length',
          msg: `button ${len}자 (최대 ${BUTTON_MAX}): "${m[1].trim()}"`,
        });
      } else if (len > BUTTON_RECOMMENDED) {
        findings.push({
          level: 'warn',
          line: lineOfIndex(text, m.index),
          rule: 'button-length',
          msg: `button ${len}자 (권장 ${BUTTON_RECOMMENDED}): "${m[1].trim()}"`,
        });
      }
    }
  }

  return { rel, findings };
}

// ─── 출력 ──────────────────────────────────────────────────
function format(level) {
  if (level === 'error') return '\x1b[31mERROR\x1b[0m';
  if (level === 'warn')  return '\x1b[33mWARN \x1b[0m';
  return level;
}

function main() {
  const arg = process.argv[2];
  let target;
  if (!arg) {
    target = ROOT;
  } else if (path.isAbsolute(arg)) {
    target = arg;
  } else {
    const candidate = path.join(ROOT, arg);
    target = fs.existsSync(candidate) ? candidate : path.resolve(arg);
  }

  if (!fs.existsSync(target)) {
    console.error(`Path not found: ${target}`);
    process.exit(2);
  }

  const files = collectFiles(target);
  let errors = 0;
  let warns = 0;

  for (const f of files) {
    const { rel, findings } = lintFile(f);
    if (!findings.length) continue;
    console.log(`\n${rel}`);
    for (const finding of findings) {
      console.log(`  ${format(finding.level)} L${finding.line} [${finding.rule}] ${finding.msg}`);
      if (finding.level === 'error') errors++; else warns++;
    }
  }

  console.log(
    `\n${files.length} files scanned · ` +
    `\x1b[31m${errors} error\x1b[0m · \x1b[33m${warns} warn\x1b[0m`
  );

  if (errors > 0) process.exit(2);
  if (warns > 0) process.exit(1);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { lintFile, FORBIDDEN_WORDS, IMPERATIVE_ENDINGS };
