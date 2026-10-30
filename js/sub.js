/* 하위 페이지 스크롤 연출. css/sub.css 11번 이후 블록, css/apple.css와 짝을 이룬다. main.js 다음에 로드.
   v2 (2026-10-22): 숫자 카운트업, 어두운 섹션 전환(is-dark), 화면 고정 장면(.chqPin, gsap ScrollTrigger), 막대 차트 추가.
   v3 (2026-10-23): 고정 장면 안 그림 교차(.chqPin__fig[data-step]), 요소 등장(.chqPop[data-at]), 선과 막대 자람(.chqGrowLine/.chqGrowY/.chqGrowX[data-at]), 단계별 어두워짐(data-dark-at).
   v4 (2026-10-23): [data-parallax] 패럴랙스, 고정 장면 안 모든 [data-count] 진행도 구동.
   v5 (2026-10-23): 메인 상단바 톤(is-pastHero 대행), 모바일 그림 끼워 넣기(.chqPin--interleave).
   v6 (2026-10-30): 동그라미 커서, 5초 동안 스크롤이 없으면 아래 화살표로 모핑하고 위아래로 흔들림(맨 끝에서는 안 바뀜). */
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
      var created = [], clickOffs = [];
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
            if (!isNaN(off)) el.classList.toggle('is-on', p >= s && p < off);
            else if (p >= s) el.classList.add('is-on');
            else if (p <= 0.001) el.classList.remove('is-on');
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
        /* data-autoplay="초": 고정되는 순간 스크롤 양과 상관없이 끝까지 한 번에 재생 */
        var auto = parseFloat(pin.getAttribute('data-autoplay')), played = false;
        /* data-manual: 스크롤로는 단계가 바뀌지 않고 클릭과 앞뒤 버튼으로만 넘긴다. 끝에서 다음은 처음으로, 처음에서 이전은 끝으로 */
        /* data-phases="0.5,1": 고정되면 첫 구간까지 자동 재생, 휠 한 번이나 클릭 한 번에 다음 구간까지. 다 끝난 뒤 휠은 다음 화면으로, 클릭은 처음부터 다시 */
        var phAttr = pin.getAttribute('data-phases'), phases = phAttr ? phAttr.split(',').map(parseFloat) : null, ph = 0, phLock = 0;
        var manual = pin.hasAttribute('data-manual') || !!phases, mIdx = 0, mP = 0, mRaf = 0, mGo = false;
        /* 지금 지점에서 to 까지 dur 밀리초 동안 이어서 그린다 */
        var mAnim = function (to, dur) {
          var from = mP, t0 = performance.now();
          cancelAnimationFrame(mRaf);
          var tick = function (now) {
            var k = clamp((now - t0) / dur); mP = from + (to - from) * easeOut(k); render(mP);
            if (k < 1) mRaf = requestAnimationFrame(tick);
          };
          mRaf = requestAnimationFrame(tick);
        };
        var mReset = function () { cancelAnimationFrame(mRaf); mP = 0; render(0); };
        /* 단계 q 의 그림이 다 그려진 지점까지 0.8초 동안 이어서 그린다 */
        var mTo = function (q) {
          var to = (q + 1) / n - 0.001;
          /* 뒤로 갈 때는 거꾸로 지우지 않고 바로 그 장면으로. 1번으로 돌아오면 처음부터 다시 그린다 */
          if (to < mP) { cancelAnimationFrame(mRaf); mP = q === 0 ? 0 : to; render(mP); }
          mAnim(to, 800);
        };
        var phNext = function () {
          if (ph >= phases.length) return false;
          mAnim(phases[ph], 1400); ph++; phLock = performance.now() + 1000;
          return true;
        };
        var mEnter = function () { if (phases) { mReset(); ph = 0; phNext(); } else mTo(0); };
        var play = function () {
          if (played) return; played = true;
          var t0 = performance.now(), dur = auto * 1000;
          var tick = function (now) { var k = clamp((now - t0) / dur); render(k); if (k < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        };
        var trig = ST.create({
          trigger: pin, start: 'top top', end: '+=' + (parseInt(pin.getAttribute('data-len'), 10) || n * 90) + '%', pin: stage, scrub: 0.4, anticipatePin: 1,
          onUpdate: function (self) { if (manual) { if (!mGo && self.progress > 0) { mGo = true; mEnter(); } return; } if (isNaN(auto)) render(self.progress); else if (self.progress > 0) play(); },
          onRefresh: function (self) { if (manual) { if (!mGo && self.progress > 0) { mGo = true; mEnter(); } return; } if (isNaN(auto)) render(self.progress); else if (self.progress > 0) play(); },
          /* 구간 재생 장면은 위로 빠져나가면 처음 상태로, 다시 들어오면 서울부터 */
          onLeaveBack: function () { if (phases) { mGo = false; ph = 0; mReset(); } }
        });
        created.push(trig);
        render(0);
        if (phases) {
          var onPhClick = function (e) {
            if (!trig.isActive || (e.target.closest && e.target.closest('a,button'))) return;
            if (!phNext()) { mReset(); ph = 0; phNext(); }
          };
          var onPhWheel = function (e) {
            if (!trig.isActive || e.deltaY <= 0) return;
            var now = performance.now();
            /* 트랙패드 관성으로 이어지는 신호는 한 번으로 친다 */
            if (now < phLock) { e.preventDefault(); e.stopPropagation(); phLock = now + 250; return; }
            if (ph >= phases.length) return;
            e.preventDefault(); e.stopPropagation(); phNext();
          };
          document.addEventListener('click', onPhClick);
          document.addEventListener('wheel', onPhWheel, { capture: true, passive: false });
          clickOffs.push(function () { document.removeEventListener('click', onPhClick); document.removeEventListener('wheel', onPhWheel, { capture: true }); });
        }
        /* 5-1. data-click-stops: 고정된 동안 화면 아무 곳이나 누르면 다음 멈춤 지점으로 바로 넘긴다 (링크, 버튼 클릭은 제외).
           값이 auto 이면 단계마다 가운데 지점. .chqPinNav__prev / __next 버튼은 앞뒤 단계로 넘긴다. */
        var sAttr = pin.getAttribute('data-click-stops') || '', stops;
        if (sAttr === 'auto') { stops = []; for (var q = 0; q < n; q++) stops.push((q + 0.5) / n); }
        else stops = sAttr.split(',').map(parseFloat).filter(function (v) { return !isNaN(v); });
        if (stops.length) {
          var goStop = function (dir) {
            var p = trig.progress, nx = null, i;
            if (manual) {
              mIdx = (mIdx + (dir > 0 ? 1 : -1) + n) % n; mGo = true; mTo(mIdx);
              return;
            }
            if (sAttr === 'auto') {
              var cur = Math.min(n - 1, Math.floor(p * n)), to = cur + (dir > 0 ? 1 : -1);
              if (to >= 0 && to < n) nx = stops[to];
            } else if (dir > 0) { for (i = 0; i < stops.length; i++) { if (stops[i] > p + 0.02) { nx = stops[i]; break; } } }
            else { for (i = stops.length - 1; i >= 0; i--) { if (stops[i] < p - 0.02) { nx = stops[i]; break; } } }
            if (nx === null) return;
            var y = trig.start + (trig.end - trig.start) * nx;
            if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.6 }); else window.scrollTo({ top: y, behavior: 'smooth' });
          };
          var onStop = function (e) {
            if (!trig.isActive || (e.target.closest && e.target.closest('a,button'))) return;
            goStop(1);
          };
          document.addEventListener('click', onStop);
          clickOffs.push(function () { document.removeEventListener('click', onStop); });
          $$('.chqPinNav__prev,.chqPinNav__next', pin).forEach(function (btn) {
            var h = function (e) { e.preventDefault(); goStop(btn.classList.contains('chqPinNav__prev') ? -1 : 1); };
            btn.addEventListener('click', h);
            clickOffs.push(function () { btn.removeEventListener('click', h); });
          });
        }
      });
      /* 5-2. 고정 장면이 화면 안에 보이기 시작했는데 아직 고정 전이면, 아무 곳이나 누를 때 고정 시작 지점까지 바로 내려간다 (링크, 버튼 클릭은 제외). */
      var onApproach = function (e) {
        if (e.target.closest && e.target.closest('a,button')) return;
        if (created.some(function (t) { return t.isActive; })) return;
        var vh = window.innerHeight, y = window.scrollY || window.pageYOffset;
        for (var i = 0; i < created.length; i++) {
          var t = created[i], top = t.trigger.getBoundingClientRect().top;
          if (t.start > y + 2 && top > 0 && top < vh) {
            if (window.__lenis) window.__lenis.scrollTo(t.start + 2, { duration: 0.8 }); else window.scrollTo({ top: t.start + 2, behavior: 'smooth' });
            return;
          }
        }
      };
      document.addEventListener('click', onApproach);
      clickOffs.push(function () { document.removeEventListener('click', onApproach); });
      return function () {
        created.forEach(function (t) { t.kill(); });
        clickOffs.forEach(function (off) { off(); });
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
      /* 하위 페이지는 어두운 섹션 위에서도 is-pastHero 를 유지해 상단 메뉴가 보이게 하고, 색은 아래 is-overDark 가 맡는다 */
      if (document.body.classList.contains('chqSub')) { document.body.classList.toggle('is-pastHero', window.scrollY > 10); return; }
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

/* v7 (2026-10-24): 옛 첫 화면이 있는 메인에서 상단바 아래가 검정 섹션이면 body.is-overDark (apple.css에서 검정 반투명 바, 흰 글자) */
(function () {
  /* v8 (2026-10-29): 하위 페이지(chqSub)도 같은 방식. 사진 배경 섹션도 어두운 쪽으로 본다 */
  var sub = document.body.classList.contains('chqSub');
  if (!sub && (document.body.getAttribute('data-page') !== 'home' || !document.querySelector('.homeHero'))) return;
  var sel = '.chqSec--darkFixed,.chqSec.is-dark,.chqV7fade' + (sub ? ',.chqSec--photo,.chqHero--photo' : ''), raf = 0;
  var check = function () {
    raf = 0;
    var on = Array.prototype.some.call(document.querySelectorAll(sel), function (el) {
      var r = el.getBoundingClientRect();
      if (el.classList.contains('chqV7fade')) return r.top <= -r.height * 0.5 && r.bottom > 30;
      return r.top <= 30 && r.bottom > 30;
    });
    document.body.classList.toggle('is-overDark', on);
  };
  var q = function () { if (!raf) raf = requestAnimationFrame(check); };
  window.addEventListener('scroll', q, { passive: true });
  window.addEventListener('resize', q);
  check();
})();

/* 동그라미 커서. 마우스가 있는 화면에서만. 5초 동안 스크롤이 없으면 동그라미가 아래 화살표로 바뀌어 흔들리고, 스크롤하면 다시 동그라미. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IDLE = 5000, DUR = 450, N = 8, R = 8;
  /* 동그라미와 화살표를 같은 점 8개, 같은 곡선 8개로 만들어 숫자만 섞는다(사파리도 동작) */
  var K = 4 / 3 * Math.tan(Math.PI / 16);
  function circle() {
    var pts = [];
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / N, b = a + 2 * Math.PI / N;
      var p0 = [R * Math.cos(a), R * Math.sin(a)], p1 = [R * Math.cos(b), R * Math.sin(b)];
      pts.push([p0[0] - K * R * Math.sin(a), p0[1] + K * R * Math.cos(a), p1[0] + K * R * Math.sin(b), p1[1] - K * R * Math.cos(b), p1[0], p1[1]]);
    }
    return { m: [0, -R], c: pts };
  }
  function arrow() {
    var v = [[0, -13], [3, -13], [3, 1], [11, 1], [0, 14], [-11, 1], [-3, 1], [-3, -13]], pts = [];
    for (var i = 0; i < N; i++) {
      var p0 = v[i], p1 = v[(i + 1) % N];
      pts.push([p0[0] + (p1[0] - p0[0]) / 3, p0[1] + (p1[1] - p0[1]) / 3, p0[0] + (p1[0] - p0[0]) * 2 / 3, p0[1] + (p1[1] - p0[1]) * 2 / 3, p1[0], p1[1]]);
    }
    return { m: v[0], c: pts };
  }
  var A = circle(), B = arrow();
  function shape(t) {
    var f = function (x, y) { return (x + (y - x) * t).toFixed(2); };
    var d = 'M' + f(A.m[0], B.m[0]) + ' ' + f(A.m[1], B.m[1]);
    for (var i = 0; i < N; i++) {
      var a = A.c[i], b = B.c[i];
      d += 'C' + f(a[0], b[0]) + ' ' + f(a[1], b[1]) + ' ' + f(a[2], b[2]) + ' ' + f(a[3], b[3]) + ' ' + f(a[4], b[4]) + ' ' + f(a[5], b[5]);
    }
    return d + 'Z';
  }

  var el = document.createElement('div');
  el.className = 'chqCursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="chqCursor__bob"><svg viewBox="-16 -16 32 32" width="32" height="32"><path d="' + shape(0) + '"/></svg></div>';
  document.body.appendChild(el);
  document.documentElement.classList.add('chqCur');
  var path = el.querySelector('path');

  var x = -100, y = -100, posRaf = 0;
  function place() { posRaf = 0; el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  var TEXT = 'input, textarea, select, [contenteditable="true"]';
  var LINK = 'a, button, label, [role="button"], .chqChip span, .projKeymap__ov .b';
  document.addEventListener('mousemove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!posRaf) posRaf = requestAnimationFrame(place);
    var t = e.target && e.target.closest ? e.target : null;
    el.classList.add('is-on');
    el.classList.toggle('is-text', !!(t && t.closest(TEXT)));
    el.classList.toggle('is-link', !!(t && t.closest(LINK)));
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { el.classList.remove('is-on'); });
  window.addEventListener('blur', function () { el.classList.remove('is-on'); });

  /* 모핑: 0은 동그라미, 1은 화살표 */
  var cur = 0, from = 0, to = 0, start = 0, morphRaf = 0;
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function step(now) {
    var k = reduce ? 1 : Math.min(1, (now - start) / DUR);
    cur = from + (to - from) * ease(k);
    path.setAttribute('d', shape(cur));
    if (k < 1) morphRaf = requestAnimationFrame(step);
    else { morphRaf = 0; el.classList.toggle('is-arrow', to === 1); }
  }
  function morph(target) {
    if (to === target) return;
    if (morphRaf) cancelAnimationFrame(morphRaf);
    from = cur; to = target; start = performance.now();
    if (target === 0) el.classList.remove('is-arrow');
    morphRaf = requestAnimationFrame(step);
  }

  /* 맨 끝이거나 첫 화면 연출(프리로더)로 스크롤이 잠겨 있으면 화살표를 띄우지 않는다 */
  var canScroll = function () {
    if (window.__lenis && window.__lenis.isStopped) return false;
    if (getComputedStyle(document.body).overflowY === 'hidden' && getComputedStyle(document.documentElement).overflowY !== 'auto') return false;
    return window.innerHeight + (window.scrollY || window.pageYOffset) < document.documentElement.scrollHeight - 4;
  };
  var timer = 0;
  function arm() {
    clearTimeout(timer);
    timer = setTimeout(function () { if (canScroll()) morph(1); else arm(); }, IDLE);
  }
  window.addEventListener('scroll', function () { morph(0); arm(); }, { passive: true });
  arm();
})();
