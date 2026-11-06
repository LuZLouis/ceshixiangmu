// 三个十秒小游戏。playGame(host, { type, label, ease }) → Promise<boolean>
//   timing 时机：指针来回扫，点「出手」时落在红区就成功（渡劫闪雷、抢灵石、斩心魔）
//   fire   火候：按住添火，松手时落在绿区就成功，冲到顶就炸（炼丹、蓄力）
//   trace  画符：沿虚线描一笔，描得够准就成功（画阵、补阵纹）
// ease 是命中区半宽（百分比），由灵根和平安符决定，见 trip.js gameEase。

const TITLES = { timing: '看准时机', fire: '掌握火候', trace: '照着画' };

export function playGame(host, { type, label, ease = 10 }) {
  return new Promise(resolve => {
    host.innerHTML = `<div class="game game-${type}">
      <p class="game-kicker">小游戏 · ${TITLES[type]}</p>
      <h3 class="display game-label">${label}</h3>
      <div class="game-stage"></div>
      <p class="game-result" aria-live="assertive"></p>
    </div>`;
    const stage = host.querySelector('.game-stage'), out = host.querySelector('.game-result');
    const finish = ok => {
      out.textContent = ok ? '成了！' : '失手了……';
      out.className = 'game-result ' + (ok ? 'good' : 'bad');
      setTimeout(() => resolve(ok), 900);
    };
    ({ timing, fire, trace })[type](stage, ease, finish);
  });
}

function timing(stage, ease, finish) {
  const center = 25 + Math.random() * 50;
  stage.innerHTML = `<div class="tbar"><i class="tzone" style="left:${center - ease}%;width:${ease * 2}%"></i><b class="tcur"></b></div>
    <button class="btn primary game-btn" type="button">出手</button>`;
  const cur = stage.querySelector('.tcur'), btn = stage.querySelector('.game-btn');
  let pos = 0, dir = 1, last = performance.now(), live = true;
  const speed = 118; // 每秒扫过的百分比
  const tick = now => {
    if (!live) return;
    const dt = Math.min(50, now - last) / 1000; last = now;
    pos += dir * speed * dt;
    if (pos >= 100) { pos = 100; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
    cur.style.left = pos + '%';
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const hit = () => { if (!live) return; live = false; btn.disabled = true; finish(Math.abs(pos - center) <= ease); };
  btn.addEventListener('click', hit);
  stage.querySelector('.tbar').addEventListener('pointerdown', hit);
  btn.focus();
}

function fire(stage, ease, finish) {
  const target = 72;
  stage.innerHTML = `<div class="fmeter"><i class="fzone" style="bottom:${target - ease}%;height:${ease * 2}%"></i><b class="ffill"></b></div>
    <button class="btn primary game-btn" type="button">按住添火</button>`;
  const fill = stage.querySelector('.ffill'), btn = stage.querySelector('.game-btn');
  let level = 0, holding = false, live = true, last = 0;
  const tick = now => {
    if (!live || !holding) return;
    const dt = Math.min(50, now - last) / 1000; last = now;
    level += (38 + level * 1.1) * dt;
    fill.style.height = Math.min(100, level) + '%';
    if (level >= 100) { live = false; holding = false; btn.disabled = true; finish(false); return; }
    requestAnimationFrame(tick);
  };
  const down = e => { e.preventDefault(); if (!live || holding) return; holding = true; last = performance.now(); btn.textContent = '松手出丹'; requestAnimationFrame(tick); };
  const up = () => { if (!live || !holding) return; holding = false; live = false; btn.disabled = true; finish(Math.abs(level - target) <= ease); };
  btn.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up, { once: false });
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
  btn.addEventListener('contextmenu', e => e.preventDefault());
  btn.focus();
}

const SHAPES = [
  [[40, 60], [260, 60], [150, 60], [150, 250], [90, 200], [210, 200]],
  [[60, 50], [240, 50], [240, 150], [60, 150], [60, 250], [240, 250]],
  [[150, 40], [60, 260], [240, 110], [60, 110], [240, 260], [150, 40]]
];
function samples(pts, step = 6) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step));
    for (let k = 0; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return out;
}
function trace(stage, ease, finish) {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  stage.innerHTML = `<canvas class="tcanvas" width="300" height="300" aria-label="画符区域，用手指沿虚线描一遍"></canvas>
    <p class="game-hint">按住，沿着虚线一笔描完，松手结算</p>`;
  const c = stage.querySelector('canvas'), x = c.getContext('2d');
  const path = samples(shape), tol = 16 + ease * 0.7, user = [];
  const draw = () => {
    x.clearRect(0, 0, 300, 300);
    x.fillStyle = '#e8c35a'; x.fillRect(0, 0, 300, 300);
    x.setLineDash([8, 8]); x.lineWidth = 6; x.strokeStyle = 'rgba(29,26,22,.35)'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); shape.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke();
    x.setLineDash([]); x.lineWidth = 9; x.strokeStyle = '#c23a22';
    x.beginPath(); user.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke();
  };
  draw();
  let drawing = false, live = true;
  const at = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * 300 / r.width, (e.clientY - r.top) * 300 / r.height]; };
  c.addEventListener('pointerdown', e => { if (!live) return; drawing = true; c.setPointerCapture(e.pointerId); user.length = 0; user.push(at(e)); draw(); });
  c.addEventListener('pointermove', e => { if (drawing) { user.push(at(e)); draw(); } });
  const end = () => {
    if (!drawing || !live) return; drawing = false;
    if (user.length < 8) return;
    live = false;
    const near = (p, list) => list.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tol);
    const cover = path.filter(p => near(p, user)).length / path.length;
    const prec = user.filter(p => near(p, path)).length / user.length;
    finish(cover >= 0.72 - ease * 0.01 && prec >= 0.6);
  };
  c.addEventListener('pointerup', end);
  c.addEventListener('pointercancel', end);
}
