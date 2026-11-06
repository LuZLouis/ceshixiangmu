import { PATHS, STYLES, TRAITS, PATH_MAP } from './catalog.js';
import { QUESTIONS, REAL_QUESTIONS, PROLOGUE, REAL_PROLOGUE, TRANSIT, EPILOGUE, questionsFor } from './questions.js';
import { ARC_INFO } from './arcs.js';
import { newState, restoreState, setAnswer, setReal, score, scoreBase, scoreRecord, encodeShare, decodeShare, bond, shareText, cleanName, isRecord, tripOf, validTrip, QUESTION_COUNT, REAL_COUNT, escapeHTML as esc } from './engine.js';
import { STOPS, STAT_NAMES, H_MAX, ENDINGS, GOODS, ITEMS, EVENTS, canUse, needLabel, chanceOf, gameEase, sceneOf, resolveOption, daySeed, dailyEvent } from './trip.js';
import { playGame } from './games.js';
import { emblemSVG } from './emblems.js';
import { figureSVG, HAIRS } from './figure.js';
import qrcode from './qrcode.js';

const KEY = { state: 'wx.v3.state', mine: 'wx.v3.mine', friend: 'wx.v3.friend' };
const INK = '#1d1a16', PAPER = '#f3ecdc', RED = '#c23a22';
const LETTERS = ['甲', '乙', '丙', '丁'];
const TOTAL = REAL_COUNT + QUESTION_COUNT;
const main = document.querySelector('#main'), modal = document.querySelector('#modal');

// ---------- 存储（禁用存储时照样能玩，只是不记） ----------
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* 无痕模式 */ } }
};
const asRecord = v => isRecord(v) ? { answers: [...v.answers], real: [...v.real], hair: v.hair, name: cleanName(v.name), ...(validTrip(v.trip) && tripOf(v, v.trip)?.done ? { trip: { seed: v.trip.seed, picks: [...v.trip.picks], res: [...(v.trip.res || [])], buys: (v.trip.buys || []).map(l => [...l]) } } : {}) } : null;

let state = restoreState(store.get(KEY.state));
let mine = asRecord(store.get(KEY.mine));
let friend = asRecord(store.get(KEY.friend));
let view = 'home';
let picked = null;       // { index, option }：当前题已选、正在看反馈
let posterURL = null;
let tripShow = null;     // 第三幕：正在展示第几站的结果
let cart = [];           // 集市购物车
let dexTab = 'paths';
let dailyShow = false;
const ALBUM_KEY = 'wx.v5.album';
const emptyAlbum = () => ({ runs: 0, paths: [], styles: [], items: [], endings: [], nicks: [], ach: [], daily: { count: 0, last: '', pick: null, res: null } });
let album = (() => { const a = store.get(ALBUM_KEY); return a && typeof a === 'object' ? { ...emptyAlbum(), ...a, daily: { ...emptyAlbum().daily, ...(a.daily || {}) } } : emptyAlbum(); })();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const incoming = decodeShare(location.hash);
if (incoming) {
  friend = incoming; store.set(KEY.friend, friend);
  history.replaceState(null, '', location.pathname + location.search);
  if (mine) view = 'result';
}

// ---------- 小工具 ----------
const emblem = (id, size = 120) => emblemSVG(id, { accent: PATH_MAP[id].color, ink: INK, paper: PAPER, size });
const xianFigure = (rec, size = 220, r = scoreRecord(rec)) => figureSVG({ hair: rec.hair, style: r.style.id, path: r.path.id, color: r.path.color, mode: 'xian', size });
const realFigure = (hair, styleId, size = 200) => figureSVG({ hair, style: styleId, mode: 'real', size });
const badgeNo = rec => String(parseInt(rec.answers.join('') + rec.real.join(''), 4) % 9000 + 1000);
const sameRecord = (a, b) => a && b && encodeShare({ ...a, name: '' }) === encodeShare({ ...b, name: '' });
const shareURL = rec => location.origin + location.pathname + '#' + encodeShare(rec);
let toastTimer;
function toast(msg) {
  const el = document.querySelector('#toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}
function openModal(html) {
  modal.innerHTML = `<div class="sheet"><button class="x" data-act="close" aria-label="关闭">×</button>${html}</div>`;
  if (!modal.open) modal.showModal();
}
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
modal.addEventListener('close', () => { if (posterURL) { URL.revokeObjectURL(posterURL); posterURL = null; } });
function saveState() { store.set(KEY.state, state); }

const CRANE = `<svg class="crane" viewBox="0 0 64 48" aria-hidden="true"><path d="M2 30L26 22 34 4 40 24 62 18 44 32 30 44Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 22L30 44M40 24L30 44" stroke="${INK}" stroke-width="1.6"/><path d="M2 30l-1 -6 6 4" fill="${RED}"/><circle cx="8" cy="28" r="1.4" fill="${INK}"/></svg>`;

// ---------- 渲染 ----------
function go(next) {
  view = next; picked = null; render();
  window.scrollTo(0, 0); main.focus({ preventScroll: true });
}
function render() {
  document.querySelector('#nav-me').hidden = !mine;
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === view || (view === 'result' && b.dataset.nav === 'me')));
  const screens = { start: renderStart, real: renderReal, base: renderBase, transit: renderTransit, quiz: renderQuiz, reveal: renderReveal, trip: renderTrip, dex: renderDex, daily: renderDaily };
  if (view === 'result' && mine) main.innerHTML = renderResult(mine);
  else if (screens[view] && (view === 'dex' || (view === 'daily' && mine) || state)) main.innerHTML = screens[view]();
  else { view = 'home'; main.innerHTML = renderHome(); }
  document.title = view === 'result' && mine ? `${scoreRecord(mine).title} · 万象仙途` : '万象仙途 · 你是哪一种修士';
}

function renderHome() {
  const doing = state && (state.real.length > 0 || state.answers.length > 0);
  const f = friend && !sameRecord(friend, mine) ? friend : null;
  const demo = [['zheng', 'sword', 0], ['xiao', 'alchemy', 3], ['cang', 'demonic', 2]];
  return `<div class="page home">
    ${f ? renderChallenge(f) : `<section class="hero">
      <p class="kicker">打工人穿越修仙 · 互动测试</p>
      <h1 class="display">穿越之后，<br>你会修成<br><em>什么样</em>？</h1>
      <p class="lead">第一幕在公司：周一早会、周五急活、裁员传闻，测出你的人间底色。<br>第二幕在宗门：末班地铁上睡着，醒来就在考核现场。最后生成你自己的修仙人物。</p>
      <div class="actions">
        ${doing ? `<button class="btn primary" data-act="resume">接着玩 →</button><button class="btn ghost" data-act="start">从头再来</button>`
                : `<button class="btn primary" data-act="start">开始上班 →</button>${mine ? '<button class="btn ghost" data-nav="me">看我的人物</button>' : ''}`}
      </div>
      <p class="meta">18 道题 · 约 5 分钟 · 不用登录</p>
      <div class="hero-pairs" aria-hidden="true">${demo.map(([s, p, h], i) => `<div class="hp" style="--i:${i}">
        <div class="hp-before">${realFigure(h, s, 92)}</div><span>→</span>
        <div class="hp-after">${figureSVG({ hair: h, style: s, path: p, color: PATH_MAP[p].color, mode: 'xian', size: 132 })}</div>
        <b class="display">${STYLES.find(x => x.id === s).name}${PATH_MAP[p].name}</b></div>`).join('')}</div>
    </section>`}
    ${dailyCard()}
    <section class="teaser">
      <h2 class="display">8 种打工人 × 16 种修士</h2>
      <p>卷王型打工人修成剑修，穿着仙袍还挂着工牌；摸鱼型修成丹修，脖子上挂着耳机炼丹。一共 128 种人物。测完把链接甩给朋友，看看你俩是搭子还是冤家。</p>
      <button class="btn ghost" data-nav="dex">先翻翻图鉴</button>
    </section>
  </div>`;
}

function renderChallenge(f) {
  const r = scoreRecord(f);
  return `<section class="challenge">
    <p class="kicker">有人把链接转给了你</p>
    <h1 class="display">${esc(f.name || '你的朋友')}：<br>${r.style.name}型打工人，<br>穿越后修成了${r.path.name}</h1>
    <div class="before-after small">
      <figure>${realFigure(f.hair, r.style.id, 110)}<figcaption>穿越前</figcaption></figure>
      <span class="arrow">→</span>
      <figure>${xianFigure(f, 160, r)}<figcaption>穿越后</figcaption></figure>
    </div>
    ${tripOf(f)?.done ? `<p class="nick-label">江湖人称</p><p class="display nick small">${tripOf(f).nick}</p>` : `<p class="verdict display center">「${r.path.verdict}」</p>`}
    <p class="lead">轮到你了。测完马上能看到你们俩的合道指数：天生搭子，还是欢喜冤家。</p>
    <div class="actions">${mine ? `<button class="btn primary" data-act="see-bond">看我们的合道指数 →</button><button class="btn ghost" data-act="start">重新玩一次</button>` : `<button class="btn primary" data-act="start">我也去测 →</button>`}</div>
  </section>`;
}

function renderStart() {
  return `<div class="page intro">
    <p class="kicker">第一幕 · 人间 · ${REAL_PROLOGUE.title}</p>
    ${REAL_PROLOGUE.lines.map((l, i) => `<p class="intro-line" style="--d:${i * 0.4}s">${l}</p>`).join('')}
    <div class="hair-pick" style="--d:${REAL_PROLOGUE.lines.length * 0.4}s">
      <p class="hair-q">先捏个脸，选一个最像你的发型：</p>
      <div class="hairs" role="radiogroup" aria-label="发型">${HAIRS.map(h => `<button class="hair${state.hair === h.id ? ' on' : ''}" role="radio" aria-checked="${state.hair === h.id}" data-act="hair" data-h="${h.id}">${figureSVG({ hair: h.id, style: 'hu', mode: 'real', size: 76, bg: false })}<span>${h.name}</span></button>`).join('')}</div>
    </div>
    <div class="actions" style="--d:${REAL_PROLOGUE.lines.length * 0.4 + 0.2}s"><button class="btn primary" data-act="go-real">打卡上班 →</button></div>
  </div>`;
}

function questionBlock({ q, idx, count, offset, chosen, kind }) {
  const pct = ((offset + idx + (chosen != null ? 1 : 0)) / TOTAL) * 100;
  const opt = chosen != null ? q.options[chosen] : null;
  const feedback = !opt ? '' : kind === 'real'
    ? `<div class="danmaku" aria-live="polite"><p>${opt.reply}</p></div>`
    : `<div class="reply" aria-live="polite">${CRANE}<p><b>阿照：</b>${opt.reply}</p></div>`;
  const last = idx === count - 1;
  return `<div class="page quiz ${kind}">
    <div class="progress"><span>${kind === 'real' ? '人间' : '宗门'} · 第 ${idx + 1} 题</span><i><b style="width:${pct}%"></b></i><span>${offset + idx + 1}/${TOTAL}</span></div>
    ${q.arc && state ? (() => { const st = scoreBase(state.real).style; return `<p class="arc-tag">${st.name}支线 · ${ARC_INFO[st.id].name}</p>`; })() : ''}
    <h2 class="q-title display">${q.title}</h2>
    <p class="scene">${q.scene}</p>
    <p class="prompt">${q.prompt}</p>
    <div class="opts" role="group" aria-label="选项">
      ${q.options.map((o, k) => `<button class="opt${chosen === k ? ' chosen' : ''}${chosen != null && chosen !== k ? ' dim' : ''}" data-act="pick" data-k="${k}" aria-pressed="${chosen === k}">
        <span class="opt-key">${LETTERS[k]}</span><span>${o.text}</span></button>`).join('')}
    </div>
    ${feedback}
    ${opt ? `<div class="actions"><button class="btn primary" data-act="next">${last ? (kind === 'real' ? '下班 →' : '交卷 →') : '下一题 →'}</button></div>` : ''}
    ${idx > 0 ? `<button class="back" data-act="back">← 上一题</button>` : ''}
  </div>`;
}
function renderReal() {
  const idx = picked ? picked.index : Math.min(state.real.length, REAL_COUNT - 1);
  return questionBlock({ q: REAL_QUESTIONS[idx], idx, count: REAL_COUNT, offset: 0, chosen: picked ? picked.option : null, kind: 'real' });
}
function renderQuiz() {
  const idx = picked ? picked.index : Math.min(state.answers.length, QUESTION_COUNT - 1);
  const qs = questionsFor(scoreBase(state.real).style.id);
  return questionBlock({ q: qs[idx], idx, count: QUESTION_COUNT, offset: REAL_COUNT, chosen: picked ? picked.option : null, kind: 'xian' });
}

function renderBase() {
  const b = scoreBase(state.real), s = b.style;
  return `<div class="page base">
    <p class="kicker">第一幕结束 · 你的人间底色</p>
    <div class="base-card">
      <div class="base-fig">${realFigure(state.hair, s.id, 190)}</div>
      <div class="base-text">
        <h1 class="display"><span>${s.name}</span>型打工人</h1>
        <p>${s.real}</p>
        <p class="relic">随身带着：<b>${s.relic}</b></p>
      </div>
    </div>
    <div class="moment"><span>证据：「${b.moment.title}」，你选了</span><p>「${b.moment.text}」</p><p class="moment-reply">${b.moment.reply}</p></div>
    <p class="arc-preview">穿越后你会走「<b>${ARC_INFO[s.id].name}</b>」支线。${ARC_INFO[s.id].line.split('：')[1]}</p>
    <p class="cliff">晚上十一点四十，你终于下班了。<br>你还不知道，这身打扮会跟着你去另一个世界。</p>
    <div class="actions"><button class="btn primary" data-act="cross">坐上末班地铁 →</button></div>
    <button class="back" data-act="back-real">← 改一下人间的答案</button>
  </div>`;
}

function renderTransit() {
  return `<div class="page transit">
    <p class="transit-flash">${TRANSIT}</p>
    <div class="transit-body">
      <p class="kicker">第二幕 · 修仙 · ${PROLOGUE.title}</p>
      ${PROLOGUE.lines.map((l, i) => `<p class="intro-line" style="--d:${1.6 + i * 0.45}s">${l}</p>`).join('')}
      <label class="name-field" style="--d:${1.6 + PROLOGUE.lines.length * 0.45}s">
        <span>报上道号（可以不填）</span>
        <input id="name" maxlength="10" autocomplete="off" placeholder="比如：青禾" value="${esc(state.name || '')}">
      </label>
      <div class="actions" style="--d:${1.8 + PROLOGUE.lines.length * 0.45}s"><button class="btn primary" data-act="begin">接过考卷 →</button></div>
    </div>
  </div>`;
}

function traitBars(r) {
  return `<div class="bars">${TRAITS.map(t => `<div class="bar-row"><span>${t.name}</span><i><b style="width:${r.traits[t.id]}%"></b></i><em>${r.traits[t.id]}</em></div>`).join('')}</div>`;
}

function bondBlock(a, b) {
  const x = bond(a, b);
  return `<section class="bond">
    <p class="kicker">合道指数</p>
    <div class="bond-pair">
      <figure>${xianFigure(a, 120, x.a)}<figcaption>${esc(a.name || '你')}<br><b>${x.a.title}</b></figcaption></figure>
      <span class="bond-x">×</span>
      <figure>${xianFigure(b, 120, x.b)}<figcaption>${esc(b.name || 'TA')}<br><b>${x.b.title}</b></figcaption></figure>
    </div>
    <div class="bond-pct display">${x.pct}<small>%</small></div>
    <div class="bond-label display">${x.label}</div>
    <p>${x.line}</p>
    <p class="bond-same">${x.total} 道题里，你们有 <b>${x.same}</b> 道选得一模一样${x.sameBase ? '，连人间底色都一样' : ''}。</p>
    <div class="actions"><button class="btn primary" data-act="poster">生成合道海报</button><button class="btn ghost" data-act="share">把结果发回给 TA</button><button class="btn ghost" data-act="forget-friend">换一个人比</button></div>
  </section>`;
}

function renderResult(rec) {
  const r = scoreRecord(rec), p = r.path, s = r.style, buddy = PATH_MAP[p.buddy], rival = PATH_MAP[p.rival];
  const f = friend && !sameRecord(friend, rec) ? friend : null;
  const trip = tripOf(rec)?.done ? tripOf(rec) : null;
  return `<div class="page result">
    ${f ? bondBlock(rec, f) : ''}
    <p class="epi">${EPILOGUE}</p>
    <article class="badge" style="--c:${p.color}">
      <header class="badge-top"><span>万象宗 · 外门弟子证</span><span>No.${badgeNo(rec)}</span></header>
      <div class="badge-hero">
        <div class="badge-fig">${xianFigure(rec, 240, r)}</div>
        <div class="badge-id">
          <div class="badge-name">${esc(rec.name || '无名考生')}</div>
          <h1 class="badge-title display"><span>${s.name}</span>${p.name}</h1>
          ${trip ? `<p class="badge-nick">江湖人称<br><b>${trip.nick}</b></p>` : ''}
          <div class="badge-seal">${emblem(p.id, 56)}</div>
        </div>
      </div>
      <p class="verdict display">「${p.verdict}」</p>
      <dl class="badge-fields">
        <div><dt>前世</dt><dd>${s.name}型打工人</dd></div>
        <div><dt>境界</dt><dd>${trip ? `${trip.level}（下山历练后）` : p.realm}</dd></div>
        <div><dt>法宝</dt><dd>${p.treasure}</dd></div>
        <div><dt>遗物</dt><dd>${s.relic}（从人间带来的）</dd></div>
      </dl>
      <span class="stamp" aria-hidden="true">准</span>
    </article>
    <div class="actions share-row">
      <button class="btn primary" data-act="poster">生成海报</button>
      <button class="btn primary alt" data-act="share">发给朋友测合道</button>
    </div>
    <section class="block">
      <h3>穿越前后</h3>
      <div class="before-after">
        <figure>${realFigure(rec.hair, s.id, 130)}<figcaption>${s.name}型打工人</figcaption></figure>
        <span class="arrow">→</span>
        <figure>${xianFigure(rec, 170, r)}<figcaption>${s.name}${p.name}</figcaption></figure>
      </div>
      <p>${s.relicLine}</p>
    </section>
    ${tripBlock(rec)}
    <section class="block">
      <h3>在人间，${p.name}大概是</h3>
      <p class="big">${p.human}</p>
    </section>
    <section class="block">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="two">
        <div><h4>天赋</h4><p>${p.talent}</p></div>
        <div><h4>心魔</h4><p>${p.demon}</p></div>
      </div>
      <div class="moment"><span>证据：宗门第 ${r.moment.i + 1} 题「${r.moment.title}」，你选了</span><p>「${r.moment.text}」</p><p class="moment-reply">${CRANE}${r.moment.reply}</p></div>
    </section>
    <section class="block">
      <h3>为什么前面是「${s.name}」</h3>
      <p>${s.line}</p>
      <div class="moment"><span>人间证据：「${r.base.moment.title}」，你选了</span><p>「${r.base.moment.text}」</p></div>
    </section>
    <section class="block">
      <h3>灵根检测</h3>
      ${traitBars(r)}
      <p class="note">差一点就是：${r.second.name}。落户意向：${r.realm.line}</p>
    </section>
    <section class="block pair">
      <h3>修仙界人际关系</h3>
      <button class="pair-card" data-path="${buddy.id}" style="--c:${buddy.color}">${emblem(buddy.id, 64)}<span><small>天生搭子</small><b>${buddy.name}</b><em>${buddy.verdict}</em></span></button>
      <button class="pair-card" data-path="${rival.id}" style="--c:${rival.color}">${emblem(rival.id, 64)}<span><small>欢喜冤家</small><b>${rival.name}</b><em>${rival.verdict}</em></span></button>
      <p class="note">身边谁像${buddy.name}？把链接发过去，测完你们就能看到合道指数。</p>
      <button class="btn primary alt wide" data-act="share">发给 TA</button>
    </section>
    <div class="actions center"><button class="btn ghost" data-act="start">重新玩一次</button><button class="btn ghost" data-nav="dex">翻翻图鉴</button></div>
  </div>`;
}

function renderReveal() {
  const rec = { ...state }, r = scoreRecord(rec), p = r.path;
  return `<div class="page reveal" style="--c:${p.color}">
    <p class="kicker">第二幕结束 · 考核结果</p>
    <div class="reveal-fig">${xianFigure(rec, 260, r)}</div>
    <h1 class="display reveal-title"><span>${r.style.name}</span>${p.name}</h1>
    <p class="verdict display center">「${p.verdict}」</p>
    <p class="cliff">工牌到手。按宗门规矩，新弟子要先下山历练一趟：${STOPS - 1} 桩奇闻异事，最后一站是心魔劫。<br>你的流派和从人间带来的${r.style.relic}，路上都用得上。</p>
    <div class="actions"><button class="btn primary" data-act="trip-start">下山历练 →</button></div>
    <button class="back" data-act="trip-skip">跳过历练，直接看结果</button>
  </div>`;
}

function hud(t, r) {
  const hearts = Array.from({ length: H_MAX }, (_, i) => `<i class="${i < t.st.h ? 'on' : ''}"></i>`).join('');
  const buffs = [t.buff.lucky ? '平安符' : '', t.buff.guard ? '护心镜' : ''].filter(Boolean);
  const shopAt = [2, 4];
  return `<div class="hud">
    <div class="hud-fig">${figureSVG({ hair: state.hair, style: r.style.id, path: r.path.id, color: r.path.color, mode: 'xian', size: 64, bg: false })}</div>
    <div class="hud-stats">
      <div class="hud-row"><span>修为</span><b>${t.st.x}</b><small>${t.level}</small></div>
      <div class="hud-row"><span>灵石</span><b>${t.st.l}</b>${buffs.map(b => `<em class="buff">${b}</em>`).join('')}</div>
      <div class="hud-row"><span>道心</span><span class="hearts" aria-label="道心 ${t.st.h} / ${H_MAX}">${hearts}</span></div>
    </div>
  </div>
  <ol class="route" aria-label="历练路线">${t.stops.map((ev, i) => `${shopAt.includes(i) ? `<li class="mart${t.at >= i && !t.shop ? ' done' : ''}${t.shop && t.at === i ? ' now' : ''}"><span>市</span></li>` : ''}<li class="${i < t.at ? 'done' : ''}${!t.shop && i === (tripShow ?? t.at) ? ' now' : ''}${ev.final ? ' final' : ''}"><span>${i <= t.at ? ev.icon : '?'}</span></li>`).join('')}</ol>
  ${t.items.length ? `<p class="bag">行囊：${t.items.map(x => `<b>${x}</b>`).join('')}</p>` : ''}`;
}

function deltaChips(d) {
  return Object.entries(d || {}).filter(([, v]) => v).map(([k, v]) => `<span class="delta ${v > 0 ? 'up' : 'down'}">${STAT_NAMES[k]} ${v > 0 ? '+' : ''}${v}</span>`).join('');
}
const GAME_NAMES = { timing: '看准时机', fire: '掌握火候', trace: '照着画' };
function optionButton(o, k, can, r, lucky, act = 'trip-pick') {
  return `<button class="opt trip-opt${o.need ? ' special' : ''}${o.game ? ' gamey' : ''}${can ? '' : ' locked'}" data-act="${act}" data-k="${k}" ${can ? '' : 'disabled aria-disabled="true"'}>
    ${o.need ? `<span class="opt-tag">${can ? '你的本事 · ' : '需要 · '}${needLabel(o)}</span>` : ''}
    <span class="opt-text">${o.text}</span>
    ${o.roll ? `<span class="opt-roll">掷签 · 成功率 ${chanceOf(o, r.traits, lucky)}%</span>` : ''}
    ${o.game ? `<span class="opt-roll">小游戏 · ${GAME_NAMES[o.game.type]}${lucky ? ' · 平安符生效' : ''}</span>` : ''}
  </button>`;
}
function outcomeCard(e, title) {
  return `<article class="event outcome">
    <p class="ev-no">${title}</p>
    <p class="ev-choice">你选择：${e.opt.text}</p>
    ${e.roll ? `<div class="lot ${e.ok ? 'good' : 'bad'}"><span class="lot-stick">${e.ok ? '上上签' : '下下签'}</span><small>成功率 ${e.chance}%</small></div>` : ''}
    ${e.game ? `<div class="lot ${e.ok ? 'good' : 'bad'}"><span class="lot-stick">${e.ok ? '成' : '败'}</span><small>小游戏 · ${GAME_NAMES[e.game]}</small></div>` : ''}
    <p class="ev-result">${e.res.text}</p>
    <div class="deltas">${deltaChips(e.res.d)}${e.res.item ? `<span class="delta item">获得奇物：${e.res.item}</span>` : ''}${e.guarded ? '<span class="delta item">护心镜挡下了道心损失</span>' : ''}</div>
  </article>`;
}

function renderTrip() {
  if (!state?.trip) return renderReveal();
  const r = scoreRecord(state), id = { path: r.path.id, style: r.style.id };
  const t = tripOf(state);
  if (!t) { state = { ...state, trip: null }; saveState(); return renderReveal(); }
  if (tripShow != null && t.log[tripShow]) {
    const e = t.log[tripShow];
    const nextLabel = t.done ? '历练结算 →' : t.shop ? '路过集市 →' : t.at === STOPS - 1 ? '前往最后一站 →' : '继续赶路 →';
    return `<div class="page trip">${hud(t, r)}${outcomeCard(e, `第 ${e.k + 1} 站 · ${e.ev.title}`)}
      <div class="actions"><button class="btn primary" data-act="trip-next">${nextLabel}</button></div>
    </div>`;
  }
  if (t.done) return renderTripEnd(t, r);
  if (t.shop) return renderShop(t, r);
  const ev = t.next;
  const opts = ev.options.map((o, k) => ({ o, k, can: canUse(o, id, t.items) })).filter(x => !(x.o.need?.hidden && !x.can));
  return `<div class="page trip">${hud(t, r)}
    <article class="event${ev.final ? ' final' : ''}">
      <p class="ev-no">第 ${t.at + 1} 站${ev.final ? ' · 最后一站' : ''}</p>
      <h2 class="display ev-title"><span class="ev-icon">${ev.icon}</span>${ev.title}</h2>
      <p class="scene">${sceneOf(ev, r.style.id)}</p>
      <div class="opts">${opts.map(({ o, k, can }) => optionButton(o, k, can, r, t.buff.lucky)).join('')}</div>
    </article>
  </div>`;
}

function renderShop(t, r) {
  const spent = cart.reduce((n, gi) => n + GOODS[gi].cost, 0), left = t.st.l - spent;
  return `<div class="page trip">${hud(t, r)}
    <article class="event shop">
      <p class="ev-no">路边集市 · ${t.shop.idx + 1} / 2</p>
      <h2 class="display ev-title"><span class="ev-icon">市</span>路边集市</h2>
      <p class="scene">山道边支着几个摊子。一个摊主冲你招手：「道友，下一站凶险，带点东西上路？」</p>
      <div class="goods">${t.shop.goods.map(gi => { const g = GOODS[gi], inCart = cart.includes(gi), can = inCart || left >= g.cost; return `<button class="good${inCart ? ' on' : ''}" data-act="cart" data-g="${gi}" ${can ? '' : 'disabled'} aria-pressed="${inCart}">
        <b class="display">${g.name}</b><span>${g.desc}</span><em>${g.cost} 灵石</em></button>`; }).join('')}</div>
      <p class="shop-sum">剩余灵石：<b>${left}</b>${cart.length ? `，已选 ${cart.length} 样` : ''}</p>
    </article>
    <div class="actions"><button class="btn primary" data-act="shop-leave">${cart.length ? '买下，继续赶路 →' : '什么都不买，走了 →'}</button></div>
  </div>`;
}

function renderTripEnd(t, r) {
  const end = ENDINGS[t.ending];
  return `<div class="page trip-end" style="--c:${r.path.color}">
    <p class="kicker">历练结束 · ${end.name}</p>
    <div class="reveal-fig">${xianFigure(state, 220, r)}</div>
    <p class="nick-label">江湖人称</p>
    <h1 class="display nick">${t.nick}</h1>
    <p class="center">${end.line}</p>
    <div class="end-stats"><div><b>${t.level}</b><span>历练境界</span></div><div><b>${t.st.l}</b><span>灵石</span></div><div><b>${t.items.length}</b><span>奇物</span></div></div>
    <div class="actions center"><button class="btn primary" data-act="trip-done">查看完整结果 →</button></div>
  </div>`;
}

function tripBlock(rec) {
  const t = tripOf(rec);
  if (!t?.done) return `<section class="block"><h3>下山历练</h3><p>你还没下过山。历练能拿到江湖外号和奇物，会显示在工牌和海报上。</p><button class="btn primary alt" data-act="trip-later">现在去历练 →</button></section>`;
  const end = ENDINGS[t.ending];
  const tag = e => e.roll ? `<em class="${e.ok ? 'good' : 'bad'}">${e.ok ? '上上签' : '下下签'}</em>` : e.game ? `<em class="${e.ok ? 'good' : 'bad'}">${GAME_NAMES[e.game]} · ${e.ok ? '成' : '败'}</em>` : '';
  return `<section class="block">
    <h3>历练记录 · ${end.name}</h3>
    <ol class="trip-log">${t.log.map(e => `<li><span class="ev-icon">${e.ev.icon}</span><div><b>${e.ev.title}</b>${tag(e)}<p>${e.opt.text}。${e.res.text}</p></div></li>`).join('')}</ol>
    ${t.bought.length ? `<p class="bag">集市买过：${t.bought.map(b => `<b>${b.good.name}${b.won === true ? '（中了！）' : b.won === false ? '（没中）' : ''}</b>`).join('')}</p>` : ''}
    ${t.items.length ? `<p class="bag">奇物：${t.items.map(x => `<b>${x}</b>`).join('')}</p>` : ''}
    <button class="btn ghost" data-act="trip-again">再下一次山</button>
  </section>`;
}

// ---------- 图鉴与成就 ----------
const ACH = [
  { id: 'first', name: '初次下山', desc: '完成一次历练', test: (t, a) => a.runs >= 1 },
  { id: 'veteran', name: '老江湖', desc: '下山 10 次', test: (t, a) => a.runs >= 10 },
  { id: 'zouhuo', name: '走火入魔', desc: '道心归零一次', test: t => t.ending === 'zouhuo' },
  { id: 'home', name: '黄粱一梦', desc: '找到隐藏结局「回到人间」', test: t => t.ending === 'home' },
  { id: 'itemend', name: '物尽其用', desc: '用奇物破了心魔', test: t => t.ending === 'item' },
  { id: 'own', name: '本色出演', desc: '用人间底色破了心魔', test: t => t.ending === 'own' },
  { id: 'allend', name: '六道轮回', desc: '集齐 6 种结局', test: (t, a) => a.endings.length >= 6 },
  { id: 'rich', name: '小富即安', desc: '一趟下来剩 12 块灵石以上', test: t => t.st.l >= 12 },
  { id: 'god', name: '化神', desc: '一趟历练修到化神', test: t => t.level === '化神' },
  { id: 'lucky', name: '欧皇', desc: '一趟里掷签至少两次，全是上上签', test: t => { const r = t.log.filter(e => e.roll); return r.length >= 2 && r.every(e => e.ok); } },
  { id: 'unlucky', name: '非酋', desc: '一趟里抽到两次下下签', test: t => t.log.filter(e => e.roll && !e.ok).length >= 2 },
  { id: 'hands', name: '手速惊人', desc: '一趟里小游戏玩了两次以上，全成', test: t => { const g = t.log.filter(e => e.game); return g.length >= 2 && g.every(e => e.ok); } },
  { id: 'collector', name: '收破烂的', desc: '一趟带回 3 件奇物', test: t => t.items.length >= 3 },
  { id: 'dragon', name: '龙王克星', desc: '外号跟龙王有关', test: t => t.nick.includes('龙王') },
  { id: 'shopper', name: '剁手', desc: '一趟在集市买了 3 样以上', test: t => t.bought.length >= 3 },
  { id: 'lottery', name: '天选之人', desc: '仙界彩票中奖', test: t => t.bought.some(b => b.won) },
  { id: 'nicks', name: '名满江湖', desc: '攒下 8 个不同外号', test: (t, a) => a.nicks.length >= 8 },
  { id: 'daily', name: '日日奇遇', desc: '做完 3 次每日奇遇', test: (t, a) => a.daily.count >= 3 }
];
const add = (list, v) => { if (v && !list.includes(v)) list.push(v); };
function saveAlbum() { store.set(ALBUM_KEY, album); }
function recordRun(rec, t) {
  const r = scoreRecord(rec);
  if (t) {
    album.runs += 1;
    add(album.endings, t.ending); add(album.nicks, t.nick);
    t.items.forEach(i => add(album.items, i));
  }
  add(album.paths, r.path.id); add(album.styles, r.style.id);
  checkAch(t);
}
function checkAch(t) {
  const fresh = ACH.filter(a => !album.ach.includes(a.id) && (() => { try { return a.test(t || { ending: '', st: { l: 0 }, level: '', log: [], items: [], nick: '', bought: [] }, album); } catch { return false; } })());
  fresh.forEach(a => album.ach.push(a.id));
  saveAlbum();
  if (fresh.length) setTimeout(() => toast(`解锁成就：${fresh.map(a => a.name).join('、')}`), 400);
}

// ---------- 每日奇遇 ----------
function dailyState() {
  const d = today(), ev = dailyEvent(d);
  const played = album.daily.last === d && album.daily.pick != null;
  return { d, ev, played, seed: daySeed(d) };
}
function dailyCard() {
  const { d, ev, played } = dailyState();
  return `<section class="daily-card">
    <p class="kicker">每日奇遇 · ${Number(d.slice(5, 7))}月${Number(d.slice(8))}日</p>
    <h2 class="display"><span class="ev-icon">${ev.icon}</span>${ev.title}</h2>
    <p>${mine ? (played ? '今天的奇遇已经结束，明天再来。' : '每天一桩，所有人遇到的都一样。看看你的身份能怎么解。') : '测完拿到修仙身份，就能玩每日奇遇。'}</p>
    ${mine ? `<button class="btn ${played ? 'ghost' : 'primary'}" data-act="daily-open">${played ? '看看今天的结果' : '去看看 →'}</button>` : ''}
  </section>`;
}
function renderDaily() {
  const { d, ev, played, seed } = dailyState(), r = scoreRecord(mine), id = { path: r.path.id, style: r.style.id, traits: r.traits };
  if (played) {
    const opt = ev.options[album.daily.pick], res = resolveOption(opt, id, seed, 0, album.daily.res);
    const e = { opt, ok: res.ok, chance: res.chance, roll: Boolean(opt.roll), game: opt.game?.type || null, res: res.out };
    return `<div class="page trip daily">${outcomeCard(e, `每日奇遇 · ${d} · ${ev.title}`)}
      <p class="note">明天会是另一桩奇遇。你已经做完 ${album.daily.count} 次。</p>
      <div class="actions"><button class="btn primary alt" data-act="daily-share">把今天的奇遇发给朋友</button><button class="btn ghost" data-nav="home">回首页</button></div>
    </div>`;
  }
  const opts = ev.options.map((o, k) => ({ o, k, can: canUse(o, id, []) })).filter(x => !(x.o.need?.hidden && !x.can));
  return `<div class="page trip daily">
    <article class="event">
      <p class="ev-no">每日奇遇 · ${d}</p>
      <h2 class="display ev-title"><span class="ev-icon">${ev.icon}</span>${ev.title}</h2>
      <p class="scene">${sceneOf(ev, r.style.id)}</p>
      <p class="note">你以「${r.title}」的身份赴约。只有一次机会。</p>
      <div class="opts">${opts.map(({ o, k, can }) => optionButton(o, k, can, r, false, 'daily-pick')).join('')}</div>
    </article>
  </div>`;
}

function renderDex() {
  const mr = mine ? scoreRecord(mine) : null, hair = mine ? mine.hair : 0;
  const tabs = [['paths', `修士 ${album.paths.length}/16`], ['styles', `底色 ${album.styles.length}/8`], ['items', `奇物 ${album.items.length}/${ITEMS.length}`], ['endings', `结局 ${album.endings.length}/${Object.keys(ENDINGS).length}`], ['ach', `成就 ${album.ach.length}/${ACH.length}`], ['nicks', `外号 ${album.nicks.length}`]];
  let body = '';
  if (dexTab === 'paths') body = `<div class="dex-grid">${PATHS.map(p => { const got = album.paths.includes(p.id); return `<button class="dex-card${p.id === mr?.path.id ? ' me' : ''}${got ? '' : ' unseen'}" data-path="${p.id}" style="--c:${p.color}">
      ${figureSVG({ hair, style: mr ? mr.style.id : 'hu', path: p.id, color: p.color, mode: 'xian', size: 120 })}<b class="display">${p.name}</b><span>${got ? p.verdict : '还没修成过'}</span>${p.id === mr?.path.id ? '<i>你</i>' : ''}</button>`; }).join('')}</div>`;
  else if (dexTab === 'styles') body = `<div class="style-list">${STYLES.map(s => { const got = album.styles.includes(s.id); return `<div class="style-row${got ? '' : ' unseen'}">${realFigure(hair, s.id, 64)}<div><b>${s.name}型打工人</b><small>带着${s.relic} · 支线「${ARC_INFO[s.id].name}」</small><p>${got ? s.real : '还没当过这种打工人。换个底色，第二幕和下山路上会遇到完全不同的事。'}</p></div></div>`; }).join('')}</div>`;
  else if (dexTab === 'items') body = `<div class="seal-grid">${ITEMS.map(i => { const got = album.items.includes(i); return `<div class="seal-cell${got ? '' : ' unseen'}"><span class="ev-icon">${got ? i[0] : '?'}</span><b>${got ? i : '？？？'}</b><small>${got ? '心魔劫里能用上' : '历练途中可能捡到'}</small></div>`; }).join('')}</div>`;
  else if (dexTab === 'endings') body = `<div class="seal-grid">${Object.entries(ENDINGS).map(([k, e]) => { const got = album.endings.includes(k); return `<div class="seal-cell${got ? '' : ' unseen'}"><span class="ev-icon">${got ? e.name.replace('隐藏结局：', '')[0] : '?'}</span><b>${got ? e.name : '？？？'}</b><small>${got ? e.line : '还没走到过这个结局'}</small></div>`; }).join('')}</div>`;
  else if (dexTab === 'ach') body = `<div class="seal-grid">${ACH.map(a => { const got = album.ach.includes(a.id); return `<div class="seal-cell ach${got ? '' : ' unseen'}"><span class="ev-icon">${got ? '成' : '?'}</span><b>${a.name}</b><small>${a.desc}</small></div>`; }).join('')}</div>`;
  else body = album.nicks.length ? `<ol class="nick-list">${album.nicks.map(n => `<li class="display">${n}</li>`).join('')}</ol>` : '<p class="note">还没有外号。下山历练一趟就有了。</p>';
  return `<div class="page dex">
    <p class="kicker">万象宗 · 藏经阁</p>
    <h1 class="display">图鉴</h1>
    <p class="lead">下山 ${album.runs} 次。没解锁的格子，换个身份、换条路再来。</p>
    <div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${dexTab === k}" class="tab${dexTab === k ? ' on' : ''}" data-act="dex-tab" data-t="${k}">${n}</button>`).join('')}</div>
    ${body}
  </div>`;
}

function pathSheet(id) {
  const p = PATH_MAP[id];
  return `<div class="path-sheet" style="--c:${p.color}">
    <div class="ps-head">${emblem(p.id, 96)}<div><h2 class="display">${p.name}</h2><p class="verdict">「${p.verdict}」</p></div></div>
    <p><b>在人间：</b>${p.human}</p>
    <p>${p.desc}</p>
    <p><b>天赋：</b>${p.talent}<br><b>心魔：</b>${p.demon}<br><b>法宝：</b>${p.treasure}<br><b>境界：</b>${p.realm}</p>
    <p><b>搭子：</b>${PATH_MAP[p.buddy].name}　<b>冤家：</b>${PATH_MAP[p.rival].name}</p>
  </div>`;
}

// ---------- 海报（canvas，本地生成，不上传任何东西） ----------
const svgImage = svg => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
function wrap(ctx, text, maxW) {
  const lines = []; let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      if ('，。、」！？：；）'.includes(ch)) { line += ch; continue; }
      lines.push(line); line = ch;
    } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}
async function makePoster(rec, other) {
  const r = scoreRecord(rec), p = r.path, s = r.style, W = 1080;
  const D = (size, w = 900) => `${w} ${size}px WXDisplay, "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif`;
  const S = (size, w = 400) => `${w} ${size}px -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  try { await document.fonts.load(D(80)); } catch { /* 用系统字体 */ }
  const c = document.createElement('canvas'); c.width = W; c.height = 10;
  let x = c.getContext('2d');

  const cx = 70, cy = 150, cw = W - 140;
  x.font = D(48); const vLines = wrap(x, `「${p.verdict}」`, cw - 100);
  const trip = tripOf(rec)?.done ? tripOf(rec) : null;
  const fields = [['前世', `${s.name}型打工人，带着${s.relic}穿越`], ...(trip ? [['历练', `${ENDINGS[trip.ending].name}，${trip.level}境界${trip.items.length ? '，带回' + trip.items.join('、') : ''}`]] : [['境界', p.realm]]), ['法宝', p.treasure]];
  x.font = D(46); const nLines = trip ? wrap(x, trip.nick, cw - 100) : [];
  const band = trip ? 96 + nLines.length * 60 : 0;
  x.font = S(32); const fLines = fields.map(([, v]) => wrap(x, v, cw - 240));
  const heroH = 760;
  const ch = 86 + heroH + band + vLines.length * 66 + 40 + 50 + fLines.reduce((n, l) => n + 46 * l.length + 26, 0) + 20;
  const b = other ? bond(rec, other) : null;
  const bondTop = cy + ch + 50, footTop = bondTop + (b ? 190 : 0) + 30;
  const H = footTop + 320;
  c.height = H; x = c.getContext('2d'); x.textBaseline = 'alphabetic';

  // 纸
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  let seed = parseInt(rec.answers.join(''), 4) || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(60,40,20,${rnd() * 0.06})`; x.fillRect(rnd() * W, rnd() * H, 2, 2); }

  x.fillStyle = INK; x.font = S(30, 600);
  x.fillText('万象仙途 · 打工人穿越档案', 70, 110);
  x.textAlign = 'right'; x.fillText('No.' + badgeNo(rec), W - 70, 110); x.textAlign = 'left';

  // 卡片
  x.fillStyle = INK; x.fillRect(cx + 16, cy + 16, cw, ch);
  x.fillStyle = '#fbf6ea'; x.fillRect(cx, cy, cw, ch);
  x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(cx, cy, cw, ch);
  x.fillStyle = p.color; x.fillRect(cx, cy, cw, 86);
  x.fillStyle = PAPER; x.font = S(30, 700); x.fillText('万象宗 · 外门弟子证', cx + 40, cy + 56);
  x.beginPath(); x.moveTo(cx, cy + 86); x.lineTo(cx + cw, cy + 86); x.stroke();

  // 穿越前 → 穿越后
  const top = cy + 86;
  const before = await svgImage(figureSVG({ hair: rec.hair, style: s.id, mode: 'real', size: 300 }));
  const after = await svgImage(figureSVG({ hair: rec.hair, style: s.id, path: p.id, color: p.color, mode: 'xian', size: 560 }));
  x.drawImage(before, cx + 30, top + 300, 260, 319);
  x.drawImage(after, cx + 330, top + 40, 560, 687);
  x.fillStyle = '#6b6156'; x.font = S(28, 600); x.textAlign = 'center';
  x.fillText('穿越前', cx + 160, top + 650);
  x.font = D(80); x.fillStyle = RED; x.fillText('→', cx + 300, top + 500);
  x.textAlign = 'left';
  // 名字与称号
  x.fillStyle = '#6b6156'; x.font = S(32, 500); x.fillText(rec.name || '无名考生', cx + 40, top + 80);
  x.fillStyle = p.color; x.font = D(72); x.fillText(s.name, cx + 36, top + 170);
  x.fillStyle = INK; x.font = D(p.name.length > 2 ? 92 : 116); x.fillText(p.name, cx + 32, top + 285);

  // 江湖外号
  if (trip) {
    const by = top + heroH;
    x.fillStyle = RED; x.fillRect(cx, by, cw, band - 36);
    x.fillStyle = '#ffe3d8'; x.font = S(26, 700); x.fillText('江湖人称', cx + 50, by + 44);
    x.fillStyle = '#fff'; x.font = D(46);
    nLines.forEach((l, i) => x.fillText(l, cx + 50, by + 100 + i * 60));
  }
  // 判词
  x.font = D(48); x.fillStyle = INK;
  let y = top + heroH + band + 40;
  for (const line of vLines) { x.fillText(line, cx + 50, y); y += 66; }
  y += 6;
  x.strokeStyle = INK; x.lineWidth = 3; x.setLineDash([10, 8]);
  x.beginPath(); x.moveTo(cx + 50, y); x.lineTo(cx + cw - 50, y); x.stroke(); x.setLineDash([]);
  y += 58;
  fields.forEach(([k], i) => {
    x.font = S(30, 700); x.fillStyle = p.color; x.fillText(k, cx + 50, y);
    x.font = S(32, 400); x.fillStyle = INK;
    fLines[i].forEach((l, j) => x.fillText(l, cx + 180, y + j * 46));
    y += 46 * fLines[i].length + 26;
  });

  // 印章
  x.save(); x.translate(cx + cw - 110, top + 110); x.rotate(-0.22);
  x.strokeStyle = RED; x.lineWidth = 8; x.globalAlpha = 0.88;
  x.strokeRect(-62, -62, 124, 124); x.fillStyle = RED; x.font = D(84); x.textAlign = 'center'; x.fillText('准', 0, 30);
  x.restore(); x.textAlign = 'left'; x.globalAlpha = 1;

  if (b) {
    x.fillStyle = INK; x.fillRect(70, bondTop, W - 140, 160);
    x.fillStyle = '#f2a48f'; x.font = S(28, 700); x.fillText(`和 ${other.name || 'TA'}（${b.b.title}）的合道指数`, 106, bondTop + 54);
    x.fillStyle = PAPER; x.font = D(64); x.fillText(b.label, 106, bondTop + 128);
    x.textAlign = 'right'; x.font = D(110); x.fillStyle = '#fff'; x.fillText(b.pct + '%', W - 106, bondTop + 128); x.textAlign = 'left';
  }

  const qr = qrcode(0, 'M'); qr.addData(shareURL(rec)); qr.make();
  const n = qr.getModuleCount(), cell = Math.floor(220 / n), qs = cell * n, qx = W - 70 - qs - 14, qy = footTop + 20;
  x.fillStyle = '#fff'; x.fillRect(qx - 14, qy - 14, qs + 28, qs + 28);
  x.fillStyle = INK;
  for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) if (qr.isDark(rr, cc)) x.fillRect(qx + cc * cell, qy + rr * cell, cell, cell);
  x.fillStyle = INK; x.font = D(56); x.fillText('穿越后，你会修成什么？', 70, footTop + 76);
  x.font = S(30, 400); x.fillStyle = '#4a4239';
  x.fillText('扫码测一测：你的人间底色和修仙流派。', 70, footTop + 136);
  x.fillText(`测完看看你和${rec.name || 'TA'}是搭子还是冤家。`, 70, footTop + 184);
  x.fillStyle = RED; x.fillRect(70, footTop + 214, 72, 72);
  x.fillStyle = PAPER; x.font = D(52); x.textAlign = 'center'; x.fillText('仙', 106, footTop + 269); x.textAlign = 'left';
  x.fillStyle = INK; x.font = D(40); x.fillText('万象仙途', 160, footTop + 264);

  return new Promise(ok => c.toBlob(ok, 'image/png'));
}

async function showPoster() {
  openModal('<p class="poster-wait">阿照正在盖章……</p>');
  try {
    const blob = await makePoster(mine, friend && !sameRecord(friend, mine) ? friend : null);
    posterURL = URL.createObjectURL(blob);
    const r = scoreRecord(mine);
    modal.querySelector('.sheet').innerHTML = `<button class="x" data-act="close" aria-label="关闭">×</button>
      <img class="poster" src="${posterURL}" alt="${r.title}的穿越海报">
      <p class="poster-tip">手机上长按图片保存，电脑上点下面的按钮。</p>
      <div class="actions center"><a class="btn primary" href="${posterURL}" download="万象仙途-${r.title}.png">下载海报</a></div>`;
  } catch {
    modal.querySelector('.sheet').innerHTML = '<button class="x" data-act="close">×</button><p class="poster-wait">海报没生成出来。可以直接截图结果页，效果也不差。</p>';
  }
}

async function share() {
  const r = scoreRecord(mine), url = shareURL(mine), text = shareText(r, mine.name);
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: '万象仙途 · 穿越后你会修成什么', text, url }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); toast('链接已复制。发给朋友，TA 测完你们就能看到合道指数'); }
  catch { openModal(`<p>复制下面这段，发给朋友：</p><textarea class="copybox" readonly>${esc(text + '\n' + url)}</textarea>`); modal.querySelector('textarea').select(); }
}

// ---------- 作答 ----------
function currentList() { return view === 'real' ? state.real : state.answers; }
function pick(k) {
  const list = currentList(), index = picked ? picked.index : list.length;
  if (list[index] !== k) { state = view === 'real' ? setReal(state, index, k) : setAnswer(state, index, k); saveState(); }
  picked = { index, option: k }; render();
  main.firstElementChild?.classList.add('still');
  main.querySelector('.reply, .danmaku')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function next() {
  const list = currentList(), count = view === 'real' ? REAL_COUNT : QUESTION_COUNT;
  const at = picked ? picked.index : list.length - 1;
  if (at + 1 < list.length) { picked = { index: at + 1, option: list[at + 1] }; render(); window.scrollTo(0, 0); return; }
  if (list.length < count) { go(view); return; }
  if (view === 'real') { go('base'); return; }
  go('reveal');
}
function finish(withTrip) {
  mine = { answers: [...state.answers], real: [...state.real], hair: state.hair, name: state.name, ...(withTrip && state.trip ? { trip: state.trip } : {}) };
  store.set(KEY.mine, mine); state = null; store.set(KEY.state, null);
  recordRun(mine, mine.trip ? tripOf(mine) : null);
  go('result');
}
function back() {
  const list = currentList(), cur = picked ? picked.index : list.length;
  const prev = Math.max(0, cur - 1);
  picked = { index: prev, option: list[prev] }; render(); window.scrollTo(0, 0);
}
function resume() {
  if (!state) return go('home');
  if (state.real.length < REAL_COUNT) return go(state.real.length ? 'real' : 'start');
  if (!state.crossed) return go('base');
  if (state.finished) return go(state.trip ? 'trip' : 'reveal');
  go('quiz');
}

// ---------- 第三幕操作 ----------
const newTrip = () => ({ seed: Math.floor(Math.random() * 2 ** 31), picks: [], res: [], buys: [] });
async function runGameFor(opt, ease) {
  openModal('<div class="game-host"></div>');
  modal.querySelector('.x')?.remove();
  const ok = await playGame(modal.querySelector('.game-host'), { type: opt.game.type, label: opt.game.label, ease });
  modal.close();
  return ok ? 1 : 0;
}
let busy = false;
async function tripPick(k) {
  if (busy) return; busy = true;
  try {
    const t = tripOf(state), r = scoreRecord(state), opt = t.next.options[k];
    let res = -1;
    if (opt.game) res = await runGameFor(opt, gameEase(opt, r.traits, t.buff.lucky));
    const at = state.trip.picks.length;
    const trip = { ...state.trip, picks: [...state.trip.picks, k], res: [...(state.trip.res || []).slice(0, at), res] };
    if (!tripOf({ ...state, trip })) return;
    state = { ...state, trip }; saveState(); tripShow = at; render(); window.scrollTo(0, 0);
  } finally { busy = false; }
}
async function dailyPick(k) {
  if (busy) return; busy = true;
  try {
    const { d, ev } = dailyState(), r = scoreRecord(mine), opt = ev.options[k];
    let res = null;
    if (opt.game) res = await runGameFor(opt, gameEase(opt, r.traits, false));
    album.daily = { count: album.daily.count + 1, last: d, pick: k, res };
    const out = resolveOption(opt, { traits: r.traits }, daySeed(d), 0, res).out;
    if (out.tag) add(album.nicks, out.tag + r.title);
    checkAch(null); go('daily');
  } finally { busy = false; }
}
async function dailyShare() {
  const { d, ev, seed } = dailyState(), r = scoreRecord(mine), opt = ev.options[album.daily.pick];
  const out = resolveOption(opt, { traits: r.traits }, seed, 0, album.daily.res).out;
  const text = `【万象仙途 · 每日奇遇 ${d}】${ev.title}\n我是${r.title}，我选了：${opt.text}\n结果：${out.text}\n你会怎么选？`;
  const url = location.origin + location.pathname;
  try { await navigator.clipboard.writeText(text + '\n' + url); toast('已复制，发给朋友看看'); }
  catch { openModal(`<p>复制下面这段：</p><textarea class="copybox" readonly>${esc(text + '\n' + url)}</textarea>`); }
}

// ---------- 事件 ----------
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault(); if (modal.open) modal.close();
    go(nav.dataset.nav === 'me' ? 'result' : nav.dataset.nav);
    return;
  }
  const pathBtn = e.target.closest('[data-path]');
  if (pathBtn) { openModal(pathSheet(pathBtn.dataset.path)); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'close') modal.close();
  else if (act === 'start') { state = newState(Math.floor(Math.random() * 4)); saveState(); go('start'); }
  else if (act === 'resume') resume();
  else if (act === 'hair') { state = { ...state, hair: Number(el.dataset.h) }; saveState(); render(); main.firstElementChild?.classList.add('still'); }
  else if (act === 'go-real') go('real');
  else if (act === 'pick') pick(Number(el.dataset.k));
  else if (act === 'next') next();
  else if (act === 'back') back();
  else if (act === 'back-real') { view = 'real'; picked = { index: REAL_COUNT - 1, option: state.real[REAL_COUNT - 1] }; render(); window.scrollTo(0, 0); }
  else if (act === 'cross') { state = { ...state, crossed: true }; saveState(); go('transit'); }
  else if (act === 'begin') { state = { ...state, name: cleanName(document.querySelector('#name')?.value) }; saveState(); go('quiz'); }
  else if (act === 'poster') showPoster();
  else if (act === 'share') share();
  else if (act === 'see-bond') go('result');
  else if (act === 'trip-start') { state = { ...state, trip: newTrip() }; saveState(); tripShow = null; cart = []; go('trip'); }
  else if (act === 'trip-skip') finish(false);
  else if (act === 'trip-pick') tripPick(Number(el.dataset.k));
  else if (act === 'trip-next') { tripShow = null; cart = []; render(); window.scrollTo(0, 0); }
  else if (act === 'trip-done') finish(true);
  else if ((act === 'trip-later' || act === 'trip-again') && mine) { state = { v: 3, hair: mine.hair, name: mine.name, real: [...mine.real], answers: [...mine.answers], crossed: true, finished: true, trip: newTrip() }; saveState(); tripShow = null; cart = []; go('trip'); }
  else if (act === 'cart') { const g = Number(el.dataset.g); cart = cart.includes(g) ? cart.filter(x => x !== g) : [...cart, g]; render(); main.firstElementChild?.classList.add('still'); }
  else if (act === 'shop-leave') { state = { ...state, trip: { ...state.trip, buys: [...(state.trip.buys || []), [...cart].sort((a, b) => a - b)] } }; if (!tripOf(state)) { state.trip.buys.pop(); toast('灵石不够'); return; } saveState(); cart = []; render(); window.scrollTo(0, 0); }
  else if (act === 'dex-tab') { dexTab = el.dataset.t; render(); main.firstElementChild?.classList.add('still'); }
  else if (act === 'daily-open') go('daily');
  else if (act === 'daily-pick') dailyPick(Number(el.dataset.k));
  else if (act === 'daily-share') dailyShare();
  else if (act === 'forget-friend') { friend = null; store.set(KEY.friend, null); render(); share(); }
});
window.addEventListener('hashchange', () => {
  const inc = decodeShare(location.hash);
  if (!inc) return;
  friend = inc; store.set(KEY.friend, friend);
  history.replaceState(null, '', location.pathname + location.search);
  go(mine ? 'result' : 'home');
});

render();
