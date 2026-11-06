// 人物形象：用部件拼出来的版画风 Q 版人物。
// figureSVG({ hair, style, path, mode, size })
//   hair  0 短发 / 1 马尾 / 2 长发 / 3 丸子头（开局自己选）
//   style 人间底色 id：决定表情和「从人间带过来的东西」
//   path  修途 id：决定仙袍颜色和手里的法器（mode='xian' 时）
//   mode  'real' 打工人形象 / 'xian' 修仙形象
import { DRAW } from './emblems.js';

const INK = '#1d1a16', PAPER = '#fbf6ea', SKIN = '#f5d9bf', HAIR = '#2b231d', BLUSH = '#ee9f86', GOLD = '#c9a43a';
const SW = 3.5;

export const HAIRS = [
  { id: 0, name: '短发' }, { id: 1, name: '马尾' }, { id: 2, name: '长发' }, { id: 3, name: '丸子头' }
];

// ---------- 头发 ----------
function hairBack(h) {
  if (h === 2) return `<path d="M52 84Q42 150 56 200Q100 214 144 200Q158 150 148 84Z" fill="${HAIR}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  if (h === 1) return `<path d="M128 56Q176 52 168 112Q162 146 178 176Q146 164 140 126Q136 98 120 74Z" fill="${HAIR}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  if (h === 3) return `<circle cx="100" cy="40" r="19" fill="${HAIR}" stroke="${INK}" stroke-width="${SW}"/>`;
  return '';
}
function hairFront(h, mode) {
  const bangs = `<path d="M53 96Q48 46 100 42Q152 46 147 96Q142 76 128 68Q120 84 100 76Q82 86 70 70Q58 78 53 96Z" fill="${HAIR}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  let extra = '';
  if (h === 2) extra = `<path d="M54 94Q50 120 56 140M146 94Q150 120 144 140" stroke="${HAIR}" stroke-width="8" stroke-linecap="round"/>`;
  if (h === 1) extra = mode === 'xian'
    ? `<path d="M124 56l12-6 2 12z" fill="#c23a22" stroke="${INK}" stroke-width="2"/>`
    : `<circle cx="128" cy="58" r="5" fill="#c23a22" stroke="${INK}" stroke-width="2"/>`;
  if (h === 3 && mode === 'xian') extra = `<path d="M76 34L126 46" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/><circle cx="76" cy="34" r="4.5" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`;
  if (h === 0 && mode === 'xian') extra = `<path d="M88 46L90 28H110L112 46Z" fill="${GOLD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M80 34L120 34" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  if (h === 2 && mode === 'xian') extra += `<path d="M66 54Q100 36 134 54" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="45" r="5" fill="#c23a22" stroke="${INK}" stroke-width="2"/>`;
  return bangs + extra;
}

// ---------- 脸 ----------
const eye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="5.6" fill="${INK}"/><circle cx="${x + 1.6}" cy="${y - 2}" r="1.6" fill="#fff"/>`;
const blush = `<ellipse cx="72" cy="110" rx="7" ry="4" fill="${BLUSH}" opacity=".75"/><ellipse cx="128" cy="110" rx="7" ry="4" fill="${BLUSH}" opacity=".75"/>`;
const line = (d, w = 3) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const FACES = {
  zheng: eye(82, 98) + eye(118, 98) + line('M72 86L90 90M128 86L110 90', 3.2) + `<path d="M74 107q8 4 16 0M110 107q8 4 16 0" stroke="#8b7a8f" stroke-width="2.5" fill="none" stroke-linecap="round"/>` + line('M93 116h14'),
  xiao: line('M74 98h16M110 98h16', 3) + `<circle cx="84" cy="101" r="3" fill="${INK}"/><circle cx="120" cy="101" r="3" fill="${INK}"/>` + line('M92 115q8 5 16-2') + blush,
  hu: eye(82, 98) + eye(118, 98) + line('M76 88q6-4 12 0M112 88q6-4 12 0', 2.6) + line('M92 113q8 7 16 0') + blush,
  zhen: eye(82, 99) + eye(118, 99) + line('M74 90q8-2 14 1M111 86q8-5 15-1', 3) + line('M93 117q7-3 14 0'),
  qi: eye(82, 98) + line('M112 94l10 4-10 4', 3.2) + line('M90 112q10 10 20 0') + `<path d="M90 112q10 10 20 0z" fill="${INK}"/>` + blush,
  yuan: eye(82, 99) + eye(118, 99) + line('M72 88L90 93M128 88L110 93', 3.6) + `<ellipse cx="100" cy="116" rx="5" ry="4" fill="${INK}"/>`,
  sui: line('M74 98q8 6 16 0M110 98q8 6 16 0', 3.2) + line('M94 113q6 5 12 0') + blush,
  cang: line('M93 115q8 3 16-3', 3)
};

// ---------- 从人间带过来的东西 ----------
function relic(style, mode, color) {
  switch (style) {
    case 'zheng': return `<path d="M88 134L96 168M112 134L104 168" stroke="#2f5fa6" stroke-width="3"/><rect x="89" y="166" width="22" height="28" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.6"/><rect x="89" y="166" width="22" height="7" fill="#2f5fa6"/><circle cx="100" cy="182" r="4" fill="#bbb"/>`;
    case 'xiao': return `<path d="M72 132Q100 152 128 132" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="62" y="122" width="14" height="20" rx="6" fill="#e86f4f" stroke="${INK}" stroke-width="2.6"/><rect x="124" y="122" width="14" height="20" rx="6" fill="#e86f4f" stroke="${INK}" stroke-width="2.6"/>`;
    case 'hu': return `<path d="M80 140L132 196" stroke="#c2a874" stroke-width="5"/><path d="M118 186h30l4 34h-38z" fill="#e6d3a8" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M126 198h14M133 191v14" stroke="#c23a22" stroke-width="3"/>`;
    case 'zhen': return `<rect x="70" y="89" width="24" height="19" rx="5" fill="rgba(255,255,255,.25)" stroke="${INK}" stroke-width="3"/><rect x="106" y="89" width="24" height="19" rx="5" fill="rgba(255,255,255,.25)" stroke="${INK}" stroke-width="3"/>` + line('M94 96h12M70 94l-14-4M130 94l14-4', 2.6);
    case 'qi': return `<path d="M84 116h32l-3 14q-13 6-26 0z" fill="#a9cbe0" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` + line('M84 118L58 104M116 118L142 104', 1.8) + line('M88 122h24', 1.5);
    case 'yuan': return `<path d="M30 190h20l-3 32h-14z" fill="rgba(255,255,255,.7)" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M33 206h14l-1 14h-12z" fill="#5a3a25"/><path d="M44 190l6-16" stroke="#3d7a5a" stroke-width="3.5" stroke-linecap="round"/><path d="M28 190h24" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    case 'sui': return `<path d="M56 70Q100 56 144 70" fill="none" stroke="#7a6fa8" stroke-width="5"/><path d="M68 58q14-10 28 0v10q-14 6-28 0zM104 58q14-10 28 0v10q-14 6-28 0z" fill="#b6a9e0" stroke="${INK}" stroke-width="2.6"/>` + line('M74 64q8 4 16 0M110 64q8 4 16 0', 2);
    case 'cang': return `<path d="M66 92h30q0 16-14 16t-16-16zM104 92h30q-2 16-16 16t-14-16z" fill="${INK}"/>` + line('M96 94h8M66 92l-12-3M134 92l12-3', 3) + `<path d="M72 96l6 0" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  }
  return '';
}

// ---------- 身体 ----------
function officeBody(styleColor) {
  return `
  <path d="M70 230L98 230 96 254 74 254Z M102 230L130 230 126 254 104 254Z" fill="#3a3a46" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
  <ellipse cx="84" cy="256" rx="13" ry="5" fill="${INK}"/><ellipse cx="116" cy="256" rx="13" ry="5" fill="${INK}"/>
  <path d="M72 140L128 140 136 232 64 232Z" fill="#fff" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
  <path d="M72 142L58 206 70 210 82 166Z M128 142L142 206 130 210 118 166Z" fill="#fff" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
  <circle cx="63" cy="212" r="8" fill="${SKIN}" stroke="${INK}" stroke-width="3"/><circle cx="137" cy="212" r="8" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M86 140L100 156 114 140" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M96 152L104 152 106 196 100 204 94 196Z" fill="${styleColor}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M64 224h72" stroke="${INK}" stroke-width="3"/>`;
}
function robeBody(color) {
  return `
  <ellipse cx="84" cy="256" rx="13" ry="5" fill="${INK}"/><ellipse cx="116" cy="256" rx="13" ry="5" fill="${INK}"/>
  <path d="M74 138L126 138 150 252 50 252Z" fill="${color}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
  <path d="M62 200L74 252M138 200L126 252" stroke="${INK}" stroke-width="2" opacity=".35"/>
  <path d="M84 138L116 138 100 172Z" fill="${PAPER}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M84 138L110 178M116 138L100 160" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M84 138L110 178" stroke="${PAPER}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
  <path d="M66 182H134L136 196H64Z" fill="${INK}"/>
  <path d="M104 196l-6 26M110 196l4 24" stroke="#c23a22" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="106" cy="194" r="4.5" fill="#c23a22" stroke="${INK}" stroke-width="2"/>
  <path d="M76 140Q52 160 34 214L60 224Q66 186 84 166Z M124 140Q148 160 166 214L140 224Q134 186 116 166Z" fill="${color}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
  <path d="M36 210L60 220M164 210L140 220" stroke="${PAPER}" stroke-width="4"/>
  <circle cx="46" cy="224" r="8.5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/><circle cx="154" cy="224" r="8.5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
}
function heldItem(path, color) {
  const [a, i] = (DRAW[path] || DRAW.sword)(INK, color, PAPER);
  return `<svg x="138" y="160" width="74" height="74" viewBox="0 0 120 120" overflow="visible"><g transform="translate(3 3)">${a}</g><g fill="none">${i}</g></svg>`;
}

// 每条流派一个辨识度细节：back 画在身体后面，head 画在头发上，over 画在最上层
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
function flourish(path, c) {
  const f = { back: '', head: '', over: '' };
  switch (path) {
    case 'body': f.over = `<path d="M30 206l24 8M32 214l22 8M146 214l22-8M146 222l22-8" stroke="${PAPER}" stroke-width="3.5"/>`; break;
    case 'alchemy': f.over = `<circle cx="70" cy="214" r="8" fill="#e6c27a" ${S}/><circle cx="70" cy="202" r="5.5" fill="#e6c27a" ${S}/>`; break;
    case 'artifact': f.head = `<path d="M54 70Q100 52 146 70" fill="none" stroke="#6b4a2a" stroke-width="7"/><circle cx="82" cy="62" r="11" fill="#9fc7d8" ${S}/><circle cx="118" cy="62" r="11" fill="#9fc7d8" ${S}/>`; break;
    case 'talisman': f.over = `<path d="M66 150l12-4 6 22-12 4z" fill="#e8c35a" ${S}/><path d="M71 155l4 9" stroke="#c23a22" stroke-width="2"/><path d="M118 230l14-2 2 20-14 2z" fill="#e8c35a" ${S}/>`; break;
    case 'array': f.over = [[18, 120], [182, 120], [12, 170], [188, 170], [30, 74], [170, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" ${S}/>`).join(''); break;
    case 'beast': f.back = `<path d="M136 236Q190 230 184 184Q172 210 140 214Z" fill="#e8a25a" ${S}/><path d="M178 196q8 6 6 -12" fill="${PAPER}"/>`;
      f.head = `<path d="M58 66L62 30 86 52Z M142 66L138 30 114 52Z" fill="#e8a25a" ${S}/><path d="M64 56L65 40 77 51Z M136 56L135 40 123 51Z" fill="${PAPER}"/>`; break;
    case 'music': f.over = `<path d="M24 96v-20l12-3v20" ${S} fill="none"/><circle cx="21" cy="97" r="4" fill="${INK}"/><circle cx="33" cy="94" r="4" fill="${INK}"/><path d="M176 70v-18" ${S}/><circle cx="173" cy="71" r="4" fill="${INK}"/>`; break;
    case 'illusion': f.over = `<path d="M26 80l3 7 7 3-7 3-3 7-3-7-7-3 7-3z M176 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M164 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${c}" stroke="${INK}" stroke-width="1.5"/>`; break;
    case 'flora': f.head = `<path d="M100 44V24" ${S}/><path d="M100 30C88 30 82 22 82 14 94 14 100 20 100 30ZM100 26C100 16 108 10 120 10 120 20 112 26 100 26Z" fill="#7fb069" ${S}/>`; break;
    case 'puppet': f.over = `<g transform="translate(14 196)"><path d="M0 -40h24M12 -40v-6" ${S}/><path d="M4 -40v26M20 -40v26" stroke="${INK}" stroke-width="1" stroke-dasharray="2 2"/><circle cx="12" cy="-10" r="6" fill="${PAPER}" ${S}/><rect x="6" y="-4" width="12" height="14" rx="2" fill="${c}" ${S}/><path d="M8 10l-2 10M16 10l2 10" ${S}/></g>`; break;
    case 'oracle': f.over = `<g transform="translate(16 60)">${[0, 1, 2].map(k => `<path d="M0 ${k * 9}h22" ${S}/>`).join('')}</g><g transform="translate(164 96)">${[0, 1, 2].map(k => `<path d="M0 ${k * 9}h8M14 ${k * 9}h8" ${S}/>`).join('')}</g>`; break;
    case 'demonic': f.head = `<path d="M66 60Q50 40 58 20Q66 40 80 50Z M134 60Q150 40 142 20Q134 40 120 50Z" fill="#8e2f3a" ${S}/>`; break;
    case 'soul': f.over = `<path d="M24 120q-8-18 6-26 10 6 4 18q8 4 2 12-6 2-12-4z M172 90q-6-14 4-20 8 4 4 14q6 3 2 9-4 2-10-3z" fill="#cfe0e6" ${S}/>`; break;
    case 'vow': f.back = `<circle cx="100" cy="82" r="62" fill="none" stroke="${GOLD}" stroke-width="5"/><circle cx="100" cy="82" r="68" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="3 5"/>`; break;
    case 'star': f.over = `<path d="M30 60l3 8 8 3-8 3-3 8-3-8-8-3 8-3z M170 46l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M180 140l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e8c35a" stroke="${INK}" stroke-width="1.6"/>`; break;
  }
  return f;
}

// 修仙后，人间物件有的要挪位置，免得跟法器打架
function relicFor(style, mode, color) {
  if (mode === 'xian' && style === 'hu') return `<path d="M120 140L70 196" stroke="#c2a874" stroke-width="5"/><path d="M50 186h30l4 34h-38z" fill="#e6d3a8" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/><path d="M58 198h14M65 191v14" stroke="#c23a22" stroke-width="3"/>`;
  return relic(style, mode, color);
}

export const STYLE_INK = { zheng: '#c23a22', xiao: '#3d7a5a', hu: '#d08a3a', zhen: '#2d5e7e', qi: '#6d5aa8', yuan: '#8e2f3a', sui: '#8a8a3c', cang: '#1d1a16' };

export function figureSVG({ hair = 0, style = 'zheng', path = 'sword', mode = 'xian', size = 200, color = '#2f6b5e', bg = true } = {}) {
  const h = Math.max(0, Math.min(3, Number(hair) || 0));
  const isX = mode === 'xian';
  const fl = isX ? flourish(path, color) : { back: '', head: '', over: '' };
  const backdrop = bg ? (isX
    ? `<circle cx="100" cy="128" r="96" fill="${color}" opacity=".18"/><path d="M-10 236L40 200 66 222 104 178 140 214 168 196 210 222V270H-10Z" fill="${color}" opacity=".22"/>`
    : `<rect x="-2" y="36" width="204" height="206" fill="${STYLE_INK[style]}" opacity=".1"/><path d="M-2 236H202" stroke="${INK}" stroke-width="2" opacity=".25"/>`) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 0 220 270" width="${size}" height="${Math.round(size * 270 / 220)}" aria-hidden="true">
  ${backdrop}
  <ellipse cx="100" cy="258" rx="58" ry="7" fill="${INK}" opacity=".15"/>
  ${fl.back}
  ${hairBack(h)}
  ${isX ? robeBody(color) : officeBody(STYLE_INK[style])}
  <rect x="91" y="124" width="18" height="18" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="100" cy="92" rx="47" ry="44" fill="${SKIN}" stroke="${INK}" stroke-width="${SW}"/>
  ${FACES[style] || FACES.zheng}
  ${hairFront(h, mode)}
  ${fl.head}
  ${relicFor(style, mode, color)}
  ${isX ? heldItem(path, color) : ''}
  ${fl.over}
</svg>`;
}
