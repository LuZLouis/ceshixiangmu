// 16 修途徽记。手写 SVG，木刻 / 套色印刷的感觉：
// 色块（A）故意错开 3px 压在墨线（I）下面，像两次印刷没对准。P 是纸色。
// emblemSVG(id, {ink, accent, paper}) 返回完整 <svg>，页面和海报（canvas）共用同一份。

const gear = (cx, cy, r, n) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    d += `<rect x="${(x - 4.5).toFixed(1)}" y="${(y - 4.5).toFixed(1)}" width="9" height="9" rx="1.5" transform="rotate(${(a * 180 / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return d;
};
const ticks = (cx, cy, r1, r2, n) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    d += `M${(cx + c * r1).toFixed(1)} ${(cy + s * r1).toFixed(1)}L${(cx + c * r2).toFixed(1)} ${(cy + s * r2).toFixed(1)}`;
  }
  return d;
};
const star5 = (cx, cy, R, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); }
  return pts.join(' ');
};

// 每个函数返回 [色块层, 墨线层]
export const DRAW = {
  sword: (I, A, P) => [
    `<circle cx="64" cy="56" r="36" fill="${A}"/>`,
    `<path d="M50 70L96 24" stroke="${I}" stroke-width="11" stroke-linecap="square"/>
     <path d="M56 64L90 30" stroke="${P}" stroke-width="2.5"/>
     <path d="M36 60L60 84" stroke="${I}" stroke-width="7" stroke-linecap="round"/>
     <path d="M47 73L30 90" stroke="${I}" stroke-width="7" stroke-linecap="round"/>
     <circle cx="26" cy="94" r="6" fill="${I}"/>
     <path d="M98 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${I}"/>`
  ],
  body: (I, A, P) => [
    `<path d="M14 64L30 40 46 52 60 22 74 52 90 40 106 64 88 66 100 92 70 78 60 104 50 78 20 92 32 66z" fill="${A}"/>`,
    `<rect x="34" y="36" width="52" height="46" rx="13" fill="${P}" stroke="${I}" stroke-width="5"/>
     <path d="M48 36v16M61 36v16M74 36v16" stroke="${I}" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M34 60h20q8 0 8 8" fill="none" stroke="${I}" stroke-width="4.5" stroke-linecap="round"/>
     <rect x="42" y="82" width="36" height="20" rx="3" fill="${I}"/>
     <path d="M42 90h36" stroke="${P}" stroke-width="2.5"/>`
  ],
  alchemy: (I, A, P) => [
    `<ellipse cx="60" cy="72" rx="40" ry="34" fill="${A}"/>`,
    `<circle cx="60" cy="80" r="23" fill="${P}" stroke="${I}" stroke-width="5"/>
     <circle cx="60" cy="46" r="14" fill="${P}" stroke="${I}" stroke-width="5"/>
     <rect x="54" y="22" width="12" height="11" rx="2" fill="${I}"/>
     <path d="M46 58q14 6 28 0" fill="none" stroke="${I}" stroke-width="4"/>
     <path d="M74 58q14 4 16 18M74 58q8 10 4 22" fill="none" stroke="${I}" stroke-width="3" stroke-linecap="round"/>
     <path d="M50 78q10-8 20 0" fill="none" stroke="${I}" stroke-width="3" stroke-linecap="round"/>`
  ],
  artifact: (I, A, P) => [
    `<circle cx="72" cy="72" r="30" fill="${A}"/>`,
    `<g fill="${I}">${gear(72, 72, 25, 9)}</g>
     <circle cx="72" cy="72" r="22" fill="${P}" stroke="${I}" stroke-width="5"/>
     <circle cx="72" cy="72" r="7" fill="${I}"/>
     <path d="M20 100L58 62" stroke="${I}" stroke-width="7" stroke-linecap="round"/>
     <rect x="38" y="18" width="20" height="40" rx="3" transform="rotate(45 48 38)" fill="${I}"/>
     <path d="M41 30l14 14" stroke="${P}" stroke-width="2.5"/>`
  ],
  talisman: (I, A, P) => [
    `<rect x="36" y="14" width="44" height="90" rx="2" fill="${A}"/>`,
    `<rect x="36" y="14" width="44" height="90" rx="2" fill="none" stroke="${I}" stroke-width="4.5"/>
     <path d="M46 28h24M58 28v12M46 46q12-6 24 0M50 56q8 6 16 0M58 52v34M48 72l20 6M48 86q10 8 20 0" fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
     <circle cx="58" cy="96" r="3.5" fill="${I}"/>
     <path d="M86 20l18-10" stroke="${I}" stroke-width="5" stroke-linecap="round"/>
     <path d="M84 21l-4 10 9-5z" fill="${I}"/>`
  ],
  array: (I, A, P) => [
    `<circle cx="60" cy="60" r="18" fill="${A}"/><path d="M60 14l13 14h-26z M60 106l13-14h-26z" fill="${A}"/>`,
    `<path d="M60 18L90 30 102 60 90 90 60 102 30 90 18 60 30 30Z" fill="none" stroke="${I}" stroke-width="4.5" stroke-linejoin="round"/>
     <path d="M60 18L60 102M18 60L102 60M30 30L90 90M90 30L30 90" stroke="${I}" stroke-width="2" stroke-dasharray="3 4"/>
     <circle cx="60" cy="60" r="18" fill="none" stroke="${I}" stroke-width="4.5"/>
     <g fill="${I}"><circle cx="60" cy="18" r="5"/><circle cx="90" cy="30" r="5"/><circle cx="102" cy="60" r="5"/><circle cx="90" cy="90" r="5"/><circle cx="60" cy="102" r="5"/><circle cx="30" cy="90" r="5"/><circle cx="18" cy="60" r="5"/><circle cx="30" cy="30" r="5"/></g>
     <circle cx="60" cy="60" r="7" fill="${I}"/>`
  ],
  beast: (I, A, P) => [
    `<path d="M32 42L44 20 56 40zM88 42L76 20 64 40z" fill="${A}"/><circle cx="60" cy="70" r="34" fill="${A}" opacity=".45"/>`,
    `<path d="M28 44L42 16 56 38H64L78 16 92 44 86 74 60 96 34 74Z" fill="${P}" stroke="${I}" stroke-width="5" stroke-linejoin="round"/>
     <path d="M34 74q10-10 26-8 16-2 26 8" fill="none" stroke="${I}" stroke-width="3.5"/>
     <path d="M42 56l10 4M78 56l-10 4" stroke="${I}" stroke-width="5" stroke-linecap="round"/>
     <path d="M55 78h10l-5 6z" fill="${I}"/>
     <path d="M98 76q10 4 10 16-6-6-14-6" fill="${I}"/>`
  ],
  music: (I, A, P) => [
    `<path d="M60 48C84 48 88 72 84 86 80 100 70 106 60 106S40 100 36 86C32 72 36 48 60 48Z" fill="${A}"/>`,
    `<path d="M60 48C84 48 88 72 84 86 80 100 70 106 60 106S40 100 36 86C32 72 36 48 60 48Z" fill="none" stroke="${I}" stroke-width="5"/>
     <rect x="55" y="12" width="10" height="40" rx="2" fill="${I}"/>
     <path d="M50 18h-8M50 28h-8M70 18h8M70 28h8" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
     <path d="M56 52v42M60 52v42M64 52v42" stroke="${I}" stroke-width="1.8"/>
     <rect x="48" y="90" width="24" height="5" rx="1" fill="${I}"/>
     <path d="M94 34q8 4 8 12M98 26q12 6 12 22" fill="none" stroke="${I}" stroke-width="3.5" stroke-linecap="round"/>`
  ],
  illusion: (I, A, P) => [
    `<path d="M60 60m-40 0a40 40 0 1 0 80 0a30 30 0 1 0-60 0a20 20 0 1 0 40 0" fill="none" stroke="${A}" stroke-width="10"/>`,
    `<path d="M18 54Q60 30 102 54Q98 80 76 78Q60 68 44 78Q22 80 18 54Z" fill="${I}"/>
     <ellipse cx="42" cy="58" rx="9" ry="6" fill="${P}"/><ellipse cx="78" cy="58" rx="9" ry="6" fill="${P}"/>
     <circle cx="44" cy="58" r="3" fill="${I}"/><circle cx="76" cy="58" r="3" fill="${I}"/>
     <path d="M100 18l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z M20 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${I}"/>`
  ],
  flora: (I, A, P) => [
    `<path d="M60 60C40 60 26 46 26 26 46 26 60 40 60 60Z M60 52C60 34 74 20 96 20 96 40 82 52 60 52Z" fill="${A}"/>`,
    `<path d="M60 60C40 60 26 46 26 26 46 26 60 40 60 60Z M60 52C60 34 74 20 96 20 96 40 82 52 60 52Z" fill="none" stroke="${I}" stroke-width="4.5" stroke-linejoin="round"/>
     <path d="M60 86V44M40 38l12 12M80 30l-14 14" stroke="${I}" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M34 80H86L80 106H40Z" fill="${I}"/>
     <path d="M30 80H90" stroke="${I}" stroke-width="7" stroke-linecap="round"/>
     <path d="M44 92h32" stroke="${P}" stroke-width="2.5"/>`
  ],
  puppet: (I, A, P) => [
    `<rect x="46" y="62" width="28" height="28" rx="4" fill="${A}"/><circle cx="60" cy="50" r="12" fill="${A}"/>`,
    `<path d="M28 18H92M60 10V26" stroke="${I}" stroke-width="6" stroke-linecap="round"/>
     <path d="M34 18V70M86 18V70M60 26V38M48 18V60M72 18V60" stroke="${I}" stroke-width="1.6" stroke-dasharray="2 3"/>
     <circle cx="60" cy="50" r="11" fill="${P}" stroke="${I}" stroke-width="4.5"/>
     <path d="M56 50h.1M64 50h.1" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
     <rect x="47" y="62" width="26" height="26" rx="4" fill="none" stroke="${I}" stroke-width="4.5"/>
     <path d="M47 66L34 72M73 66L86 72M53 88L48 106M67 88L72 106" stroke="${I}" stroke-width="5" stroke-linecap="round"/>
     <circle cx="60" cy="75" r="3" fill="${I}"/>`
  ],
  oracle: (I, A, P) => [
    `<path d="M60 22L68 60 60 98 52 60Z" fill="${A}"/><circle cx="60" cy="60" r="40" fill="${A}" opacity=".35"/>`,
    `<circle cx="60" cy="60" r="42" fill="none" stroke="${I}" stroke-width="5"/>
     <circle cx="60" cy="60" r="30" fill="none" stroke="${I}" stroke-width="2"/>
     <path d="${ticks(60, 60, 33, 39, 24)}" stroke="${I}" stroke-width="2.5"/>
     <path d="M60 24L67 60H53Z" fill="${I}"/>
     <path d="M53 60H67L60 96Z" fill="none" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
     <circle cx="60" cy="60" r="5" fill="${P}" stroke="${I}" stroke-width="3"/>
     <path d="M96 22l-8 8" stroke="${I}" stroke-width="3" stroke-linecap="round"/>`
  ],
  demonic: (I, A, P) => [
    `<path d="M38 64C18 56 14 28 30 12 28 32 40 46 52 54Z M82 64C102 56 106 28 90 12 92 32 80 46 68 54Z" fill="${A}"/>`,
    `<path d="M38 64C18 56 14 28 30 12 28 32 40 46 52 54Z M82 64C102 56 106 28 90 12 92 32 80 46 68 54Z" fill="none" stroke="${I}" stroke-width="4.5" stroke-linejoin="round"/>
     <circle cx="60" cy="76" r="26" fill="${I}"/>
     <path d="M44 70l12 4M76 70l-12 4" stroke="${P}" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M50 88q10 6 20 0" fill="none" stroke="${P}" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M66 89l2 5 2-5" fill="${P}"/>`
  ],
  soul: (I, A, P) => [
    `<rect x="36" y="30" width="48" height="58" rx="18" fill="${A}"/>`,
    `<path d="M60 6V20M44 20H76" stroke="${I}" stroke-width="5" stroke-linecap="round"/>
     <rect x="36" y="26" width="48" height="62" rx="18" fill="none" stroke="${I}" stroke-width="5"/>
     <path d="M48 28v58M72 28v58" stroke="${I}" stroke-width="2"/>
     <path d="M60 46c8 8 8 18 0 22-8-4-8-14 0-22z" fill="${I}"/>
     <path d="M46 92H74M60 92V112M54 112h12" stroke="${I}" stroke-width="5" stroke-linecap="round"/>`
  ],
  vow: (I, A, P) => [
    `<path d="M40 24c-16-10-26 4-18 12M80 24c16-10 26 4 18 12" fill="none" stroke="${A}" stroke-width="10" stroke-linecap="round"/><path d="M34 88C36 64 40 40 60 40S84 64 86 88Z" fill="${A}"/>`,
    `<path d="M32 88C34 62 40 38 60 38S86 62 88 88Z" fill="none" stroke="${I}" stroke-width="5" stroke-linejoin="round"/>
     <path d="M26 88H94" stroke="${I}" stroke-width="7" stroke-linecap="round"/>
     <circle cx="60" cy="98" r="7" fill="${I}"/>
     <path d="M60 38V22" stroke="${I}" stroke-width="5"/>
     <circle cx="60" cy="18" r="6" fill="none" stroke="${I}" stroke-width="4"/>
     <path d="M46 62q14-6 28 0" fill="none" stroke="${I}" stroke-width="3"/>`
  ],
  star: (I, A, P) => [
    `<polygon points="${star5(78, 46, 22, 9)}" fill="${A}"/>`,
    `<path d="M58 22A40 40 0 1 0 98 72 32 32 0 1 1 58 22Z" fill="${I}"/>
     <polygon points="${star5(78, 46, 22, 9)}" fill="none" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>
     <circle cx="100" cy="20" r="3" fill="${I}"/><circle cx="20" cy="28" r="2.5" fill="${I}"/><circle cx="104" cy="98" r="2.5" fill="${I}"/>
     <path d="M10 70Q60 112 110 84" fill="none" stroke="${I}" stroke-width="2" stroke-dasharray="3 4"/>`
  ]
};

export const EMBLEMS = Object.fromEntries(Object.entries(DRAW).map(([id, f]) => [id, f('#000', '#000', '#fff').join('')]));

export function emblemSVG(id, { ink = '#1d1a16', accent = '#b8482e', paper = '#f3ecdc', size = 120 } = {}) {
  const [a, i] = (DRAW[id] || DRAW.sword)(ink, accent, paper);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true"><g transform="translate(3 3)">${a}</g><g fill="none">${i}</g></svg>`;
}
