(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2; // quintInOut

/* ---------- кольцо из рисок (логотип) ---------- */
function ring(svg, n = 40) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    d += `<path d="M${50 + c * 30} ${50 + s * 30} L${50 + c * 46} ${50 + s * 46}"/>`;
  }
  svg.innerHTML = d;
}
$$('svg.ring').forEach(s => ring(s, s.classList.contains('ring--logo') ? 32 : 40));

/* ---------- разбиение текста ---------- */
function splitChars(el) {
  const html = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = html.map(line => line.trim().split(/\s+/).map(w =>
    `<span class="w">${[...w].map(c => `<span class="ch"><span>${c}</span></span>`).join('')}</span>`).join(' ')).join('<br>');
  $$('.ch>span', el).forEach((s, i, a) => s.style.transitionDelay = (Math.random() * .35 + i / a.length * .35).toFixed(2) + 's');
}
$$('.split').forEach(splitChars);
$$('.scrub-letters').forEach(el => { el.innerHTML = [...el.textContent].map(c => c === ' ' ? ' ' : `<span class="l">${c}</span>`).join(''); });
$$('.scrub-words').forEach(el => { el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="wd">${w}</span>`).join(' '); });
// «перелистывающиеся» подписи кнопок
$$('.nav a, .btn').forEach(a => {
  const node = [...a.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  if (!node) return;
  const t = node.textContent.trim(), f = document.createElement('span');
  f.className = 'flip'; f.innerHTML = `<span>${t}</span><span>${t}</span>`;
  a.replaceChild(f, node);
});
// пропеллеры
$$('.hero__art ellipse').forEach(e => e.classList.add('prop'));
$$('.hero__art g[fill] rect').forEach((r, i) => { r.classList.add('tagdot'); r.style.animationDelay = i * .4 + 's'; });
$$('.sky__drone path[stroke="#2b2b2d"]').forEach(p => p.classList.add('blade'));

/* ---------- загрузчик ---------- */
const ticks = $$('#loaderRing path'), lbar = $('#loaderBar');
let lp = 0;
const loadTimer = setInterval(() => {
  lp = Math.min(100, lp + (document.readyState === 'complete' ? 7 : 2.5) * Math.random() + 1);
  const k = Math.round(lp / 100 * ticks.length);
  ticks.forEach((t, i) => t.classList.toggle('on', i < k));
  lbar.style.width = lp * .42 + 'px';
  if (lp >= 100) { clearInterval(loadTimer); setTimeout(ready, 350); }
}, RM ? 5 : 45);
function ready() {
  document.body.classList.remove('is-loading');
  document.documentElement.classList.add('is-ready'); document.body.classList.add('is-ready');
  setTimeout(() => $('.hero__title').classList.add('in'), 500);
}

/* ---------- появление по видимости ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .25 });
$$('.sky__title, .thesis, .card').forEach(el => io.observe(el));

/* ---------- прогресс секции ---------- */
function prog(el, vh) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / (r.height - vh));
}

/* ---------- процесс: шаги ---------- */
const STEPS = [
  { w: 'МАРКИРОВКА', d: 'На каждую значимую деталь — мотор, раму, полётный контроллер, аккумулятор — ставится UHF-метка для монтажа на металле. Метку можно заменить: идентичность детали хранится в платформе, а не в чипе.',
    m: ['EPC · 96 бит', 'TID · заводской номер чипа', 'метки для металла', '−40…+85 °C'] },
  { w: 'СЧИТЫВАНИЕ', d: 'Техник подносит деталь к настольному считывателю или сканирует борт ручным Bluetooth-сканером. Событие чтения попадает в систему без ручного ввода номера.',
    m: ['reader · antenna · EPC · TID', 'RSSI −52 dBm', 'USB · Bluetooth · LLRP', 'чтение → база ≤ 2 с'] },
  { w: 'УЧЁТ', d: 'Платформа ведёт ресурс каждой детали по часам, циклам и календарному сроку, предупреждает заранее и блокирует установку выработавшей ресурс детали.',
    m: ['остаток = min(часы, циклы, срок)', 'предупреждение ≤ 10 %', 'блокировка при 0', 'полёты: вручную или CSV'] },
  { w: 'ДОВЕРИЕ', d: 'Ключевые события фиксируются в распределённом реестре Waves Enterprise. Историю детали можно проверить и выгрузить паспортом — изменить прошлое незаметно нельзя.',
    m: ['блок #18 422', 'hash 9f3c…a71e', 'смарт-контракт · ресурс', 'подтверждение ≤ 30 с'] },
];
const pWord = $('#procWord'), pDesc = $('#procDesc'), pNum = $('#procNum'), pMono = $('#procMono'), dots = $$('.process .dots i');
let step = -1;
function setWord(text, dir) {
  const old = $$('.lt', pWord);
  old.forEach((l, i) => { l.style.transitionDelay = i * .03 + 's'; l.classList.add(dir > 0 ? 'up' : 'down'); });
  setTimeout(() => {
    pWord.innerHTML = [...text].map(c => `<span class="lt nt ${dir > 0 ? 'down' : 'up'}">${c}</span>`).join('');
    const ls = $$('.lt', pWord);
    pWord.offsetHeight;
    ls.forEach((l, i) => { l.classList.remove('nt'); l.style.transitionDelay = i * .035 + 's'; l.classList.remove('up', 'down'); });
  }, old.length ? 450 : 0);
}
function setStep(i) {
  if (i === step) return;
  const dir = i > step ? 1 : -1; step = i; const s = STEPS[i];
  setWord(s.w, dir);
  pDesc.classList.add('out');
  pMono.style.opacity = 0;
  setTimeout(() => { pDesc.textContent = s.d; pDesc.classList.remove('out'); pMono.innerHTML = s.m.join('<br>'); pMono.style.opacity = 1; }, 380);
  scramble(pNum, String(i + 1).padStart(2, '0'));
  dots.forEach((d, k) => d.classList.toggle('on', k === i));
}
function scramble(el, to) {
  let n = 0; const G = '0123456789';
  const t = setInterval(() => {
    el.textContent = n++ > 6 ? to : [...to].map(() => G[Math.random() * 10 | 0]).join('');
    if (n > 7) clearInterval(t);
  }, 40);
}
pWord.innerHTML = '';

/* ---------- 3D каркас квадрокоптера ---------- */
const cv = $('#wire3d'), ctx = cv.getContext('2d');
const parts = []; // {segs:[[x,y,z,x,y,z]], ex:[x,y,z], kind}
const P = (kind, ex, segs) => parts.push({ kind, ex, segs });
function circle(cx, cy, cz, r, n = 28, seg = []) {
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, b = (i + 1) / n * 6.283;
    seg.push([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cy, cz + Math.sin(b) * r]);
  }
  return seg;
}
function cyl(cx, cy, cz, r, h, n = 28, v = 8, seg = []) {
  circle(cx, cy, cz, r, n, seg); circle(cx, cy + h, cz, r, n, seg);
  for (let i = 0; i < v; i++) { const a = i / v * 6.283; seg.push([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r, cx + Math.cos(a) * r, cy + h, cz + Math.sin(a) * r]); }
  return seg;
}
function box(cx, cy, cz, sx, sy, sz, ry = 0, seg = []) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const V = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => {
    const X = x * sx / 2, Z = z * sz / 2; return [cx + X * c - Z * s, cy + y * sy / 2, cz + X * s + Z * c];
  })));
  [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(([a, b]) => seg.push([...V[a], ...V[b]]));
  return seg;
}
const L = 1.25;
const arms = [[1,1],[-1,1],[-1,-1],[1,-1]].map(([x, z]) => [x * L / Math.SQRT2, z * L / Math.SQRT2]);
// рама
P('frame', [0, -0.35, 0], [...box(0, 0, 0, .7, .05, .5), ...arms.flatMap(([x, z]) => box(x / 2, 0, z / 2, Math.hypot(x, z), .04, .12, -Math.atan2(z, x)))]);
// стек ПК
P('fc', [0, .55, 0], [...box(0, .16, 0, .34, .03, .34), ...box(0, .26, 0, .34, .03, .34), ...[[.14,.14],[-.14,.14],[.14,-.14],[-.14,-.14]].flatMap(([x, z]) => [[x, .03, z, x, .28, z]])]);
// аккумулятор
P('bat', [0, 1.05, 0], box(0, .46, 0, .62, .2, .3));
// моторы и пропеллеры
arms.forEach(([x, z], i) => {
  const dir = [x * .45, 0, z * .45];
  const stator = cyl(x, .03, z, .1, .1, 24, 12);
  P('stator', [dir[0], .25, dir[2]], stator);
  P('bell', [dir[0], .62, dir[2]], [...cyl(x, .03, z, .14, .16, 28, 6), ...circle(x, .19, z, .04, 12), [x, .1, z, x, .31, z]]);
  const pr = [];
  for (let k = 0; k < 2; k++) {
    const a = k * Math.PI + i * .7, ca = Math.cos(a), sa = Math.sin(a), pa = -sa, pb = ca;
    const pts = [[0, 0], [.18, .06], [.5, .05], [.58, 0], [.5, -.03], [.18, -.04], [0, 0]];
    for (let j = 0; j < pts.length - 1; j++) {
      const [u1, w1] = pts[j], [u2, w2] = pts[j + 1];
      pr.push([x + ca * u1 + pa * w1, .32, z + sa * u1 + pb * w1, x + ca * u2 + pa * w2, .32, z + sa * u2 + pb * w2]);
    }
  }
  P('prop', [dir[0] * 1.3, 1.1, dir[2] * 1.3], pr);
  // метки на лучах
  P('tag', [dir[0] * .6, -.15, dir[2] * .6], box(x * .62, .045, z * .62, .09, .02, .06, -Math.atan2(z, x)));
});
P('tag', [0, 1.3, 0], box(.2, .57, 0, .1, .02, .07));
P('tag', [0, -.5, 0], box(-.22, -.035, 0, .1, .02, .07));
P('tag', [0, .7, 0], box(0, .285, .1, .07, .015, .05));
// ридер (шаг 2)
const reader = cyl(0, -.62, 0, .55, .04, 40, 4).concat(box(0, -.66, 0, 1.2, .03, .8));
// цепочка блоков (шаг 4)
const chainN = 7;

let S = { ex: 1, rd: 0, rs: 0, ch: 0, tilt: .42 }, T = { ...S };
const TARGETS = [
  { ex: .6, rd: 0, rs: 0, ch: 0, tilt: .5 },
  { ex: .25, rd: 1, rs: 0, ch: 0, tilt: .35 },
  { ex: 0, rd: 0, rs: 1, ch: 0, tilt: .55 },
  { ex: .08, rd: 0, rs: 0, ch: 1, tilt: .3 },
];
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
  W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR;
}
addEventListener('resize', resize); resize();
let mx = 0, my = 0, smx = 0, smy = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

function draw(t) {
  for (const k in S) S[k] = lerp(S[k], T[k], .06);
  smx = lerp(smx, mx, .05); smy = lerp(smy, my, .05);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const ry = t * .00012 + smx * .8 + .6, rx = S.tilt + smy * .25;
  const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  const sc = Math.min(W, H) * (W > 900 ? .27 : .22), ox = W * .5, oy = H * .5;
  const proj = (x, y, z) => {
    let X = x * cy - z * sy, Z = x * sy + z * cy, Y = -y;
    let Y2 = Y * cx - Z * sx, Z2 = Y * sx + Z * cx;
    const f = 4.2 / (4.2 + Z2);
    return [ox + X * sc * f, oy + Y2 * sc * f, Z2];
  };
  const line = (s, dx, dy, dz) => {
    const a = proj(s[0] + dx, s[1] + dy, s[2] + dz), b = proj(s[3] + dx, s[4] + dy, s[5] + dz);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  };
  const pulse = .5 + .5 * Math.sin(t * .004);
  for (const p of parts) {
    const e = S.ex, dx = p.ex[0] * e, dy = p.ex[1] * e, dz = p.ex[2] * e;
    ctx.beginPath();
    if (p.kind === 'tag') {
      ctx.strokeStyle = `rgba(255,253,224,${.55 + .45 * pulse})`; ctx.lineWidth = 1.6;
    } else { ctx.strokeStyle = 'rgba(238,232,232,.78)'; ctx.lineWidth = 1; }
    for (const s of p.segs) line(s, dx, dy, dz);
    ctx.stroke();
  }
  // ридер и волны
  if (S.rd > .01) {
    ctx.beginPath(); ctx.strokeStyle = `rgba(238,232,232,${.7 * S.rd})`; ctx.lineWidth = 1;
    reader.forEach(s => line(s, 0, -(1 - S.rd) * .6, 0)); ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const ph = (t * .0006 + k / 4) % 1;
      ctx.beginPath(); ctx.strokeStyle = `rgba(255,253,224,${S.rd * (1 - ph) * .8})`;
      circle(0, -.6 + ph * 1.1, 0, .3 + ph * .9, 48).forEach(s => line(s, 0, 0, 0)); ctx.stroke();
    }
  }
  // ресурс: дуги вокруг моторов
  if (S.rs > .01) {
    const vals = [.72, .69, .36, .08];
    arms.forEach(([x, z], i) => {
      const n = 48, m = Math.round(n * vals[i] * S.rs);
      ctx.beginPath(); ctx.strokeStyle = `rgba(238,232,232,${.25 * S.rs})`;
      circle(x, .02, z, .3, n).forEach(s => line(s, 0, 0, 0)); ctx.stroke();
      ctx.beginPath(); ctx.lineWidth = 2.2; ctx.strokeStyle = i === 3 ? `rgba(240,168,96,${S.rs})` : `rgba(255,253,224,${S.rs})`;
      circle(x, .02, z, .3, n).slice(0, m).forEach(s => line(s, 0, 0, 0)); ctx.stroke(); ctx.lineWidth = 1;
    });
  }
  // цепочка блоков
  if (S.ch > .01) {
    ctx.beginPath(); ctx.strokeStyle = `rgba(238,232,232,${.75 * S.ch})`;
    const pts = [];
    for (let k = 0; k < chainN; k++) {
      const a = k / chainN * 6.283 + t * .0003, r = 1.7 + (1 - S.ch) * 1.5;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = .2 + Math.sin(a * 2 + t * .001) * .15;
      box(x, y, z, .22, .22, .22, a).forEach(s => line(s, 0, 0, 0)); pts.push([x, y, z]);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.setLineDash([3, 5]); ctx.strokeStyle = `rgba(255,253,224,${.7 * S.ch})`;
    pts.forEach((p, k) => { const q = pts[(k + 1) % chainN]; line([...p, ...q], 0, 0, 0); });
    ctx.stroke(); ctx.setLineDash([]);
  }
}

/* ---------- след курсора («краска») ---------- */
const pc = $('#paint'), pctx = pc.getContext('2d'); let trail = [];
function presize() { pc.width = innerWidth; pc.height = innerHeight; }
addEventListener('resize', presize); presize();
let lx = 0, ly = 0;
addEventListener('pointermove', e => {
  const v = Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
  trail.push({ x: e.clientX, y: e.clientY, r: 30 + Math.min(v, 80), a: Math.min(.16, .03 + v / 600) });
});
function paint() {
  pctx.clearRect(0, 0, pc.width, pc.height);
  trail = trail.filter(p => (p.a *= .93) > .004);
  for (const p of trail) {
    const g = pctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, `rgba(255,236,210,${p.a})`); g.addColorStop(1, 'rgba(255,236,210,0)');
    pctx.fillStyle = g; pctx.beginPath(); pctx.arc(p.x, p.y, p.r, 0, 6.283); pctx.fill();
    p.r *= 1.02;
  }
}

/* ---------- галерея ---------- */
const scr = $$('#screen .scr'), th = $$('#thumbs button'); let gi = 0, gTimer;
function show(i) {
  if (i === gi) return;
  scr.forEach((s, k) => { s.classList.remove('is-active', 'left'); if (k < i) s.classList.add('left'); });
  scr[i].classList.add('is-active'); th.forEach((b, k) => b.classList.toggle('on', k === i)); gi = i;
}
th.forEach(b => b.addEventListener('click', () => { show(+b.dataset.i); clearInterval(gTimer); }));
gTimer = setInterval(() => { const r = $('#screen').getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show((gi + 1) % scr.length); }, 5000);

/* ---------- главный цикл ---------- */
const st = $('.statement'), stL = $$('.statement .l'), sky = $('.sky'), skyW = $$('.sky .wd');
const skySvg = $('.sky__svg'), drone = $('.sky__drone'), proc = $('.process'), hero = $('.hero__art');
const thImg = $('.thesis__img svg'), thW = $$('.thesis .wd'), eco = $('.eco'), blur = $$('.blurin');
const ctaBg = $('.cta__bg'), cta = $('.cta'), bar = $('#progBar');
let sy = scrollY;
function frame(t) {
  sy = RM ? scrollY : lerp(sy, scrollY, .12);
  const vh = innerHeight, dY = scrollY - sy;
  // hero
  hero.style.transform = `translate(-50%,calc(-50% + ${sy * .25}px)) scale(${1 + sy / vh * .15})`;
  // statement
  const p1 = prog(st, vh), n1 = Math.round(clamp(p1 * 1.25) * stL.length);
  stL.forEach((l, i) => { l.classList.toggle('on', i < n1); l.classList.toggle('hot', i < n1 && i > stL.length - 10); });
  // sky
  const r = sky.getBoundingClientRect(), p2 = clamp(-r.top / (r.height - vh));
  skySvg.style.transform = `translateY(${-p2 * 4}%) scale(${1.04 + p2 * .06})`;
  const bob = Math.sin(t * .0016) * 8, roll = Math.sin(t * .0011) * 1.6 + dY * .02;
  drone.style.transform = `translate(calc(-50% + ${(p2 - .5) * 18}vw), calc(-50% + ${bob + (p2 - .3) * -6}vh)) rotate(${roll}deg) scale(${.85 + p2 * .3})`;
  const n2 = Math.round(clamp((p2 - .15) * 2) * skyW.length); skyW.forEach((w, i) => w.classList.toggle('on', i < n2));
  // process
  const p3 = prog(proc, vh); const si = Math.min(3, Math.floor(p3 * 4));
  const pr = proc.getBoundingClientRect();
  if (pr.top < vh * .6 && pr.bottom > 0) { setStep(si); Object.assign(T, TARGETS[si]); draw(t); }
  // thesis
  const tr = thImg.parentNode.getBoundingClientRect();
  thImg.style.transform = `translateY(${(tr.top / vh) * -8}%)`;
  const n3 = Math.round(clamp((vh * .85 - $('.thesis__text').getBoundingClientRect().top) / (vh * .7)) * thW.length);
  thW.forEach((w, i) => w.classList.toggle('on', i < n3));
  // eco blur-in
  const er = eco.getBoundingClientRect(), pe = clamp((vh - er.top) / (vh * 1.1));
  blur.forEach((b, i) => { const q = clamp(pe * 1.4 - i * .15); b.style.setProperty('--b', (1 - q) * 16 + 'px'); b.style.setProperty('--o', .2 + q * .8); });
  // cta
  const cr = cta.getBoundingClientRect(); ctaBg.style.transform = `translateY(${cr.top / vh * -10}%)`;
  // progress
  const tot = document.documentElement.scrollHeight - vh; bar.style.top = (scrollY / tot) * 88 + 'vh';
  if (!RM) paint();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
