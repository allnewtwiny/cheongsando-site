/* 첫 화면 메뉴: 글자 양끝 맞춤 + 호버 시 로고 블록 줄, 정적 (2026-11-26 파도 제거) */
(function () {
  var list = document.querySelector('.homeHero__list');
  var NS = 'http://www.w3.org/2000/svg';
  /* 로고 블록 세 개: 위쪽 모서리(오른쪽에서 왼쪽 순서)와 밑변 좌우 끝 */
  var SHAPES = [
    { top: [[378.68, 367.82], [366.30, 345.36], [301.85, 296.07], [281.59, 296.07], [237.41, 355.54]], l: 237.41, r: 378.68 },
    { top: [[518.10, 316.41], [510.12, 296.06], [412.90, 296.06], [395.38, 316.41], [389.34, 333.44]], l: 389.34, r: 518.10 },
    { top: [[666.07, 331.61], [647.12, 296.06], [560.86, 296.06], [528.76, 356.42]], l: 528.76, r: 666.07 }
  ];
  var COUNT = 8, TRIPLE = 441, BASE = 403, SAMPLES = 1; /* 밑변은 곧은 수평선: 원래 로고를 연달아 놓은 정적 모양 */
  var blocks = [];
  for (var i = 0; i < COUNT; i++) {
    var s = SHAPES[i % 3], dx = Math.floor(i / 3) * TRIPLE;
    blocks.push({ top: s.top.map(function (p) { return [p[0] + dx, p[1]]; }), l: s.l + dx, r: s.r + dx });
  }
  var X0 = 237.41, X1 = blocks[COUNT - 1].r;

  function pathAt(b, t) {
    var d = 'M' + b.top.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
    for (var k = 0; k <= SAMPLES; k++) {
      var x = b.l + (b.r - b.l) * k / SAMPLES;
      var y = BASE;
      d += 'L' + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
  }

  function makeSvg() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', (X0 - 4) + ' 290 ' + (X1 - X0 + 8) + ' 125');
    svg.setAttribute('class', 'hhPlay');
    svg.setAttribute('aria-hidden', 'true');
    var paths = blocks.map(function (b, i) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', pathAt(b, 0));
      p.style.transitionDelay = (i * 0.05) + 's';
      svg.appendChild(p);
      return p;
    });
    return { svg: svg, paths: paths };
  }

  var plays = [];
  /* 첫 화면 목록: 글자 양끝 맞춤 (숫자 묶음은 한 덩어리) */
  if (list) Array.prototype.slice.call(list.querySelectorAll('.homeHero__listItem')).forEach(function (a) {
    var txt = '';
    Array.prototype.slice.call(a.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { txt += n.textContent; a.removeChild(n); }
    });
    txt = txt.trim();
    if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', txt);
    var units = txt.replace(/\s+/g, '').match(/[0-9]+|./g) || [];
    var box = document.createElement('span');
    box.className = 'hhJ';
    box.setAttribute('aria-hidden', 'true');
    units.forEach(function (u) { var c = document.createElement('i'); c.textContent = u; box.appendChild(c); });
    a.insertBefore(box, a.firstChild);
  });
  /* 15개의 섬 메뉴(첫 화면 목록, 펼침 메뉴, 맨 아래 메뉴): 호버 영어 글 대신 로고 블록 줄 */
  var items = Array.prototype.slice.call(document.querySelectorAll('.homeHero__listItem[href="islands.html"], .navigationMain__mainMenuItem[href="islands.html"], .navigationFooter__menuItem[href="islands.html"]'));
  items.forEach(function (a) {
    var ex = a.querySelector('.navigationMain__hoverExtra');
    if (!ex) return;
    var m = makeSvg();
    ex.innerHTML = '';
    ex.classList.add('hhExtra');
    ex.appendChild(m.svg);
    plays.push({ a: a, paths: m.paths });
  });

})();
