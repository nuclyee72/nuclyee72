#!/usr/bin/env node
// books.config.json -> assets/books/<slug>.svg  +  assets/books/_props.svg  +  README books 블록
//
// 가로로 긴 붙박이 책장 칸 하나. 왼쪽부터 책 3권(각각 클릭 링크), 오른쪽 남는 칸에 가스등·플라스크·유리병.
// 각 조각 SVG 의 틀(위 가로대·아래 선반·안쪽 배경)이 좌우로 이어져 하나의 케이스가 된다.
// 무의존성.  실행:  node tools/build-books.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'books');
mkdirSync(OUT, { recursive: true });

const cfg = JSON.parse(readFileSync(join(ROOT, 'tools', 'books.config.json'), 'utf8'));
const R = cfg.render ?? {};
const IMG_H = R.spineHeight ?? 240;
const CASE_W = R.caseWidth ?? 760;
const ROT = (R.titleDirection ?? 'down') === 'up' ? -90 : 90;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (x, d = 2) => Number(Number(x).toFixed(d));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; }

// --- 케이스 치수 ---
const VB_H = 232;
const CASE_TOP = 4;
const RAIL_H = 13;
const SHELF_TOP = 204;                 // 물건이 놓이는 선
const SHELF_FRONT = 18;
const INTERIOR = SHELF_TOP - (CASE_TOP + RAIL_H);   // 책이 들어갈 세로 여유
const BASE_Y = SHELF_TOP + SHELF_FRONT; // 230
const SIDE_W = 13;
const INNER_W = 52;                     // 책 한 권 타일 폭
const BOOK_W = 46;
const BOOK_INSET = (INNER_W - BOOK_W) / 2;
const BL = 12;

const BROWN = ['#4a3122', '#38291b', '#573c27', '#2f2318', '#5a3524', '#43301f'];
const GOLD = '#e8c88a';
const CREAM = '#cabf9c';
const WOOD = '#2c1c0f', WOOD_D = '#22150e', WOOD_HI = '#4a3422', LINE = '#0c0603';
const STYLES = ['banded', 'label', 'ruled', 'plain'];

// 우글거림 필터 (scene 의 wigObj 계열과 비슷하게 강하게)
function wig(id, seed, scale, freq = 0.028, dur = 0.42) {
  const a = seed % 13, b = (seed >> 4) % 17 + 2, c = (seed >> 8) % 11 + 4, d = (seed >> 12) % 19 + 1;
  return `<filter id="${id}" x="-28%" y="-14%" width="156%" height="128%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${a}" result="n">
        <animate attributeName="seed" values="${a};${b};${c};${d}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
}

// --- 책장 틀 조각 ---
function frame(L, Rr, TW, { left = false, right = false } = {}) {
  const s = [];
  s.push(`<rect x="${L}" y="${CASE_TOP}" width="${n(Rr - L)}" height="${RAIL_H}" fill="${WOOD}"/>`);
  s.push(`<rect x="${L}" y="${CASE_TOP}" width="${n(Rr - L)}" height="2.4" fill="${WOOD_HI}" opacity="0.5"/>`);
  s.push(`<rect x="${L}" y="${n(CASE_TOP + RAIL_H - 3)}" width="${n(Rr - L)}" height="3" fill="#000000" opacity="0.28"/>`);
  s.push(`<path d="M${L} ${n(CASE_TOP + RAIL_H - 0.5)} H${n(Rr)}" stroke="${LINE}" stroke-width="1.3" opacity="0.7"/>`);
  s.push(`<path d="M${L} ${BASE_Y} H${n(Rr)} L${n(TW - 3)} ${n(VB_H - 3)} H3 Z" fill="#140b06" opacity="0.32"/>`);
  s.push(`<rect x="${L}" y="${SHELF_TOP}" width="${n(Rr - L)}" height="${SHELF_FRONT}" fill="${WOOD}"/>`);
  s.push(`<rect x="${L}" y="${SHELF_TOP}" width="${n(Rr - L)}" height="2.6" fill="${WOOD_HI}" opacity="0.6"/>`);
  s.push(`<rect x="${L}" y="${n(BASE_Y - 5)}" width="${n(Rr - L)}" height="4" fill="#000000" opacity="0.24"/>`);
  s.push(`<path d="M${L} ${n(BASE_Y - 0.5)} H${n(Rr)}" stroke="${LINE}" stroke-width="1.6" opacity="0.75"/>`);
  const panel = x0 => `<rect x="${n(x0)}" y="${CASE_TOP}" width="${n(SIDE_W + BL)}" height="${n(BASE_Y - CASE_TOP)}" fill="${WOOD_D}"/>
    <rect x="${n(x0)}" y="${CASE_TOP}" width="2.6" height="${n(BASE_Y - CASE_TOP)}" fill="${WOOD_HI}" opacity="0.4"/>
    <rect x="${n(x0 + SIDE_W - 1.6)}" y="${CASE_TOP}" width="2" height="${n(BASE_Y - CASE_TOP)}" fill="#000000" opacity="0.32"/>`;
  if (left) s.push(panel(L));
  if (right) s.push(panel(TW - SIDE_W));
  return s.join('\n    ');
}
function recess(L, Rr) {
  return `<rect x="${L}" y="${CASE_TOP}" width="${n(Rr - L)}" height="${n(BASE_Y - CASE_TOP)}" fill="#1d120b"/>
    <rect x="${L}" y="${CASE_TOP}" width="${n(Rr - L)}" height="13" fill="#000000" opacity="0.4"/>
    <rect x="${L}" y="${n(BASE_Y - 16)}" width="${n(Rr - L)}" height="16" fill="#000000" opacity="0.28"/>`;
}

// --- 책등 그림 (style 별로 다르게, 심플하게) ---
function titleText(title, cx, mid, run, fs0) {
  const words = title.split(/\s+/).filter(Boolean);
  const font = `font-family="Georgia,'Times New Roman','Nanum Myeongjo',serif" font-weight="600"`;
  const line = (w, fs, dx, fill) =>
    `<text transform="translate(${n(cx + dx)} ${n(mid + fs * 0.30)}) rotate(${ROT})" text-anchor="middle" dominant-baseline="central"
      ${font} font-size="${n(fs)}" letter-spacing="0.5" fill="${fill}">${esc(w)}</text>`;
  const fill = GOLD;
  if (words.length < 2 || title.length < 8) {
    const fs = clamp(fs0 ?? (run - 10) / (title.length * 0.72), 6.5, 10);
    return line(title, fs, 0, fill);
  }
  const maxLen = Math.max(...words.map(w => w.length));
  const fs = clamp(fs0 ?? (run - 12) / (maxLen * 0.72), 6.5, 10.5);
  const gap = fs + 2;
  const spread = (words.length - 1) * gap;
  return words.map((w, i) => line(w, fs, n(spread / 2 - i * gap), fill)).join('\n    ');
}

function bookArt(book, i, x0) {
  const seed = hash(book.slug);
  const rand = rng(seed);
  const cover = book.cover || BROWN[i % BROWN.length];
  const style = book.style || STYLES[i % STYLES.length];
  const title = (book.title || book.slug).toUpperCase();
  const H = clamp(book.height ?? Math.round(150 + rand() * 40), 120, INTERIOR - 2);
  const y0 = SHELF_TOP - H;
  const bx = x0 + BOOK_INSET;
  const cx = bx + BOOK_W / 2;
  const tilt = book.tilt ?? n(rand() * 1.4 - 0.7, 2);
  const run = H - 24;                         // 제목이 쓰일 세로 길이

  const g = [];
  g.push(`<rect x="${n(bx)}" y="${n(y0)}" width="${BOOK_W}" height="${n(H)}" rx="2" fill="${cover}" stroke="#160d08" stroke-width="1.4"/>`);
  g.push(`<rect x="${n(bx)}" y="${n(y0)}" width="${BOOK_W}" height="${n(H)}" rx="2" fill="url(#lit)"/>`);
  g.push(`<rect x="${n(bx)}" y="${n(y0)}" width="${BOOK_W}" height="2.6" fill="#000000" opacity="0.32"/>`);
  const band = yy => `<rect x="${n(bx - 1)}" y="${n(yy - 2)}" width="${BOOK_W + 2}" height="4" fill="#000000" opacity="0.28"/><rect x="${n(bx - 1)}" y="${n(yy - 2)}" width="${BOOK_W + 2}" height="1.1" fill="#ffffff" opacity="0.11"/>`;

  if (style === 'banded') {
    const ys = [y0 + 16, y0 + H * 0.5, y0 + H - 18];
    g.push(ys.map(band).join(''));
    g.push(titleText(title, cx, y0 + H * 0.5, H * 0.5 - 22));
  } else if (style === 'label') {
    const lh = clamp(H * 0.5, 70, 108), ly = y0 + H * 0.42;
    g.push(`<rect x="${n(bx + 5)}" y="${n(ly - lh / 2)}" width="${BOOK_W - 10}" height="${n(lh)}" rx="1" fill="${CREAM}" opacity="0.9" stroke="#5a4a30" stroke-width="0.8"/>`);
    g.push(band(y0 + H - 16));
    g.push(titleText(title, cx, ly, lh - 12).replaceAll(GOLD, '#2c2016'));
  } else if (style === 'ruled') {
    const ph = clamp(H * 0.52, 74, 116), py = y0 + H * 0.44;
    g.push(`<rect x="${n(bx + 5)}" y="${n(py - ph / 2)}" width="${BOOK_W - 10}" height="${n(ph)}" fill="none" stroke="${book.accent || '#caa63a'}" stroke-width="1" opacity="0.8"/>`);
    g.push(band(y0 + 14));
    g.push(titleText(title, cx, py, ph - 14));
  } else { // plain
    g.push(`<path d="M${n(bx + 4)} ${n(y0 + 12)} h${BOOK_W - 8} M${n(bx + 4)} ${n(SHELF_TOP - 12)} h${BOOK_W - 8}" stroke="${GOLD}" stroke-width="0.8" opacity="0.5"/>`);
    g.push(titleText(title, cx, y0 + H * 0.5, H - 40));
  }
  // 낡은 결 한 줄
  g.push(`<path d="M${n(bx + 6 + rand() * 30)} ${n(y0 + 8)} V${n(SHELF_TOP - 8)}" stroke="#000000" stroke-width="0.7" opacity="0.12" fill="none"/>`);

  return `<g transform="rotate(${tilt} ${n(cx)} ${SHELF_TOP})">
    ${g.join('\n    ')}
  </g>`;
}

// --- 오른쪽 칸 소품 (scene 스타일, 어두운 배경에서도 보이게) ---
const shadow = (w) => `<ellipse cx="0" cy="1.5" rx="${w}" ry="3" fill="#000000" opacity="0.32"/>`;

function gasLamp(x, y) {
  return `<g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="-70" rx="52" ry="64" fill="url(#glow)"/>
      ${shadow(19)}
      <g stroke="#140b06" stroke-width="1.8">
        <ellipse cx="0" cy="0" rx="18" ry="5.6" fill="#3a2a1e"/>
        <path d="M-14 0 L14 0 L9 -16 L-9 -16 Z" fill="#43301f"/>
        <rect x="-4.5" y="-58" width="9" height="42" fill="#8a6c30"/>
        <rect x="-8" y="-40" width="16" height="24" fill="#b98a34"/>
        <path d="M-15 -58 L15 -58 L11 -66 L-11 -66 Z" fill="#b98a34"/>
        <path d="M-11 -66 Q-16 -100 -6 -120 L6 -120 Q16 -100 11 -66 Z" fill="#e6dcc2" fill-opacity="0.22" stroke="#6b6455" stroke-width="1.8"/>
        <ellipse cx="0" cy="-86" rx="5.4" ry="12" fill="#ffbe55"/>
        <ellipse cx="0" cy="-89" rx="2.4" ry="7" fill="#fff0c8"/>
        <path d="M-6 -70 Q-11 -98 -5 -116" stroke="#fff3d8" stroke-width="1.3" opacity="0.4" fill="none"/>
        <path d="M-13 -122 L13 -122 L10 -114 L-13 -114 Z" fill="#9a7534"/>
      </g>
    </g>`;
}
function erlenmeyer(x, y, h = 64) {
  return `<g transform="translate(${x} ${y})">
      ${shadow(18)}
      <path d="M-19 0 L19 0 L6.5 ${n(-h + 20)} L6.5 ${n(-h)} L-6.5 ${n(-h)} L-6.5 ${n(-h + 20)} Z" fill="#cfc8b0" fill-opacity="0.3" stroke="#6a6355" stroke-width="1.8"/>
      <path d="M-14 -2 L-8 ${n(-h + 24)} L8 ${n(-h + 24)} L14 -2 Z" fill="#3a2712" opacity="0.8"/>
      <rect x="-8" y="${n(-h - 9)}" width="16" height="11" rx="2" fill="#7a5330" stroke="#160d08" stroke-width="1.5"/>
      <path d="M-12 -5 L-6.5 ${n(-h + 24)} L-6.5 ${n(-h + 2)}" stroke="#fff3d8" stroke-width="1.2" opacity="0.4" fill="none"/>
    </g>`;
}
function bottle(x, y, h = 78, tint = '#cbc7b4', liq = '#3a1a1a') {
  return `<g transform="translate(${x} ${y})">
      ${shadow(13)}
      <path d="M-12 0 L-12 ${n(-h + 30)} Q-12 ${n(-h + 15)} -5 ${n(-h + 10)} L-5 ${n(-h)} L6 ${n(-h)} L6 ${n(-h + 10)} Q13 ${n(-h + 15)} 13 ${n(-h + 30)} L13 0 Z" fill="${tint}" fill-opacity="0.28" stroke="#6a6355" stroke-width="1.8"/>
      <path d="M-11 -1 L-11 -24 Q0 -29 12 -24 L12 -1 Z" fill="${liq}" opacity="0.78"/>
      <rect x="-7" y="${n(-h - 8)}" width="14" height="10" rx="2" fill="#7a5330" stroke="#160d08" stroke-width="1.5"/>
      <path d="M-9 -5 L-9 ${n(-h + 28)}" stroke="#fff3d8" stroke-width="1.6" opacity="0.3"/>
    </g>`;
}
function jar(x, y) {
  return `<g transform="translate(${x} ${y})">
      ${shadow(20)}
      <g stroke="#140b06" stroke-width="1.9">
        <path d="M-19 0 Q-33 0 -33 -30 Q-33 -50 -21 -58 L-21 -68 L20 -68 L20 -58 Q32 -50 32 -30 Q32 0 14 0 Z" fill="#4a3a2c"/>
        <path d="M-23 -68 L21 -68 L15 -79 L-19 -79 Z" fill="#382b20"/>
        <ellipse cx="-1" cy="-79" rx="19" ry="4.4" fill="#54432f"/>
      </g>
      <path d="M-16 -10 Q-22 -38 -14 -54" stroke="#6f5a44" stroke-width="2.6" opacity="0.5" fill="none"/>
    </g>`;
}
function flatBooks(x, y) {
  const c = ['#463020', '#38281b', '#523a26'];
  const w = [52, 44, 38], hh = [14, 13, 15];
  let yy = 0, out = shadow(30);
  for (let k = 0; k < 3; k++) {
    const off = (k % 2 ? 4 : -3);
    out += `<rect x="${n(-w[k] / 2 + off)}" y="${n(yy - hh[k])}" width="${w[k]}" height="${hh[k]}" rx="1.5" fill="${c[k]}" stroke="#160d08" stroke-width="1.3"/>
      <rect x="${n(-w[k] / 2 + off + 2)}" y="${n(yy - hh[k] + 3)}" width="${w[k] - 4}" height="2.4" fill="#caa63a" opacity="0.5"/>`;
    yy -= hh[k];
  }
  return `<g transform="translate(${x} ${y})">${out}</g>`;
}
function candlestick(x, y) {
  return `<g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="-96" rx="16" ry="20" fill="url(#glow)"/>
      ${shadow(11)}
      <g stroke="#140b06" stroke-width="1.6">
        <ellipse cx="0" cy="0" rx="10" ry="3.4" fill="#8a6a28"/>
        <path d="M-4 0 L-3 -46 L3 -46 L4 0 Z" fill="#9a7a30"/>
        <ellipse cx="0" cy="-46" rx="7" ry="2.6" fill="#8a6a28"/>
        <rect x="-3.4" y="-78" width="6.8" height="32" fill="#e6d8b8"/>
      </g>
      <path d="M0 -78 q-3 -5 0 -11 q3 6 0 11z" fill="#ffbe55"/>
      <path d="M0 -80 q-1.4 -2.6 0 -6 q1.4 3 0 6z" fill="#fff0c8"/>
    </g>`;
}

function propsTile(propsW) {
  const TW = propsW + SIDE_W;
  const L = -BL, Rr = TW + BL;
  const seed = hash('props');
  const y = SHELF_TOP - 2;

  // 왼→오 순서대로 [함수, 폭] · 사이 간격은 남는 폭을 weight 로 분배 → 항상 겹치지 않고 꽉 참
  const seq = [
    [x => jar(x, y), 66],
    [x => erlenmeyer(x, y, 78), 40],
    [x => candlestick(x, y), 24],
    [x => bottle(x, y, 108, '#bfc4b6', '#241a12'), 28],
    [x => bottle(x, y, 66, '#cbc7b4', '#3c1616'), 28],
    [x => bottle(x, y, 90, '#c9c6b2', '#2c1810'), 28],
    [x => bottle(x, y, 52, '#c6c3b0', '#2a1a12'), 26],
  ];
  const gapWeight = [1.1, 0.8, 1.6, 0.55, 1.5, 0.7];   // seq.length-1 개
  const margin = 4;
  const objW = seq.reduce((a, s) => a + s[1], 0);
  const free = Math.max(0, propsW - margin * 2 - objW);
  const gwSum = gapWeight.reduce((a, b) => a + b, 0);
  let cur = margin;
  const objs = seq.map(([fn, w], i) => {
    const cx = cur + w / 2;
    cur += w + (i < gapWeight.length ? free * gapWeight[i] / gwSum : 0);
    return fn(n(cx));
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(TW)} ${VB_H}" width="${n(TW)}" height="${VB_H}" role="img" aria-label="항아리·플라스크·유리병이 놓인 선반">
  <defs>
    ${wig('jf', seed, 3.2, 0.022, 0.44)}
    ${wig('jo', seed ^ 0x9e37, 4, 0.03, 0.42)}
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffca78" stop-opacity="0.55"/>
      <stop offset="0.55" stop-color="#ff8a2c" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#ff8a2c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#3a2413" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <g filter="url(#jf)">
    ${recess(L, Rr)}
    <rect x="${L}" y="${n(SHELF_TOP - 40)}" width="${n(Rr - L)}" height="40" fill="url(#floor)"/>
  </g>
  <g filter="url(#jo)">
    ${objs}
  </g>
  <g filter="url(#jf)">
    ${frame(L, Rr, TW, { right: true })}
  </g>
</svg>
`;
}

// --- 책 타일 ---
function bookTile(book, i, isFirst) {
  const seed = hash(book.slug);
  const PL = isFirst ? SIDE_W : 0;
  const TW = INNER_W + PL;
  const L = -BL, Rr = TW + BL;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TW} ${VB_H}" width="${TW}" height="${VB_H}" role="img" aria-label="${esc((book.title || book.slug))}">
  <defs>
    ${wig('jf', seed, 3, 0.022, 0.44)}
    ${wig('jb', seed ^ 0x5bd1, 4.2, 0.028, 0.42)}
    <linearGradient id="lit" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.09"/>
      <stop offset="0.16" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.82" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.32"/>
    </linearGradient>
  </defs>
  <g filter="url(#jf)">${recess(L, Rr)}</g>
  <g filter="url(#jb)">
    ${bookArt(book, i, PL)}
  </g>
  <g filter="url(#jf)">
    ${frame(L, Rr, TW, { left: isFirst })}
  </g>
</svg>
`;
}

// --- 실행 ---
const books = cfg.books ?? [];
for (const f of ['_shelf.svg', '_props.svg']) if (existsSync(join(OUT, f))) rmSync(join(OUT, f));

books.forEach((b, i) => writeFileSync(join(OUT, `${b.slug}.svg`), bookTile(b, i, i === 0)));

const booksW = SIDE_W + books.length * INNER_W;
const propsW = Math.max(160, CASE_W - booksW - SIDE_W);
writeFileSync(join(OUT, '_props.svg'), propsTile(propsW));

const cap = R.caption ? `\n<div align="center"><sub>${esc(R.caption)}</sub></div>\n` : '';
const rows = books.map(b => `<a href="${esc(b.url)}"><img src="assets/books/${b.slug}.svg" height="${IMG_H}"></a>`).join('')
  + `<img src="assets/books/_props.svg" height="${IMG_H}">`;
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

console.log(`generated ${books.length} book tiles + _props.svg (case ${CASE_W}px), README updated`);
