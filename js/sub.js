/* 하위 페이지 스크롤 연출. css/sub.css 11번 이후 블록, css/apple.css와 짝을 이룬다. main.js 다음에 로드.
   v2 (2026-10-22): 숫자 카운트업, 어두운 섹션 전환(is-dark), 화면 고정 장면(.chqPin, gsap ScrollTrigger), 막대 차트 추가. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };

  /* 1. 등장: .chqR 글, .chqDraw 선 그리기, .chqGantt 일정 막대, .chqBars 비중 막대 */
  var targets = $$('.chqR,.chqDraw,.chqGantt,.chqBars');
  if (targets.length) {
    if (reduce || !hasIO) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      /* 첫 화면 안에 이미 보이는 요소는 등장 효과 없이 바로 보이게 (전환 직후 깜빡임과 위치 이동 방지) */
      var vh = window.innerHeight;
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) { el.classList.add('is-now', 'is-in'); }
        else { io.observe(el); }
      });
    }
  }

  /* 2. 스토리: 오른쪽 단계 글이 화면 가운데에 오면 왼쪽 고정 그림을 바꿔 보여 준다 */
  $$('.chqStory').forEach(function (story) {
    var steps = $$('.chqStory__step', story);
    var figs = $$('.chqStory__fig', story);
    if (!steps.length || !figs.length) return;
    var activate = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      figs.forEach(function (f, k) { f.classList.toggle('is-active', k === i); });
    };
    activate(0);
    if (!hasIO) { steps.forEach(function (s) { s.classList.add('is-active'); }); return; }
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { activate(parseInt(e.target.getAttribute('data-step'), 10) || 0); }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    steps.forEach(function (s, i) { s.setAttribute('data-step', String(i)); sio.observe(s); });
  });

  /* 3. 숫자 카운트업: [data-count="32180"][data-fmt="int|eok|dec1|dec2"]. HTML에는 최종값이 적혀 있고, 보일 때 0부터 올라간다.
        data-scrub가 붙은 숫자는 5번 고정 장면이 스크롤 진행도로 움직인다. */
  var comma = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  function fmt(v, f) {
    if (f === 'eok') {
      var n = Math.round(v), e = Math.floor(n / 10000), m = n % 10000;
      if (!e) return comma(m);
      return e + '<small class="chqEok">억</small>' + (m ? ' ' + comma(m) : '');
    }
    if (f === 'dec1') return v.toFixed(1);
    if (f === 'dec2') return v.toFixed(2);
    return comma(v);
  }
  function setNum(el, v) { el.innerHTML = fmt(v, el.getAttribute('data-fmt') || 'int'); }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = (parseFloat(el.getAttribute('data-dur')) || 1.6) * 1000;
    var t0 = null;
    setNum(el, 0);
    var step = function (ts) {
      if (t0 === null) t0 = ts;
      var t = clamp((ts - t0) / dur);
      setNum(el, target * easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  var pinnedRoot = function (el) { var p = el.closest && el.closest('.chqPin'); return p && p.classList.contains('is-pinned') ? p : null; };

  /* 5. 화면 고정 장면 (데스크톱, gsap ScrollTrigger가 있을 때). 막대가 차례로 자라고 단계 글이 바뀐다. */
  var pins = $$('.chqPin');
  if (pins.length && gsap && ST && !reduce && typeof gsap.matchMedia === 'function') {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      var created = [];
      pins.forEach(function (pin) {
        var stage = pin.querySelector('.chqPin__stage');
        if (!stage) return;
        var steps = $$('.chqPin__step', pin);
        var bars = $$('.chqChart__bar', pin);
        var scrubs = $$('[data-scrub]', pin);
        var n = parseInt(pin.getAttribute('data-steps'), 10) || Math.max(1, steps.length);
        pin.classList.add('is-pinned');
        var render = function (p) {
          bars.forEach(function (b, i) {
            var s = i * 0.045, g = easeOut(clamp((p - s) / 0.3));
            b.style.setProperty('--g', g.toFixed(3));
            var v = b.querySelector('[data-count]');
            if (v) setNum(v, parseFloat(v.getAttribute('data-count')) * g);
          });
          scrubs.forEach(function (el) {
            if (el.closest('.chqChart__bar')) return;
            setNum(el, parseFloat(el.getAttribute('data-count')) * easeOut(clamp(p / 0.45)));
          });
          var idx = Math.min(n - 1, Math.floor(p * n));
          steps.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
          bars.forEach(function (b, i) {
            var hl = b.getAttribute('data-hl') || '';
            var on = hl.split(',').indexOf(String(idx)) !== -1;
            var any = bars.some(function (x) { return (x.getAttribute('data-hl') || '').split(',').indexOf(String(idx)) !== -1; });
            b.classList.toggle('is-hl', on);
            b.classList.toggle('is-dim', any && !on);
          });
        };
        created.push(ST.create({
          trigger: pin, start: 'top top', end: '+=' + (n * 90) + '%', pin: stage, scrub: 0.4, anticipatePin: 1,
          onUpdate: function (self) { render(self.progress); },
          onRefresh: function (self) { render(self.progress); }
        }));
        render(0);
      });
      return function () {
        created.forEach(function (t) { t.kill(); });
        pins.forEach(function (p) { p.classList.remove('is-pinned'); });
      };
    });
  }

  /* 3-2. 카운트업 관찰 (고정 장면이 맡은 숫자는 건너뜀) */
  if (counters.length && !reduce && hasIO) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        if (!pinnedRoot(e.target)) runCount(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* 6. 막대 차트: 고정 장면이 아닐 때(모바일, gsap 없음)는 보일 때 한 번 자란다 */
  var charts = $$('.chqChart');
  if (charts.length) {
    if (reduce || !hasIO) { charts.forEach(function (c) { c.classList.add('is-in'); }); }
    else {
      var chio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          chio.unobserve(e.target);
          if (!pinnedRoot(e.target)) e.target.classList.add('is-in');
        });
      }, { threshold: 0.3 });
      charts.forEach(function (c) { chio.observe(c); });
    }
  }

  /* 4. 어두운 섹션 전환: 섹션이 화면 70% 지점에 닿으면 is-dark, 지나가면 다시 밝게 (css/apple.css 변수 전환) */
  var darks = $$('.chqApple .chqSec--dark');
  if (darks.length) {
    if (ST && !reduce) {
      darks.forEach(function (sec) {
        ST.create({
          trigger: sec, start: 'top 70%', end: 'bottom 30%',
          onToggle: function (self) { sec.classList.toggle('is-dark', self.isActive); }
        });
      });
    } else if (hasIO && !reduce) {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('is-dark', e.isIntersecting); });
      }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
      darks.forEach(function (s) { dio.observe(s); });
    } else {
      darks.forEach(function (s) { s.classList.add('is-dark'); });
    }
  }

  /* 7. 이미지와 글꼴이 다 실린 뒤 위치 다시 계산 */
  if (ST) {
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ST.refresh(); }); }
  }
})();
