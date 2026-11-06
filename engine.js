import { PATHS, STYLES, REALMS, TRAITS, PATH_MAP, BONDS } from './catalog.js';
import { QUESTIONS, REAL_QUESTIONS, questionsFor } from './questions.js';
import { runTrip, STOPS } from './trip.js';

export const VERSION = 3;
export const QUESTION_COUNT = QUESTIONS.length;      // 修仙 12 题
export const REAL_COUNT = REAL_QUESTIONS.length;     // 人间 6 题

export function cleanName(name) {
  return String(name ?? '').replace(/[\u0000-\u001f<>\ufffd]/g, '').trim().slice(0, 10);
}
const validList = (list, n) => Array.isArray(list) && list.length <= n && list.every(x => Number.isInteger(x) && x >= 0 && x <= 3);
const validHair = h => Number.isInteger(h) && h >= 0 && h <= 3;

export function newState(hair = 0) {
  return { v: VERSION, hair: validHair(hair) ? hair : 0, name: '', real: [], answers: [], finished: false };
}
// v1 / v2 存档结构不同，直接丢弃
export function restoreState(value) {
  if (!value || value.v !== VERSION || !validList(value.real, REAL_COUNT) || !validList(value.answers, QUESTION_COUNT) || !validHair(value.hair)) return null;
  if (value.answers.length && value.real.length < REAL_COUNT) return null;
  const trip = validTrip(value.trip) ? { seed: value.trip.seed, picks: [...value.trip.picks], res: [...(value.trip.res || [])], buys: (value.trip.buys || []).map(l => [...l]) } : null;
  return { v: VERSION, hair: value.hair, name: cleanName(value.name), real: [...value.real], answers: [...value.answers], trip,
    crossed: value.real.length === REAL_COUNT && (Boolean(value.crossed) || value.answers.length > 0),
    finished: value.real.length === REAL_COUNT && value.answers.length === QUESTION_COUNT };
}
function put(list, n, index, option) {
  if (!Number.isInteger(index) || index < 0 || index >= n) throw new Error('题号无效');
  if (!Number.isInteger(option) || option < 0 || option > 3) throw new Error('选项无效');
  if (index > list.length) throw new Error('不能跳题');
  const next = list.slice(0, index); next[index] = option; return next;
}
// 改人间题不影响修仙题；改前面的题会清掉同一幕后面的答案
export function setReal(state, index, option) {
  if (state.answers.length) throw new Error('已经穿越了');
  return { ...state, real: put(state.real, REAL_COUNT, index, option), finished: false };
}
export function setAnswer(state, index, option) {
  if (state.real.length < REAL_COUNT) throw new Error('还没穿越');
  const answers = put(state.answers, QUESTION_COUNT, index, option);
  return { ...state, answers, finished: answers.length === QUESTION_COUNT };
}
export function isRecord(v) {
  return Boolean(v) && validList(v.answers, QUESTION_COUNT) && v.answers.length === QUESTION_COUNT && validList(v.real, REAL_COUNT) && v.real.length === REAL_COUNT && validHair(v.hair);
}

// 人间底色：出现最多的底色；平手时取最早出现的那个（第一反应最真实）
export function scoreBase(real) {
  if (!validList(real, REAL_COUNT) || real.length !== REAL_COUNT) throw new Error('人间答卷不完整');
  const count = {}, first = {};
  real.forEach((pick, i) => { const id = REAL_QUESTIONS[i].options[pick].style; count[id] = (count[id] || 0) + 1; if (!(id in first)) first[id] = i; });
  const id = Object.keys(count).sort((a, b) => count[b] - count[a] || first[a] - first[b])[0];
  const style = STYLES.find(s => s.id === id);
  const moment = real.map((pick, i) => ({ i, q: REAL_QUESTIONS[i], o: REAL_QUESTIONS[i].options[pick] })).find(m => m.o.style === id);
  return { style, count: count[id], moment: { i: moment.i, title: moment.q.title, text: moment.o.text, reply: moment.o.reply } };
}

const zero = list => Object.fromEntries(list.map(x => [x.id, 0]));
export function score(answers, real) {
  if (!validList(answers, QUESTION_COUNT) || answers.length !== QUESTION_COUNT) throw new Error('答卷不完整');
  const base = scoreBase(real), QS = questionsFor(base.style.id);
  const paths = zero(PATHS), realms = zero(REALMS), traitRaw = zero(TRAITS);
  answers.forEach((pick, i) => {
    const opt = QS[i].options[pick];
    paths[opt.paths[0]] += 1;
    paths[opt.paths[1]] += 0.5;
    realms[opt.realm] += 1;
    opt.paths.forEach((pid, k) => { for (const [t, v] of Object.entries(PATH_MAP[pid].traits)) traitRaw[t] += v * (k ? 0.5 : 1); });
  });
  // 平分时，用六项灵根与修途原型的贴合度来拆，结果仍然完全由选择决定
  const total = Object.values(traitRaw).reduce((a, b) => a + b, 0) || 1;
  const fit = p => Object.entries(p.traits).reduce((n, [t, v]) => n + v * traitRaw[t] / total, 0);
  const rankedPaths = [...PATHS].sort((a, b) => paths[b.id] - paths[a.id] || fit(b) - fit(a));
  const realm = [...REALMS].sort((a, b) => realms[b.id] - realms[a.id] || REALMS.indexOf(a) - REALMS.indexOf(b))[0];
  const max = Math.max(...Object.values(traitRaw)) || 1;
  const traits = Object.fromEntries(TRAITS.map(t => [t.id, Math.round(35 + 65 * traitRaw[t.id] / max)]));
  const path = rankedPaths[0], style = base.style;
  const moments = answers.map((pick, i) => {
    const q = QS[i], opt = q.options[pick];
    return { i, title: q.title, text: opt.text, reply: opt.reply, w: opt.paths[0] === path.id ? 2 : opt.paths[1] === path.id ? 1 : 0 };
  }).sort((a, b) => b.w - a.w || a.i - b.i);
  return { path, style, realm, base, second: rankedPaths[1], traits, title: style.name + path.name, moment: moments[0] };
}
export const scoreRecord = rec => score(rec.answers, rec.real);

// 分享编码：修仙 12 位 + 人间 6 位 + 发型 + 道号。好友打开后在本地重算，不需要服务器
export function encodeShare(rec) {
  if (!isRecord(rec)) return '';
  const n = cleanName(rec.name);
  let t = '';
  if (validTrip(rec.trip)) {
    const tr = rec.trip;
    t = '&t=' + tr.seed.toString(36) + '&p=' + tr.picks.map(x => x.toString(36)).join('')
      + '&g=' + tr.picks.map((_, k) => tr.res?.[k] === 1 ? '1' : tr.res?.[k] === 0 ? '0' : '-').join('')
      + '&s=' + (tr.buys || []).map(l => l.join('') || '_').join('.');
  }
  return 'r=' + rec.answers.join('') + '&b=' + rec.real.join('') + '&h=' + rec.hair + t + (n ? '&n=' + encodeURIComponent(n) : '');
}
export function decodeShare(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const r = params.get('r') || '', b = params.get('b') || '', h = params.get('h') || '0';
  if (!new RegExp(`^[0-3]{${QUESTION_COUNT}}$`).test(r) || !new RegExp(`^[0-3]{${REAL_COUNT}}$`).test(b) || !/^[0-3]$/.test(h)) return null;
  let name = '';
  try { name = cleanName(params.get('n') || ''); } catch { name = ''; }
  const rec = { answers: [...r].map(Number), real: [...b].map(Number), hair: Number(h), name };
  const t = params.get('t'), p = params.get('p'), g = params.get('g') || '', sh = params.get('s') || '';
  if (t && /^[0-9a-z]{1,7}$/.test(t) && p && new RegExp(`^[0-9a-z]{1,${STOPS}}$`).test(p) && /^[01-]{0,6}$/.test(g) && /^[0-5._]{0,16}$/.test(sh)) {
    const trip = { seed: parseInt(t, 36), picks: [...p].map(c => parseInt(c, 36)), res: [...p].map((_, k) => g[k] === '1' ? 1 : g[k] === '0' ? 0 : -1), buys: sh === '' ? [] : sh.split('.').map(x => x === '_' ? [] : [...x].map(Number)) };
    if (validTrip(trip) && tripOf(rec, trip)?.done) rec.trip = trip;
  }
  return rec;
}

// ---------- 第三幕 ----------
export function validTrip(trip) {
  const ints = (a, max, min = 0) => Array.isArray(a) && a.every(n => Number.isInteger(n) && n >= min && n <= max);
  return Boolean(trip) && Number.isInteger(trip.seed) && trip.seed >= 0 && trip.seed < 2 ** 31
    && ints(trip.picks, 35) && trip.picks.length <= STOPS
    && (trip.res === undefined || (ints(trip.res, 1, -1) && trip.res.length <= STOPS))
    && (trip.buys === undefined || (Array.isArray(trip.buys) && trip.buys.length <= 2 && trip.buys.every(l => ints(l, 5) && l.length <= 6)));
}
export function identity(result) {
  return { path: result.path.id, style: result.style.id, traits: result.traits, title: result.title };
}
export function tripOf(rec, trip = rec.trip) {
  if (!validTrip(trip)) return null;
  const t = runTrip(identity(scoreRecord(rec)), trip);
  return t.error ? null : t;
}

// 合道：两个人的缘分。确定性计算，同样两份答卷永远得到同一个结果
export function bond(a, b) {
  const ra = scoreRecord(a), rb = scoreRecord(b);
  const same = a.answers.filter((x, i) => x === b.answers[i]).length + a.real.filter((x, i) => x === b.real[i]).length;
  const ta = Object.values(ra.path.traits), tb = Object.values(rb.path.traits);
  const cos = ta.reduce((n, v, i) => n + v * tb[i], 0) / (Math.hypot(...ta) * Math.hypot(...tb));
  const sameBase = ra.style.id === rb.style.id;
  let kind, pct;
  if (ra.path.id === rb.path.id) { kind = 'same'; pct = 84 + Math.min(Math.round(same * 0.8), 14); }
  else if (ra.path.buddy === rb.path.id) { kind = 'buddy'; pct = 90 + Math.min(Math.round(same * 0.5), 9); }
  else if (ra.path.rival === rb.path.id) { kind = 'rival'; pct = 48 + same * 2; }
  else {
    pct = Math.round(42 + (cos - 0.6) * 90 + same * 2 + (sameBase ? 8 : 0));
    pct = Math.max(41, Math.min(89, pct));
    kind = pct >= 76 ? 'high' : pct >= 58 ? 'mid' : 'low';
  }
  return { kind, pct: Math.min(pct, 99), same, total: QUESTION_COUNT + REAL_COUNT, sameBase, ...BONDS[kind], a: ra, b: rb };
}

export function shareText(result, name) {
  const who = name ? `【${name}】` : '我';
  return `${who}在人间是${result.style.name}型打工人，穿越后修成了「${result.path.name}」。\n判词：${result.path.verdict}\n来测测你是哪一种修士，顺便看看咱俩合不合：`;
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
