/* 하위 페이지 스크롤 연출. css/sub.css 11번 이후 블록, css/apple.css와 짝을 이룬다. main.js 다음에 로드.
   v2 (2026-10-22): 숫자 카운트업, 어두운 섹션 전환(is-dark), 화면 고정 장면(.chqPin, gsap ScrollTrigger), 막대 차트 추가.
   v3 (2026-10-23): 고정 장면 안 그림 교차(.chqPin__fig[data-step]), 요소 등장(.chqPop[data-at]), 선과 막대 자람(.chqGrowLine/.chqGrowY/.chqGrowX[data-at]), 단계별 어두워짐(data-dark-at).
   v4 (2026-10-23): [data-parallax] 패럴랙스, 고정 장면 안 모든 [data-count] 진행도 구동.
   v5 (2026-10-23): 메인 상단바 톤(is-pastHero 대행), 모바일 그림 끼워 넣기(.chqPin--interleave). */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };

  /* 1. 등장: .chqR 글, .chqDraw 선 그리기, .chqGantt 일정 막대, .chqBars 비중 막대 */
  var targets = $$('.chqR,.chqDraw,.chqGantt,.chqBars,.chqPin,.chqChart--io');
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
    if (f === 'raw') return String(Math.round(v));
    if (f === 'dec1' || f === 'dec2') { var q = v.toFixed(f === 'dec1' ? 1 : 2).split('.'); return comma(q[0]) + '.' + q[1]; }
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
      setNum(el, t >= 1 ? target : target * easeOut(t));
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
        var scrubs = $$('[data-count]', pin);
        var figs = $$('.chqPin__fig', pin), pops = $$('.chqPop', pin), grows = $$('.chqGrowLine,.chqGrowY,.chqGrowX', pin);
        var sec = pin.closest('.chqSec'), darkAt = pin.getAttribute('data-dark-at');
        var at = function (el, s0, l0) {
          var a = (el.getAttribute('data-at') || '').split(',');
          var s = parseFloat(a[0]), l = parseFloat(a[1]);
          return [isNaN(s) ? s0 : s, isNaN(l) ? l0 : l];
        };
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
            var sl = at(el, 0, 0.45);
            setNum(el, parseFloat(el.getAttribute('data-count')) * easeOut(clamp((p - sl[0]) / sl[1])));
          });
          grows.forEach(function (el) {
            var sl = at(el, 0, 0.45);
            el.style.setProperty('--g', easeOut(clamp((p - sl[0]) / sl[1])).toFixed(3));
          });
          pops.forEach(function (el, k) {
            var s = parseFloat(el.getAttribute('data-at')), off = parseFloat(el.getAttribute('data-off'));
            if (isNaN(s)) s = k / Math.max(1, pops.length) * 0.8;
            el.classList.toggle('is-on', p >= s && (isNaN(off) || p < off));
          });
          var idx = Math.min(n - 1, Math.floor(p * n));
          steps.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
          figs.forEach(function (f, k) {
            var ds = f.getAttribute('data-step');
            var on = ds === null ? k === idx : ds.split(',').indexOf(String(idx)) !== -1;
            f.classList.toggle('is-active', on);
          });
          if (darkAt !== null && sec) sec.classList.toggle('is-dark', idx >= parseInt(darkAt, 10));
          bars.forEach(function (b, i) {
            var hl = b.getAttribute('data-hl') || '';
            var on = hl.split(',').indexOf(String(idx)) !== -1;
            var any = bars.some(function (x) { return (x.getAttribute('data-hl') || '').split(',').indexOf(String(idx)) !== -1; });
            b.classList.toggle('is-hl', on);
            b.classList.toggle('is-dim', any && !on);
          });
        };
        created.push(ST.create({
          trigger: pin, start: 'top top', end: '+=' + (parseInt(pin.getAttribute('data-len'), 10) || n * 90) + '%', pin: stage, scrub: 0.4, anticipatePin: 1,
          onUpdate: function (self) { render(self.progress); },
          onRefresh: function (self) { render(self.progress); }
        }));
        render(0);
      });
      return function () {
        created.forEach(function (t) { t.kill(); });
        pins.forEach(function (p) { p.classList.remove('is-pinned'); p.classList.add('is-in'); });
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
          trigger: sec, start: 'top 70%', end: sec.classList.contains('chqSec--darkStay') ? 'bottom top' : 'bottom 30%',
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

  /* 8. 패럴랙스: [data-parallax] 안의 이미지가 스크롤에 따라 천천히 움직인다 (v4, 2026-10-23 메인) */
  if (gsap && ST && !reduce) {
    $$('[data-parallax]').forEach(function (box) {
      var img = box.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: 7 }, { yPercent: -7, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* 9. 메인 상단바 톤 (v5): .homeHero가 없는 메인(data-page=home)은 main.js topBarTone이 멈추므로 여기서 맡는다.
        상단바 아래(y=30px)가 사진 히어로나 어두운 섹션이면 투명 바에 흰 글자, 밝은 섹션이면 is-pastHero(반투명 흰 바에 검정 글자, apple.css). */
  if (document.body.getAttribute('data-page') === 'home' && !document.querySelector('.homeHero')) {
    var darkSel = '.chqHero--photo,.chqSec--darkFixed,.chqSec--photo,.chqSec.is-dark';
    var toneRaf = 0;
    var tone = function () {
      toneRaf = 0;
      var dark = $$(darkSel).some(function (el) { var r = el.getBoundingClientRect(); return r.top <= 30 && r.bottom > 30; });
      document.body.classList.toggle('is-pastHero', window.scrollY > 10 && !dark);
    };
    var toneQ = function () { if (!toneRaf) toneRaf = requestAnimationFrame(tone); };
    window.addEventListener('scroll', toneQ, { passive: true });
    window.addEventListener('resize', toneQ);
    if (ST) ST.addEventListener('refresh', toneQ);
    tone();
  }

  /* 10. 모바일(1023px 이하): .chqPin--interleave 고정 장면의 그림을 각 단계 글 앞에 끼워 넣는다 (사진, 글, 버튼 순). 데스크톱 폭으로 돌아오면 원래 자리로. */
  if (gsap && typeof gsap.matchMedia === 'function') {
    gsap.matchMedia().add('(max-width: 1023px)', function () {
      var moved = [];
      $$('.chqPin--interleave').forEach(function (pin) {
        var steps = $$('.chqPin__step', pin), figs = $$('.chqPin__fig', pin);
        figs.forEach(function (f, i) {
          if (!steps[i]) return;
          moved.push({ f: f, parent: f.parentNode, next: f.nextSibling });
          steps[i].insertBefore(f, steps[i].firstChild);
        });
      });
      return function () { moved.reverse().forEach(function (m) { m.parent.insertBefore(m.f, m.next); }); };
    });
  }

  /* 7. 이미지와 글꼴이 다 실린 뒤 위치 다시 계산 */
  if (ST) {
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ST.refresh(); }); }
  }
})();
