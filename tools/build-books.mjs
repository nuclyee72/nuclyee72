#!/usr/bin/env node
// books.config.json -> assets/books/<slug>.svg  +  README 의 books 블록
// 각 책등 SVG 아래쪽에 선반 판자 조각이 들어있어, 한 줄로 늘어놓으면 이어진 선반이 된다.
// 무의존성.  실행:  node tools/build-books.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'books');
mkdirSync(OUT, { recursive: true });

const cfg = JSON.parse(readFileSync(join(ROOT, 'tools', 'books.config.json'), 'utf8'));
const R = cfg.render ?? {};
const SPINE_H = R.spineHeight ?? 210;               // README 에서 각 <img> 의 height (px)
const ROT = (R.titleDirection ?? 'down') === 'up' ? -90 : 90;   // down: 위→아래

const PALETTE = ['#26313f', '#33402f', '#4a1e1e', '#3b2c1d', '#2f2740', '#274043'];
const GOLD = '#ecd28a';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (x, d = 2) => Number(Number(x).toFixed(d));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 결정론적 지터: slug 해시
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; }

const VB_W = 57;
const VB_H = 232;
const SHELF_TOP = 202;          // 선반 윗면 = 책이 놓이는 선
const BOOK_W = 47;
const BOOK_X = (VB_W - BOOK_W) / 2;
const BL = 9;                   // 선반 좌우 bleed (이웃 타일과 이음새 방지)

function titleMarkup(title, cx, mid, panelLen) {
  const words = title.split(/\s+/).filter(Boolean);
  const font = `font-family="Georgia, 'Times New Roman', 'Nanum Myeongjo', serif" font-weight="600"`;
  // rotate 텍스트에서 dominant-baseline 이 살짝 위로 뜨는 것 보정
  const line = (w, fs, ls, dx) =>
    `<text transform="translate(${n(cx + dx)} ${n(mid + fs * 0.30)}) rotate(${ROT})" text-anchor="middle" dominant-baseline="central"
      ${font} font-size="${n(fs)}" letter-spacing="${ls}" fill="${GOLD}">${esc(w)}</text>`;

  if (words.length < 2 || title.length < 8) {
    const fs = clamp((panelLen - 12) / (title.length * 0.74), 7, 10.5);
    return line(title, fs, fs >= 9 ? 0.6 : 1.1, 0);
  }
  const maxLen = Math.max(...words.map(w => w.length));
  const fs = clamp((panelLen - 16) / (maxLen * 0.74), 7, 11);
  const gap = fs + 2.2;
  const spread = (words.length - 1) * gap;
  return words.map((w, i) => line(w, fs, 0.6, n(spread / 2 - i * gap))).join('\n    ');
}

function spineSVG(book, i) {
  const seed = hash(book.slug);
  const rand = rng(seed);
  const cover = book.cover || PALETTE[i % PALETTE.length];
  const accent = book.accent || '#caa63a';
  const title = (book.title || book.slug).toUpperCase();

  const H = book.height ?? Math.round(SPINE_H - 32 + rand() * 12);
  const tilt = book.tilt ?? n(rand() * 1.8 - 0.9, 2);
  const y0 = SHELF_TOP - H;
  const cx = BOOK_X + BOOK_W / 2;

  const panelH = clamp(H * 0.42, 76, 110);
  const pc = n(y0 + H * 0.44);                 // 제목 패널 중심
  const tpA = n(pc - panelH / 2), tpB = n(pc + panelH / 2);
  const b0 = n(tpA - 5), b1 = n(tpB + 5);      // 패널 위·아래 밴드
  const hubTop = n(y0 + 14);
  const hubBot = n(SHELF_TOP - 13);
  const panelLen = panelH - 12;

  const wear = [];
  for (let k = 0; k < 3; k++) {
    const wx = n(BOOK_X + 5 + rand() * (BOOK_W - 10));
    wear.push(`<path d="M${wx} ${n(y0 + 6 + rand() * 8)} V${n(SHELF_TOP - 5 - rand() * 8)}"/>`);
  }
  const pages = [];
  for (let k = 0; k < 3; k++) {
    const py = n(y0 + 12 + rand() * 20 + k * 6);
    pages.push(`<path d="M${n(BOOK_X + BOOK_W - 1)} ${py} h2.4"/>`);
  }

  const s1 = seed % 13, s2 = (seed >> 3) % 17 + 2, s3 = (seed >> 7) % 11 + 4, s4 = (seed >> 11) % 19 + 1;
  const hub = b => `<rect x="${n(BOOK_X - 1)}" y="${n(b - 2.3)}" width="${BOOK_W + 2}" height="4.6" fill="#000000" opacity="0.30"/><rect x="${n(BOOK_X - 1)}" y="${n(b - 2.3)}" width="${BOOK_W + 2}" height="1.2" fill="#ffffff" opacity="0.13"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}" role="img" aria-label="${esc(title)}">
  <defs>
    <filter id="j" x="-32%" y="-6%" width="164%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="${s1}" result="n">
        <animate attributeName="seed" values="${s1};${s2};${s3};${s4}" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="js" x="-22%" y="-40%" width="144%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" seed="${s2}" result="n">
        <animate attributeName="seed" values="${s2};${s4};${s1 + 5};${s3}" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="lit" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.16" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.80" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.30"/>
    </linearGradient>
  </defs>

  <!-- 책 -->
  <g filter="url(#j)" transform="rotate(${tilt} ${cx} ${SHELF_TOP})">
    <rect x="${n(BOOK_X + BOOK_W - 1.5)}" y="${n(y0 + 4)}" width="3" height="${n(H - 8)}" fill="#b3a884"/>
    <g stroke="#82785f" stroke-width="0.5" opacity="0.4" fill="none">
      ${pages.join('\n      ')}
    </g>
    <rect x="${BOOK_X}" y="${n(y0)}" width="${BOOK_W}" height="${n(H)}" rx="2.2" fill="${cover}" stroke="#160d08" stroke-width="1.4"/>
    <rect x="${BOOK_X}" y="${n(y0)}" width="${BOOK_W}" height="${n(H)}" rx="2.2" fill="url(#lit)"/>
    <g stroke="#000000" stroke-width="0.8" opacity="0.13" fill="none">
      ${wear.join('\n      ')}
    </g>
    ${[hubTop, b0, b1, hubBot].map(hub).join('\n    ')}
    <rect x="${n(BOOK_X + 4)}" y="${tpA}" width="${BOOK_W - 8}" height="${n(tpB - tpA)}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.85"/>
    <rect x="${n(BOOK_X + 6)}" y="${n(tpA + 2.4)}" width="${BOOK_W - 12}" height="${n(tpB - tpA - 4.8)}" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.5"/>
    ${titleMarkup(title, cx, pc, panelLen)}
    <rect x="${BOOK_X}" y="${n(y0)}" width="${BOOK_W}" height="3" rx="1.4" fill="#000000" opacity="0.34"/>
    <rect x="${BOOK_X}" y="${n(SHELF_TOP - 3)}" width="${BOOK_W}" height="3" rx="1.4" fill="#000000" opacity="0.42"/>
  </g>

  <!-- 선반 조각 (좌우로 넘치게 그려 이웃 타일과 이어짐) -->
  <g filter="url(#js)">
    <path d="M${-BL} ${SHELF_TOP + 20} H${VB_W + BL} L${VB_W} ${VB_H} H0 Z" fill="#160d08" opacity="0.5"/>
    <rect x="${-BL}" y="${SHELF_TOP}" width="${VB_W + 2 * BL}" height="18" fill="#2c1c0f"/>
    <rect x="${-BL}" y="${SHELF_TOP}" width="${VB_W + 2 * BL}" height="2.6" fill="#4a3422" opacity="0.6"/>
    <rect x="${-BL}" y="${SHELF_TOP + 12}" width="${VB_W + 2 * BL}" height="4" fill="#000000" opacity="0.24"/>
    <path d="M${-BL} ${SHELF_TOP + 18.5} H${VB_W + BL}" stroke="#0c0603" stroke-width="1.6" opacity="0.75"/>
  </g>
</svg>
`;
}

// --- 실행 ---
const books = cfg.books ?? [];
if (existsSync(join(OUT, '_shelf.svg'))) rmSync(join(OUT, '_shelf.svg'));

books.forEach((b, i) => writeFileSync(join(OUT, `${b.slug}.svg`), spineSVG(b, i)));

const cap = R.caption ? `\n<div align="center"><sub>${esc(R.caption)}</sub></div>\n` : '';
const rows = books.map(b =>
  `<a href="${esc(b.url)}"><img src="assets/books/${b.slug}.svg" height="${SPINE_H}"></a>`
).join('');
const block =
`<!-- books:start -->${cap}
<div align="center">
${rows}
</div>
<!-- books:end -->`;

const readmePath = join(ROOT, 'README.md');
let md = readFileSync(readmePath, 'utf8');
const re = /<!-- books:start -->[\s\S]*?<!-- books:end -->/;
md = re.test(md) ? md.replace(re, block) : md.trimEnd() + `\n\n${block}\n`;
writeFileSync(readmePath, md);

console.log(`generated ${books.length} spines, README block updated`);
