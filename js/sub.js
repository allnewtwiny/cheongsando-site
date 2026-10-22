/* 하위 페이지 스크롤 연출. css/sub.css 11번 이후 블록과 짝을 이룬다. main.js 다음에 로드. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. 등장: .chqR 글, .chqDraw 선 그리기, .chqGantt 일정 막대, .chqBars 비중 막대 */
  var targets = Array.prototype.slice.call(document.querySelectorAll('.chqR,.chqDraw,.chqGantt,.chqBars'));
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
  Array.prototype.forEach.call(document.querySelectorAll('.chqStory'), function (story) {
    var steps = Array.prototype.slice.call(story.querySelectorAll('.chqStory__step'));
    var figs = Array.prototype.slice.call(story.querySelectorAll('.chqStory__fig'));
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
})();
