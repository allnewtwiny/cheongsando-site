/* 사이트 시작 로고 액션 (logoplay_15.html 1배속 칸과 같은 동작)
   1-2 순차 페이드인 네모 + 파도 6 각진 출렁임, 파도 선 없음, 취 향 섬 순차 페이드인 */
(function () {
const INK = '#231815', NS = 'http://www.w3.org/2000/svg';
const BLOCKS = [
  [[366.30,345.36],[301.85,296.07],[281.59,296.07],[237.41,355.54],[237.41,403.36],[284.53,403.36],[378.68,383.91],[378.68,367.82]],
  [[510.12,296.06],[412.90,296.06],[395.38,316.41],[389.34,333.44],[389.34,383.91],[441.86,403.36],[518.10,403.36],[518.10,316.41]],
  [[647.12,296.06],[560.86,296.06],[528.76,356.42],[528.76,403.36],[585.39,403.36],[666.07,383.91],[666.07,331.61]]
];
const LETTERS = [
  'M 384.77 456.52 L 400.42 456.52 L 400.42 452.36 L 384.74 452.36 L 384.74 446.20 L 380.21 446.20 L 380.21 452.36 L 364.54 452.36 L 364.54 456.52 L 380.19 456.52 C 379.97 465.94 375.50 468.33 363.29 472.48 L 364.74 476.77 C 374.00 473.63 379.71 471.01 382.01 464.27 L 382.95 464.27 C 385.25 471.01 390.96 473.63 400.21 476.77 L 401.67 472.48 C 389.45 468.33 384.98 465.94 384.77 456.52 M 406.96 504.47 L 411.50 504.47 L 411.50 444.68 L 406.96 444.68 Z M 364.01 486.15 L 380.21 486.15 L 380.21 504.47 L 384.74 504.47 L 384.74 486.15 L 400.94 486.15 L 400.94 481.98 L 364.01 481.98 Z',
  'M 463.21 452.36 L 447.54 452.36 L 447.54 446.20 L 443.01 446.20 L 443.01 452.36 L 427.33 452.36 L 427.33 456.52 L 463.21 456.52 Z M 481.08 460.32 L 481.08 456.15 L 474.45 456.15 L 474.45 444.68 L 469.91 444.68 L 469.91 480.39 L 474.45 480.39 L 474.45 472.21 L 481.08 472.21 L 481.08 468.04 L 474.45 468.04 L 474.45 460.32 Z M 435.27 469.85 C 435.27 467.29 436.04 464.57 445.27 464.57 C 454.50 464.57 455.28 467.29 455.28 469.85 C 455.28 472.41 454.50 475.13 445.27 475.13 C 436.04 475.13 435.27 472.41 435.27 469.85 M 459.81 469.85 C 459.81 460.04 448.87 460.04 445.27 460.04 C 441.68 460.04 430.74 460.04 430.74 469.85 C 430.74 479.66 441.68 479.66 445.27 479.66 C 448.87 479.66 459.81 479.66 459.81 469.85 M 455.68 500.39 C 442.28 500.39 440.56 497.13 440.56 494.28 C 440.56 491.43 442.28 488.16 455.68 488.16 C 469.07 488.16 470.79 491.43 470.79 494.28 C 470.79 497.13 469.07 500.39 455.68 500.39 M 455.68 483.64 C 450.30 483.64 436.04 483.64 436.04 494.28 C 436.04 504.92 450.30 504.92 455.68 504.92 C 461.05 504.92 475.32 504.92 475.32 494.28 C 475.32 483.64 461.05 483.64 455.68 483.64',
  'M 509.62 461.52 L 510.43 461.52 C 512.40 469.64 517.20 473.45 526.32 478.00 L 528.34 473.95 C 516.69 468.13 512.29 464.56 512.29 450.01 L 512.29 446.20 L 507.76 446.20 L 507.76 450.01 C 507.76 464.56 503.36 468.13 491.70 473.95 L 493.73 478.00 C 502.84 473.45 507.65 469.64 509.62 461.52 M 535.66 444.68 L 535.66 458.57 L 524.40 458.57 L 524.40 462.74 L 535.66 462.74 L 535.66 480.39 L 540.20 480.39 L 540.20 444.68 Z M 506.15 488.24 L 535.66 488.24 L 535.66 500.30 L 506.15 500.30 Z M 501.62 504.47 L 540.20 504.47 L 540.20 484.09 L 501.62 484.09 Z'
];
const BOT = 412, SQ_H = BOT - 296.07, TAU = Math.PI * 2;
const X0 = 237.41, X1 = 666.07, STEP = 3;         // 파도 선 너비 = 로고 블록 전체 너비 (왼쪽 끝 237.41, 오른쪽 끝 666.07)
const TALL = BLOCKS.map(b => b.map(p => p[1] > 380 ? [p[0], BOT] : p));
const toSquare = (b, y1) => {
  const xs = b.map(p => p[0]), ys = b.map(p => p[1]);
  const y0 = Math.min(...ys), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (y0 + y1) / 2, h = (y1 - y0) / 2;
  return b.map(p => [p[0] < cx ? cx - h : cx + h, p[1] < cy ? y0 : y1]);
};
const RECTS = TALL.map(b => toSquare(b, BOT));
const RX0 = Math.min(...RECTS.flat().map(p => p[0])), RX1 = Math.max(...RECTS.flat().map(p => p[0]));
const PROFILE = [[-600,403.36],[237.41,403.36],[284.53,403.36],[378.68,383.91],[389.34,383.91],[441.86,403.36],[518.10,403.36],[528.76,403.36],[585.39,403.36],[666.07,383.91],[1500,383.91]];
const profileY = x => { for (let i = 1; i < PROFILE.length; i++) if (x <= PROFILE[i][0]) { const [x0, y0] = PROFILE[i - 1], [x1, y1] = PROFILE[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return 383.91; };

const c01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPts = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);
const poly = pts => 'M ' + pts.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' L ') + ' Z';
const seg = (t, a, d) => c01((t - a) / d);
const E = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inOut2: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  back: t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)
};

// 정사각 등장 (squares.html 2, 5, 14번)
const INTROS = [
  { key: '1-2', name: '동시 페이드인', dur: 1600, frame: (t, i) => [SQ_H, E.out(seg(t, 0, 1600))] }, /* 2026-10-30 세 블록 동시(전에는 i * 650 순차, dur 2900) */
  { key: '1-5', name: '바닥에서 솟아오름', dur: 1200, frame: (t, i) => [SQ_H * E.outExpo(seg(t, i * 200, 800)), 1] },
  { key: '1-14', name: '2분의 1씩 톡톡', dur: 740, frame: (t, i) => { const n = 2, P = 250, M = 140, l = t - i * 120, k = Math.min(n, Math.max(0, Math.floor(l / P)));
      return [k >= n ? SQ_H : SQ_H / n * (k + E.back(c01((l - k * P) / M))), l >= 0 ? 1 : 0]; } }
];
// 피그마 '바다' 물결 한 주기 (waves.html 3번)
const SEA_SEG = [[[0, 1], [.25, 1], [.3, 0], [.5, 0]], [[.5, 0], [.7, 0], [.75, 1], [1, 1]]];
const bez = (q, t) => { const u = 1 - t; return [0, 1].map(k => u*u*u*q[0][k] + 3*u*u*t*q[1][k] + 3*u*t*t*q[2][k] + t*t*t*q[3][k]); };
const SEA_UNIT = SEA_SEG.flatMap(q => Array.from({ length: 12 }, (_, n) => bez(q, n / 12)));
// 파도 흐름 (waves.html 3, 6번). 기준 높이에서 떨어진 정도를 [x, dy] 로 돌려줌
// 각진 물결 (waves.html 과 같은 삼각파)
const tri = a => 2 / Math.PI * Math.asin(Math.sin(a));
const WAVES = [
  { key: '파도 3', name: '피그마 바다 모양', pts: s => { const len = 165, amp = 18, shift = s * 70, pts = [];
      const start = X0 - len - (((X0 - shift) % len) + len) % len;
      for (let o = start; o < X1 + len; o += len) SEA_UNIT.forEach(([u, v]) => pts.push([o + u * len, amp * (v - .5)]));
      return pts.filter(([x]) => x >= X0 && x <= X1); } },
  { key: '파도 6', name: '각진 출렁이는 물', pts: s => { const m = .75 + .25 * Math.sin(TAU * s * .12), pts = [];
      for (let x = X0; x <= X1 + STEP; x += STEP) pts.push([Math.min(x, X1), 11 * m * tri(TAU * (x / 210 - s * .35)) + 10 * (1.5 - m) * tri(TAU * (x / 170 + s * .3) + 1.3)]);
      return pts; } }
];

// 시간표 (ms). 등장 끝나자마자 파도가 나타나 한 번에 올라갔다 곧바로 내려옴 (중간 멈춤 없음)
// sway: 바닥까지 내려온 뒤 굳기 전에 더 출렁이는 시간
const STEPS = [['rise', 1300], ['fall', 2800], ['sway', 900], ['fade', 100], ['word', 1600], ['rest', 0]];
const UP = 2100; // 올라가는 속도는 2.1초 그대로, 다 오르기 0.5초 전부터 내려오기 시작해 꼭대기 멈춤을 없앰
// 시작 높이: 블록 바닥(412)보다 위. 물결이 가장 깊게 내려가도 바닥 위라, 처음부터 블록 아래 일부를 삼킨 채 시작
const LOW = 380, PEAK = 271;
function timeline(D) { const T = { intro: 0 }; let a = D; STEPS.forEach(([k, d]) => { T[k] = a; a += d; }); T.end = a; return T; }
const dur = k => STEPS.find(s => s[0] === k)[1];

let uid = 0;
function makeCell(intro, wave, svg, noLine = false, ink = INK) {
  const id = 'c' + (uid++);
  const mk = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  const clip = mk('clipPath', { id }, mk('defs', {}));
  const clipPath = mk('path', {}, clip);
  const g = mk('g', { 'clip-path': `url(#${id})` });
  const blocks = RECTS.map(r => mk('path', { d: poly(r), fill: ink, opacity: 0 }, g));
  const line = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', opacity: 0 });
  const letters = LETTERS.map(d => mk('path', { d, fill: ink, opacity: 0 }));
  const T = timeline(intro.dur);
  return {
    T,
    frame(t) {
      // 물결 흐름 속도 0.8배
      const s = t / 1000 * .8;
      // 1. 네모 등장 → 물이 꼭대기를 지나는 동안(가려진 동안) 로고 모양으로 바뀜
      const m = E.inOut(seg(t, T.fall + 170, 280)); // 블록이 완전히 가려지는 0.35초(T.fall+150~+500) 안에서만 모양 변환
      const lineIn = E.out(seg(t, T.rise, 600));
      blocks.forEach((b, i) => {
        if (t < T.rise) { const [h, op] = intro.frame(t, i); b.setAttribute('d', poly(RECTS[i].map(p => [p[0], p[1] < BOT ? BOT - h : BOT]))); b.setAttribute('opacity', op); }
        else { b.setAttribute('d', poly(lerpPts(RECTS[i], TALL[i], m))); b.setAttribute('opacity', 1); }
      });
      // 2. 올라감: 바닥 근처에서 바로 나타나 꼭대기까지 한 번에
      const up = E.inOut(seg(t, T.rise, UP));
      // 3. 내려옴: 꼭대기에서 곧바로 내려가며 밑단 모양을 따라감. 물결은 내려오는 동안 계속 살아 있다가 마지막 30%에서만 잦아들며 굳음
      const down = E.inOut2(seg(t, T.fall, dur('fall')));
      // 굳음: 내려오는 후반부터 출렁임 끝까지 천천히 잦아듦 (처음엔 조금씩, 끝은 부드럽게 멈춤)
      const calm = T.fall + dur('fall') * .55, live = Math.pow(1 - seg(t, calm, T.sway + dur('sway') - calm), 2.2);
      // 물 높이가 고정되지 않게: 전체가 출렁(위아래) + 좌우로 살짝 기울었다 돌아옴
      const bob = live * 7 * Math.sin(TAU * s * .55), tilt = live * 12 * Math.sin(TAU * s * .3);
      const L = lerp(LOW, PEAK, up);
      // 파도 너비 = 지금 보이는 블록 너비 (네모일 때 네모 양끝, 로고로 바뀌면 로고 양끝)
      const xl = lerp(RX0, X0, m), xr = lerp(RX1, X1, m);
      const pts = wave.pts(s).map(([x, dy]) => { const u = (x - X0) / (X1 - X0), nx = xl + u * (xr - xl); return [nx, lerp(L, profileY(nx), down) + live * (dy + bob + tilt * (u - .5))]; });
      const d = 'M ' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ');
      line.setAttribute('d', d);
      clipPath.setAttribute('d', d + ` L ${X1 + 200} ${pts[pts.length - 1][1]} L ${X1 + 200} 0 L ${X0 - 200} 0 L ${X0 - 200} ${pts[0][1]} Z`);
      // 파도 선: 올라가기 시작할 때 0.6초 동안 서서히 나타남
      line.setAttribute('opacity', noLine ? 0 : lineIn * (1 - seg(t, T.fade, dur('fade'))));
      // 4. 워드마크
      // 취, 향, 섬 순서로 0.45초씩 늦게 페이드인 (글자마다 1초)
      letters.forEach((l, i) => l.setAttribute('opacity', E.out(seg(t, T.word - 300 + i * 450, 1000))));
    }
  };
}

  // svg 하나에 로고 액션을 그림. 돌려준 frame(ms) 로 시점을 지정, end 는 전체 길이(ms)
  window.LogoIntro = function (svg, ink) {
    const wave6 = WAVES[1], intro12 = INTROS.find(intro => intro.key === '1-2');
    return makeCell(intro12, wave6, svg, true, ink || INK);
  };
})();
