/* LPAS home clone - behaviour port.
   Each block below mirrors one module of the original theme (Vite bundle),
   rewritten as plain scripts so the page runs from a folder without a build.
   Swup page transitions are intentionally not reproduced (single page only). */
(function () {
  "use strict";

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- global flags (main.js: li) ---------- */
  var isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;
  document.documentElement.setAttribute("data-istoch", isTouch ? "true" : "false");
  document.body.dataset.istoch = isTouch ? "true" : "false";

  /* scrollbar width custom property (main.js: rr) */
  document.body.style.setProperty(
    "--scrollbarWidth",
    window.innerWidth - document.body.clientWidth + "px"
  );

  /* ---------- Lenis smooth scroll (lenisSmooth module) ---------- */
  var lenis = null;
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (!(isSafari && isTouch) && window.Lenis) {
    lenis = new window.Lenis({ autoRaf: false });
    if (document.body.classList.contains("preloaderActive")) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) {
      lenis.raf(t * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
  }
  window.__lenis = lenis;

  /* ---------- Blob cursor (Blob-PIMT988S.js, 1:1 port) ---------- */
  function BlobCursor() {
    this.mouseX = 0; this.mouseY = 0;
    this.blobX = 0; this.blobY = 0;
    this.distX = 0; this.distY = 0;
    this.speedInit = false;
    this.speed = 1;
    this.offsetY = -10; this.offsetX = -10;
    this.blob = undefined;
    this.text = "";
    this.lastFrame = undefined;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.originalText = "";
    this.shrinkTimeline = null;
    var self = this;
    this.boundUpdateBlobState = function (e) { self.updateBlobState(e); };
    this.boundHandleScroll = function () { self.handleScroll(); };
    this.boundHandleMouseLeave = function (e) { self.handleMouseLeave(e); };
  }
  BlobCursor.EVENTS = ["mousemove", "mouseenter", "drag", "dragover", "mousedown", "mouseup", "pointermove", "pointerdown", "pointerup"];
  BlobCursor.prototype.handleScroll = function () {
    var self = this;
    if (!this.isScrolling && this.blob && this.blob.dataset.show === "true") {
      this.isScrolling = true;
      setTimeout(function () { self.shrinkBlob(); }, 100);
    }
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(function () {
      self.isScrolling = false;
      self.restoreBlob();
    }, 250);
  };
  BlobCursor.prototype.handleMouseLeave = function (e) {
    if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) this.hideBlob();
  };
  BlobCursor.prototype.init = function () {
    if (!document.querySelector("[data-showblob]") || window.innerWidth < 992) return;
    this.blob = document.createElement("div");
    this.blob.classList.add("blob");
    this.blob.dataset.show = "false";
    document.querySelector("body").appendChild(this.blob);
    var self = this;
    BlobCursor.EVENTS.forEach(function (ev) { document.addEventListener(ev, self.boundUpdateBlobState); });
    document.addEventListener("mouseleave", this.boundHandleMouseLeave);
    document.addEventListener("scroll", this.boundHandleScroll);
  };
  BlobCursor.prototype.animate = function () {
    var self = this;
    this.distX = this.mouseX - this.blobX;
    this.distY = this.mouseY - this.blobY;
    this.blobX = this.blobX + this.distX * this.speed;
    this.blobY = this.blobY + this.distY * this.speed;
    this.blob.style.left = this.blobX - this.offsetX + "px";
    this.blob.style.top = this.blobY - this.offsetY + "px";
    this.blob.style.position = "fixed";
    this.lastFrame = requestAnimationFrame(function () { self.animate(); });
  };
  BlobCursor.prototype.updatePosition = function (e) {
    this.mouseX = Math.min(e.clientX, window.innerWidth - 133);
    this.mouseY = e.clientY;
  };
  BlobCursor.prototype.hideBlob = function () {
    this.speed = 0;
    if (this.blob.dataset.show == "true") {
      this.speedInit = false;
      this.blob.dataset.show = "false";
      cancelAnimationFrame(this.lastFrame);
      gsap.to(this.blob, { scale: 0, duration: 0.3, ease: "power2.out" });
    }
    this.blob.innerHTML = "";
  };
  BlobCursor.prototype.showBlob = function () {
    var self = this;
    if (!this.speedInit) {
      window.setTimeout(function () { self.speed = 0.12; }, 1);
      this.speedInit = true;
    }
    this.blob.dataset.show = "true";
    gsap.set(this.blob, { scale: 0 });
    gsap.to(this.blob, { scale: 1, duration: 0.3, ease: "power2.out" });
    this.animate();
  };
  BlobCursor.prototype.updateBlobState = function (e) {
    var hov = Array.prototype.slice.call(document.querySelectorAll(":hover"));
    var el = hov[hov.length - 1];
    if (!el && e && e.clientX !== undefined && e.clientY !== undefined) {
      var fp = document.elementFromPoint(e.clientX, e.clientY);
      if (fp) el = fp;
    }
    if (el && el.closest("[data-showblob]") != null && el.closest("[data-hideblob]") == null) {
      var host = el.closest("[data-showblob]");
      this.text = host.dataset.showblob;
      this.originalText = this.text;
      if (!this.isScrolling) this.blob.innerHTML = this.text;
      this.blob.dataset.text = this.text;
      if (this.blob.dataset.show == "false") this.showBlob();
    } else {
      if (this.blob.dataset.show == "true") this.hideBlob();
      this.blob.innerHTML = "";
    }
    if (e) this.updatePosition(e);
  };
  BlobCursor.prototype.shrinkBlob = function () {
    if (this.blob.dataset.show !== "true") return;
    if (this.shrinkTimeline) this.shrinkTimeline.kill();
    this.blob.innerHTML = "";
    this.shrinkTimeline = gsap.timeline();
    this.shrinkTimeline.to(this.blob, { marginLeft: "0px", marginTop: "0px", scale: 0, transformOrigin: "center center", cursor: "none", duration: 0.2, ease: "power1.out" });
  };
  BlobCursor.prototype.restoreBlob = function () {
    var self = this;
    if (this.blob.dataset.show !== "true") return;
    if (this.shrinkTimeline) this.shrinkTimeline.kill();
    this.shrinkTimeline = gsap.timeline();
    this.shrinkTimeline.to(this.blob, { scale: 1, transformOrigin: "center center", cursor: "none", duration: 0.5, ease: "power1.out", onComplete: function () { self.blob.innerHTML = self.originalText; } });
  };
  BlobCursor.prototype.destroy = function () {
    var self = this;
    BlobCursor.EVENTS.forEach(function (ev) { document.removeEventListener(ev, self.boundUpdateBlobState); });
    document.removeEventListener("scroll", this.boundHandleScroll);
    document.removeEventListener("mouseleave", this.boundHandleMouseLeave);
    if (this.lastFrame) { cancelAnimationFrame(this.lastFrame); this.lastFrame = null; }
    if (this.scrollTimeout) { clearTimeout(this.scrollTimeout); this.scrollTimeout = null; }
    if (this.shrinkTimeline) { this.shrinkTimeline.kill(); this.shrinkTimeline = null; }
    if (this.blob && this.blob.parentNode) { this.blob.parentNode.removeChild(this.blob); this.blob = null; }
  };
  var blobInstance = null;
  function initBlob() {
    if (!document.querySelector("[data-showblob]") || window.innerWidth < 992) return null;
    if (blobInstance) { blobInstance.destroy(); blobInstance = null; }
    blobInstance = new BlobCursor();
    blobInstance.init();
    return blobInstance.blob;
  }
  window.addEventListener("resize", function () {
    if (window.innerWidth < 992) {
      if (blobInstance) { blobInstance.destroy(); blobInstance = null; }
    } else if (!blobInstance && document.querySelector("[data-showblob]")) {
      initBlob();
    }
  });

  /* ---------- Preloader module ---------- */
  function Preloader(root) {
    var wrapper = root.querySelector(".preloader__imageWrapper");
    var secOne = root.querySelector(".preloader__section--1");
    var secTwo = root.querySelector(".preloader__section--2");
    var wordOne = root.querySelector('[data-word="one"]');
    var wordTwo = root.querySelector('[data-word="two"]');
    var wordThree = root.querySelector('[data-word="three"]');
    var wordFour = root.querySelector('[data-word="four"]');
    var allRl = root.querySelectorAll(".preloader__wordRl");
    var pre = root.querySelector(".preloader") || root;
    var logoBox = root.querySelector(".preloader__logo");
    var vertical = false;
    var L, C, k, V, M, P;

    function fl(w) { return w ? w.querySelector(".preloader__wordFl") : null; }
    function rl(w) { return w ? w.querySelector(".preloader__wordRl") : null; }

    function preventScroll(e) { e.preventDefault(); }
    function lock() {
      document.body.classList.add("preloaderActive");
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      if (lenis) lenis.stop();
    }
    function unlock() {
      document.body.classList.remove("preloaderActive");
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      if (lenis) lenis.start();
    }

    function measure() {
      var e = secOne.offsetHeight, t = secTwo.offsetHeight;
      var o = wrapper.offsetWidth, a = secOne.offsetWidth, c = secTwo.offsetWidth;
      wrapper.style.height = e + t + "px";
      var d = o / 2, w = a / 2, f = c / 2, u = w - f;
      L = u > 0 ? -(w + d) : -(w + d) - u;
      C = u < 0 ? f + d : f + d + u;
      k = wrapper.offsetHeight / 2 + 20;
      V = -Math.abs((o - a) / 2 + 50);
      M = (o - c) / 2 + 50;
      var longest = 0;
      allRl.forEach(function (s) { longest = Math.max(longest, s.offsetWidth); });
      P = longest - 50;
      vertical = o + a + c > window.innerWidth;
    }

    function words() {
      var tl = gsap.timeline();
      gsap.set([secOne, secTwo], { x: P });
      gsap.set(root.querySelectorAll(".preloader__word"), { opacity: 1 });
      tl.from(fl(wordOne), { y: 10, filter: "blur(10px)", opacity: 0, duration: 0.6, ease: "power4.out" })
        .from([fl(wordTwo), fl(wordThree), fl(wordFour)], { y: 10, filter: "blur(10px)", opacity: 0, duration: 0.6, stagger: 0.2, ease: "power4.out" }, "-=0.2")
        .to([secOne, secTwo], { x: 0, duration: 1.3, ease: "power3.inOut" }, "-=0.3")
        .to(allRl, { x: 0, duration: 1.3, ease: "power3.inOut" }, "-=1.5");
      return tl;
    }

    function split() {
      var tl = gsap.timeline();
      if (vertical) {
        tl.to(secOne, { y: -k, x: V, duration: 1, ease: "power3.inOut" })
          .to(secTwo, { y: k, x: M, duration: 1, ease: "power3.inOut" }, "<");
      } else {
        tl.to(secOne, { x: L, duration: 1, ease: "power3.inOut" })
          .to(secTwo, { x: C, duration: 1, ease: "power3.inOut" }, "<");
      }
      return tl;
    }

    function reveal() {
      var tl = gsap.timeline();
      var sel = document.querySelector("[data-homeHeroImage-selected]");
      var notSel = document.querySelector('[data-homeHeroImage-notselected="2"]');
      tl.to(wrapper, { scale: 1, duration: 1, ease: "power3.inOut" });
      if (notSel) tl.to(notSel, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut" }, "-=0.4");
      if (sel) tl.to(sel, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" }, "-=0.5");
      tl.to(wrapper, { width: "calc(100vw + 80px)", height: "100vh", duration: 1.5, ease: "power3.inOut" }, "-=0.3")
        .to([secOne, secTwo], { scale: 0.8, opacity: 0, duration: 1, ease: "power3.inOut" }, "<");
      return tl;
    }

    function heroIn() {
      var tl = gsap.timeline();
      var details = document.querySelectorAll(".homeHero__detail");
      var title = document.querySelector(".homeHero__title");
      var cats = document.querySelector(".homeHero__categories");
      if (details.length) tl.from(details, { y: 20, opacity: 0, duration: 1, stagger: 0.2, ease: "power4.out" });
      if (title) tl.from(title, { y: 20, opacity: 0, filter: "blur(10px)", duration: 1, ease: "power4.out" }, "-=0.8");
      if (cats && window.matchMedia("(min-width: 767px), (pointer: fine)").matches) {
        tl.from(cats, { x: "20rem", duration: 1.2, ease: "power4.out", onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } }, "-=1.2");
      }
      return tl;
    }

    /* 로고 액션 (js/logointro.js). 한 번만 재생한 뒤 로고를 흐리게 지움 */
    /* fromWord 가 true 면 파도가 거의 멈춘 뒤, 취 글자 0.4초 전(T.word - 700)부터 재생 */
    function logo(fromWord) {
      var tl = gsap.timeline();
      if (!logoBox || !window.LogoIntro) return tl;
      var play = window.LogoIntro(logoBox, "#fff");
      var t0 = fromWord ? Math.max(0, play.T.word - 700) : 0;
      var st = { t: t0 };
      play.frame(t0);
      tl.to(st, { t: play.T.end, duration: (play.T.end - t0) / 1000, ease: "none", onUpdate: function () { play.frame(st.t); } })
        .to(logoBox, { autoAlpha: 0, duration: 0.3, ease: "power2.out" });
      return tl;
    }

    function hide() {
      var tl = gsap.timeline();
      tl.to(pre, { autoAlpha: 0, duration: 0.1 });
      var bg = document.querySelector(".homeHero__mainBackground");
      if (bg) tl.from(bg, { filter: "brightness(1)", duration: 1 });
      return tl;
    }

    function full() {
      lock();
      measure();
      gsap.set(wrapper, { scale: 0 });
      var master = gsap.timeline({
        onStart: function () { sessionStorage.setItem("preloaderShow", "true"); },
        onComplete: unlock
      });
      /* 확대 전환(reveal) 대신 로고 재생 후 프리로더를 페이드 아웃 */
      master.add(logo())
        .to(pre, { autoAlpha: 0, duration: 0.8, ease: "power2.inOut" })
        .add(heroIn(), "-=0.4");
    }

    function revisit() {
      measure();
      var master = gsap.timeline();
      master.add(logo(true))
        .to(pre, { autoAlpha: 0, duration: 0.3 });
    }

    return {
      init: function () {
        if (!wrapper || !secOne || !secTwo || !wordOne || !wordTwo || !wordThree || !wordFour) {
          gsap.set(pre, { autoAlpha: 0 });
          return;
        }
        /* 상단 로고 클릭 시 새로고침 때와 같은 로고 재생 (홈에서는 이동 없이 바로 재생) */
        window.__replayLogo = function () {
          if (lenis) lenis.scrollTo(0, { immediate: true });
          window.scrollTo(0, 0);
          if (logoBox) logoBox.innerHTML = "";
          gsap.set(logoBox, { autoAlpha: 1 });
          gsap.set(pre, { autoAlpha: 1 });
          revisit();
        };
        if (sessionStorage.getItem("preloaderShow") === "true") revisit();
        else setTimeout(full, 150);
      }
    };
  }

  /* ---------- NavigationMain module ---------- */
  function NavigationMain(root) {
    var items = root.querySelectorAll(".marketsMenu__item");
    var hoverTl = null, hoverState = null;
    var hoverIndex = 1, clicking = false, activeIndex = 1, lockUntil = 0;
    var total = items.length;
    var wrap = root.querySelector(".marketsMenu__wrapper");
    var COL_SMALL = "2rem", COL_BIG = "13rem";

    function currentIndex() {
      var cur = root.querySelector(".marketsMenu__item[current-menu]");
      var idx = cur ? cur.dataset.marketindex : undefined;
      items.forEach(function (o, n) {
        if (o.getAttribute("data-marketState") === "active" || o.hasAttribute("data-selected") ||
            o.dataset.current === "true" || o.classList.contains("is-current")) idx = n + 1;
      });
      return idx;
    }
    function columns(count, active) {
      var o = Number(count) || 0;
      if (o <= 0) return "";
      var n = Math.min(Math.max(Number(active) || 1, 1), o) - 1;
      var d = new Array(o).fill(COL_SMALL);
      d[n] = COL_BIG;
      return d.join(" ");
    }
    activeIndex = currentIndex();
    items.forEach(function (e, t) {
      e.setAttribute("data-marketState", t === activeIndex - 1 ? "active" : "inactive");
    });
    if (wrap) gsap.set(wrap, { gridTemplateColumns: columns(total, activeIndex) });

    function setState(e) {
      if (!e) return;
      hoverIndex = e.dataset.marketindex;
      items.forEach(function (t) { if (t !== e) t.setAttribute("data-marketState", "inactive"); });
      e.setAttribute("data-marketState", "active");
    }
    function growTo(e) {
      if (!e) return;
      setState(e);
      var tl = gsap.timeline();
      if (window.matchMedia("(min-width: 768px)").matches) {
        tl.to(wrap, { gridTemplateColumns: columns(total, hoverIndex), duration: 0.5, ease: "power1.out" });
      }
      return tl;
    }
    function growBack() {
      var e = Number(activeIndex) || 1;
      items.forEach(function (o, n) {
        o.setAttribute("data-marketState", n === e - 1 ? "active" : "inactive");
      });
      var tl = gsap.timeline();
      if (window.matchMedia("(min-width: 768px)").matches) {
        tl.to(wrap, { gridTemplateColumns: columns(total, e), duration: 0.5, ease: "power1.out" });
      }
      return tl;
    }

    function hamburgerTl() {
      var btn = root.querySelector("[data-menu]");
      gsap.set(".menuLineThree", { opacity: 0 });
      var tl = gsap.timeline({
        duration: 1, paused: true,
        onReverseComplete: function () {
          btn.removeAttribute("data-menu");
          gsap.set(".navigationMain__topBarLogo > svg", { clearProps: "all" });
          gsap.set(".navigationMain__topBarLogo", { clearProps: "all" });
        }
      });
      tl.to("[data-menu]", { padding: "0 0.2rem 0 0", duration: 0.1 }, "<")
        .to(".menuLine", { width: "2.1rem", duration: 0.2 }, "<")
        .to(".menuLineTwo", { y: "4px", rotate: -45 }, "-=1")
        .to(".menuLinesGroup", { y: "-4px", rotate: 45 }, "<")
        .to(".menuLineOne", { attr: { d: "M4 11H11" }, duration: 0.5 }, "<")
        .to(".menuLineThree", { opacity: 1, attr: { d: "M18 11H25" }, duration: 0.5 }, "<")
        .to(".navigationMain__topBarLogo > svg", { color: "white", duration: 0.1 })
        .to(".navigationMain__topBarLogo", { background: "none", backdropFilter: "blur(0px)", duration: 0.1 });
      return tl;
    }

    function dropdown() {
      var btn = root.querySelector("[data-menu]");
      var dd = root.querySelector(".navigationMain__dropDown");
      var topBar = root.querySelector(".navigationMain__topBar");
      if (!btn || !dd) return;
      var n = {
        mainLine: dd.querySelectorAll(".navigationMain__dropDownLine"),
        menu: dd.querySelectorAll(".navigationMain__mainMenu > li"),
        mainMenu: dd.querySelector(".navigationMain__mainMenu"),
        companyMenu: dd.querySelectorAll(".navigationMain__subMenu--company > li"),
        exploreMenu: dd.querySelectorAll(".navigationMain__subMenu--explore > li"),
        explore: dd.querySelectorAll(".navigationMain__subMenu--explore"),
        contact: dd.querySelector(".navigationMain__contactOne"),
        contactTwo: dd.querySelector(".navigationMain__contactTwo"),
        social: dd.querySelectorAll(".navigationMain__social"),
        headings: dd.querySelectorAll("h2")
      };
      gsap.set(dd, { top: "100vh" });
      gsap.set(n.mainLine, { opacity: 0, transformOrigin: "right" });
      gsap.set(n.companyMenu, { y: 10, opacity: 0 });
      gsap.set(n.exploreMenu, { y: 10, opacity: 0 });
      gsap.set(n.menu, { y: 10, filter: "blur(5px)", opacity: 0 });
      gsap.set([n.contact, n.contactTwo, n.social, n.headings], { opacity: 0 });
      var subItems = document.querySelector(".navigationMain__subItems");
      var tl = gsap.timeline({
        paused: true,
        onStart: function () {
          if (subItems) gsap.to(subItems, { opacity: 0, duration: 0.3 });
          if (topBar) topBar.dataset.menuOpen = "true";
        },
        onComplete: function () { gsap.set(n.menu, { clearProps: "all" }); },
        onReverseComplete: function () {
          if (topBar) topBar.dataset.menuOpen = "false";
          if (subItems) gsap.to(subItems, { opacity: 1, duration: 0.3, onComplete: function () { gsap.set(subItems, { clearProps: "all" }); } });
        }
      });
      tl.fromTo(dd, { top: "100vh" }, { top: "0vh", display: "grid", duration: 1.5, ease: "power4.inOut" })
        .to(n.mainLine, { opacity: 0.3, duration: 0.8, ease: "power2.out" }, "-=0.8")
        .to(n.headings, { opacity: 1, duration: 0.2, stagger: 0.2 }, "-=0.5")
        .to(n.menu, { y: 0, filter: "blur(0px)", opacity: 1, duration: 0.5, stagger: 0.1 }, "<")
        .from([n.mainMenu, n.explore], { borderBottom: "1px solid rgba(255, 255, 255, 0)", duration: 0.4, stagger: 0.1 }, "-=0.6")
        .to(n.exploreMenu, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 }, "-=1")
        .to(n.companyMenu, { y: 0, opacity: 1, duration: 0.5, delay: 0.1, stagger: 0.05 }, "-=1")
        .to(n.social, { opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.8")
        .to(n.contact, { opacity: 1, duration: 0.4 }, "-=0.4")
        .to(n.contactTwo, { opacity: 1, duration: 0.4 }, "-=0.4");

      var burger = hamburgerTl();
      var lockTimer = null, lockY = 0;
      function close() {
        var nav = root.querySelector("#mainNavigation");
        burger.timeScale(1.5).reverse();
        tl.timeScale(1.5).reverse();
        btn.setAttribute("data-menu", "close");
        btn.setAttribute("aria-expanded", "false");
        if (nav) nav.setAttribute("aria-hidden", "true");
        if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
        btn.focus();
      }
      btn.addEventListener("click", function () {
        var nav = root.querySelector("#mainNavigation");
        if (btn.getAttribute("data-menu") === "open") {
          close();
        } else {
          burger.timeScale(1).play();
          tl.timeScale(1).play();
          btn.setAttribute("data-menu", "open");
          btn.setAttribute("aria-expanded", "true");
          if (nav) {
            nav.setAttribute("aria-hidden", "false");
            setTimeout(function () {
              var g = nav.querySelector(".navigationMain__mainMenuItem");
              if (g) g.focus();
            }, 100);
          }
          lockY = window.scrollY;
          lockTimer = setInterval(function () { window.scroll(0, lockY); }, 1);
        }
      });
      document.addEventListener("keydown", function (p) {
        if (p.key === "Escape" && btn.getAttribute("data-menu") === "open") close();
      });
    }

    function hoverBlur() {
      if (document.body.dataset.istoch === "true") return;
      var groups = [
        root.querySelectorAll(".navigationMain__mainMenuWrapper"),
        root.querySelectorAll(".navigationMain__subMenuWrapper"),
        root.querySelectorAll(".navigationMain__companyMenuWrapper")
      ];
      groups.forEach(function (group) {
        group.forEach(function (u) {
          u.addEventListener("mouseenter", function () {
            group.forEach(function (s) { if (s !== u) s.dataset.blurred = "true"; });
          });
          u.addEventListener("mouseleave", function () {
            group.forEach(function (s) { delete s.dataset.blurred; });
          });
        });
      });
    }

    function logoOnScroll() {
      var logo = root.querySelector(".navigationMain__topBarLogo");
      if (!logo) return;
      logo.addEventListener("click", function (ev) {
        try { sessionStorage.setItem("preloaderShow", "true"); } catch (x) {}
        if (window.__replayLogo) { ev.preventDefault(); window.__replayLogo(); }
      });
      // 숨김 상태가 바뀔 때만 한 번 움직인다 (스크롤마다 애니메이션이 쌓여 버벅이던 것 방지)
      var logoHidden = null;
      window.addEventListener("scroll", function () {
        var h = window.scrollY > 10;
        if (h === logoHidden) return;
        logoHidden = h;
        gsap.to(logo, { opacity: h ? 0 : 1, duration: 0.2, pointerEvents: h ? "none" : "auto", overwrite: true });
      });
    }

    function marketsOnScroll() {
      var present = !!document.querySelector("[data-marketsmenu='1']");
      var menuHidden = null;
      window.addEventListener("scroll", function () {
        if (!present) return;
        var h = window.scrollY > 10;
        if (h === menuHidden) return;
        menuHidden = h;
        gsap.to(".marketsMenu", { opacity: h ? 0 : 1, duration: 0.2, display: h ? "none" : "flex", overwrite: true });
      });
    }

    function historyBack() {
      var e = document.querySelector("[data-history-back]");
      if (e) e.addEventListener("click", function (t) {
        t.preventDefault();
        if (window.history.length > 1) window.history.back();
        else if (e.href) window.location.href = e.href;
      });
    }

    function marketsHover() {
      items.forEach(function (e) {
        e.addEventListener("mouseenter", function () {
          if (Date.now() < lockUntil || window.innerWidth < 768) return;
          if (hoverTl) { hoverTl.kill(); hoverTl = null; }
          hoverTl = growTo(e);
          setState(e);
        });
        e.addEventListener("click", function (t) {
          clicking = true;
          t.preventDefault();
          activeIndex = Number(e.dataset.marketindex) || activeIndex;
          lockUntil = Date.now() + 350;
          if (hoverTl) { hoverTl.kill(); hoverTl = null; }
          hoverTl = growBack();
          setState(items[activeIndex - 1]);
          setTimeout(function () { clicking = false; }, 500);
          /* LPAS는 swup이 이어서 이동. 여기서는 바가 줄어드는 걸 보여준 뒤 페이드 전환으로 이동 */
          var link = e.querySelector("a[href]");
          if (link && !e.hasAttribute("current-menu")) {
            try { sessionStorage.setItem("vtType", "fade"); } catch (x) {}
            setTimeout(function () { window.location.href = link.href; }, 350);
          }
        });
      });
      if (wrap) wrap.addEventListener("mouseleave", function () {
        if (window.innerWidth < 768) return;
        if (hoverTl) { hoverTl.kill(); hoverTl = null; }
        hoverTl = growBack();
        setState(items[activeIndex - 1]);
      });
    }

    return {
      init: function () {
        hoverBlur();
        dropdown();
        marketsOnScroll();
        marketsHover();
        historyBack();
        logoOnScroll();
      }
    };
  }

  /* ---------- HomeHero module ---------- */
  function HomeHero(root) {
    var cards = document.querySelectorAll(".homeHero__card");
    var hero = document.querySelector(".homeHero");
    var overlay = document.querySelector(".homeHero__mainOverlay");
    var main = document.querySelector(".homeHero__main");
    var BREAK = 768;
    var touch = document.documentElement.getAttribute("data-istoch");

    function throttle(fn, wait) {
      var last = 0;
      return function () {
        var now = Date.now();
        if (now - last >= wait) { last = now; fn.apply(this, arguments); }
      };
    }

    function setupMotion() {
      gsap.context(function () {
        var mm = gsap.matchMedia();

        mm.add("(max-width: 767px), (pointer: coarse) and (hover: none)", function () {
          var blob = document.querySelector(".blob");
          if (blob) gsap.set(blob, { display: "none" });
          cards.forEach(function (e) {
            var t = {
              subImage: e.querySelectorAll(".homeHero__cardImage--small"),
              title: e.querySelectorAll(".homeHero__cardTitle"),
              subTitle: e.querySelectorAll(".homeHero__cardSubtitle"),
              count: e.querySelectorAll(".homeHero__cardCount"),
              subPage: e.querySelectorAll(".homeHero__subPage"),
              imageBox: e.querySelectorAll(".homeHero__cardImage"),
              imgEl: e.querySelectorAll(".homeHero__cardImage > img"),
              button: e.querySelectorAll(".buttonCircle--plus")
            };
            gsap.set(t.imgEl, { scale: 1.2, force3D: true });
            gsap.set(t.subImage, { transformOrigin: "left left" });
            var o = gsap.timeline({
              scrollTrigger: {
                trigger: e,
                start: "15% 80%",
                end: "15% 80%",
                toggleActions: "play none reverse none",
                onEnter: function () {
                  if (overlay) gsap.to(overlay, { backgroundColor: "rgba(0,0,0,0.3)", duration: 1 });
                },
                onLeaveBack: function () {
                  o.timeScale(2).reverse();
                  if (overlay) gsap.to(overlay, { backgroundColor: "transparent", duration: 1 });
                }
              }
            });
            o.from(t.title, { opacity: 0, y: 10, duration: 0.5 })
              .add(t.count.length ? gsap.from(t.count, { opacity: 0, y: 10, duration: 0.5 }) : gsap.to({}, { duration: 0.5 }))
              .from(t.subTitle, { opacity: 0, y: 10, duration: 0.5 }, "-=0.5")
              .from(t.subImage, { opacity: 0, width: 0, duration: 0.8 }, "-=0.2")
              .from(t.imageBox, { xPercent: 120, duration: 1 }, "-=1.5")
              .to(t.imgEl, { scale: 1, duration: 1 }, "-=1")
              .to(t.button, { opacity: 1, duration: 0.5 });
            if (t.subPage.length) o.from(t.subPage, { opacity: 0, y: 10, duration: 0.5, stagger: 0.1 }, "-=1");
          });
        });

        mm.add("(min-width: 768px) and (pointer: fine)", function () {
          initBlob();
          var panels = gsap.utils.toArray(".homeHero__categories > div");
          var fadeMain = main ? gsap.quickTo(main, "opacity", { duration: 0.3, ease: "power1.out" }) : null;
          var dimmed = false, videoDropped = false;

          var master = gsap.timeline({
            scrollTrigger: {
              id: "homeHero",
              trigger: hero,
              start: "top top",
              pin: true,
              scrub: 0.5,
              pinSpacer: false,
              invalidateOnRefresh: true,
              end: function () { return hero.offsetWidth * 3; },
              onUpdate: function (st) {
                if (!fadeMain) return;
                var a = st.progress > 0.9;
                if (a !== dimmed) { fadeMain(a ? 0 : 1); dimmed = a; }
                var vid = document.querySelector(".homeHero__mainBackground");
                if (vid && vid.tagName === "VIDEO") {
                  if (st.progress > 0.95 && !videoDropped) {
                    vid.pause(); vid.removeAttribute("src"); vid.load(); videoDropped = true;
                  } else if (st.progress < 0.9 && videoDropped) {
                    var src = vid.getAttribute("data-video-src");
                    if (src) { vid.src = src; vid.load(); vid.play().catch(function () {}); }
                    videoDropped = false;
                  }
                }
              }
            }
          });
          master.to(panels, { xPercent: -100 * (panels.length - 0.8), ease: "none", duration: 2, force3D: true })
            .to(main || ".homeHero__main", { xPercent: -0, ease: "none", duration: 1 }, "<")
            .to(overlay, { backgroundColor: "rgba(0, 0, 0, 0.6)" }, "<");

          cards.forEach(function (card, idx) {
            var t = {
              title: card.querySelectorAll(".homeHero__cardTitle"),
              subTitle: card.querySelectorAll(".homeHero__cardSubtitle"),
              count: card.querySelectorAll(".homeHero__cardCount"),
              subPage: card.querySelectorAll(".homeHero__subPage"),
              imgEl: card.querySelectorAll(".homeHero__cardImage > picture > img"),
              button: card.querySelectorAll(".buttonCircle--plus")
            };
            var c = gsap.timeline({ paused: true });
            var passed = false;
            var S = gsap.timeline({
              scrollTrigger: {
                id: "homeHero",
                trigger: card,
                start: "10% 90%",
                end: idx === cards.length - 1 ? "right right" : "250% right",
                scrub: 1,
                containerAnimation: master,
                invalidateOnRefresh: true,
                refreshPriority: -1,
                onUpdate: function (st) {
                  var p = st.progress > 0.2;
                  if (p !== passed) {
                    if (p) c.timeScale(1).play();
                    else c.timeScale(2).reverse();
                    passed = p;
                  }
                }
              }
            });
            if (idx === 0) S.from(card, { filter: "brightness(0.5)", duration: 0.6, ease: "power2.out" }, "<");
            S.from(card, { gridTemplateRows: "50% 50%", duration: 1 }, "<")
              .from(t.imgEl, { scale: 1.3, duration: 2 }, "-=1");
            c.from(t.title, { filter: "blur(10px)", opacity: 0, y: 10, duration: 0.5 })
              .add(t.count.length ? gsap.from(t.count, { opacity: 0, y: 10, duration: 0.5 }) : gsap.to({}, { duration: 0.5 }))
              .from(t.subTitle, { opacity: 0, y: 10, duration: 0.5 }, "-=0.5")
              .to(t.button, { opacity: 1, duration: 0.5 });
            if (t.subPage.length) c.from(t.subPage, { opacity: 0, y: 10, duration: 0.5, stagger: 0.1 }, "-=1");
          });
        });
      });
    }

    function detailScroll() {
      var btn = document.querySelector(".homeHero__detail--three");
      if (!btn) return;
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (touch === "true" || window.innerWidth < BREAK) {
          window.scrollBy({ top: window.innerHeight * 0.6, behavior: "smooth" });
        } else {
          var card = cards[0];
          window.scrollBy({ top: card ? card.offsetWidth : window.innerWidth, behavior: "smooth" });
        }
      });
    }

    function titleHover() {
      if (touch === "true") return;
      var content = document.querySelector(".homeHero__titleContent");
      var title = document.querySelector(".homeHero__title");
      var btn = document.querySelector(".homeHero__title .buttonCircle--plus");
      if (!content || !title || !btn) {
        if (btn) btn.style.display = "none";
        return;
      }
      var vsrc = content.getAttribute("data-video-src");
      if (vsrc) {
        title.addEventListener("mouseenter", function () {
          if (window.innerWidth >= BREAK && !content.getAttribute("src")) content.setAttribute("src", vsrc);
        });
      }
      gsap.set(content, { scale: 1.1 });
      var tl = gsap.timeline({ paused: true });
      tl.to(content, { scale: 1, opacity: 1, display: "block", duration: 0.5 });
      btn.addEventListener("mouseenter", function () { tl.timeScale(1).play(); });
      btn.addEventListener("mouseleave", function () { tl.timeScale(1.5).reverse(); });
    }

    function splitSubtitles() {
      document.querySelectorAll(".homeHero__cardSubtitle").forEach(function (el) {
        if (el.querySelector("br")) return; /* 줄바꿈을 직접 지정한 문구는 그대로 둠 */
        var words = el.textContent.trim().split(/\s+/);
        if (words.length < 2) return;
        var half = Math.ceil(words.length / 2);
        el.innerHTML = "<span>" + words.slice(0, half).join(" ") + "</span><br><span>" + words.slice(half).join(" ") + "</span>";
      });
    }

    function selectedImages() {
      document.querySelectorAll("[data-homeHeroImage-selected] img").forEach(function (img) {
        var ss = img.getAttribute("data-srcset"), s = img.getAttribute("data-src");
        if (ss) img.setAttribute("srcset", ss);
        if (s) img.setAttribute("src", s);
      });
    }

    function playBackground() {
      var bg = document.querySelector(".homeHero__mainBackground");
      if (!bg || bg.tagName !== "VIDEO") return;
      var src = bg.getAttribute("data-video-src");
      if (src && !bg.getAttribute("src")) { bg.src = src; bg.load(); }
      bg.muted = true;
      bg.playsInline = true;
      var p = bg.play();
      if (p && p.catch) p.catch(function () {});
    }

    return {
      init: function () {
        splitSubtitles();
        detailScroll();
        titleHover();
        selectedImages();
        playBackground();
        setupMotion();
      }
    };
  }

  /* ---------- BlockIntroGeneral module ---------- */
  function BlockIntroGeneral(root) {
    return {
      init: function () {
        var title = root.querySelector(".blockIntroGeneral__title");
        var rest = root.querySelectorAll(".blockIntroGeneral__tagline, .blockIntroGeneral__text, .blockIntroGeneral__button");
        var tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 75%" } });
        gsap.set(title, { y: 50, opacity: 0, filter: "blur(10px)" });
        gsap.set(rest, { opacity: 0 });
        tl.to(title, { y: 0, opacity: 1, duration: 1, filter: "blur(0px)", ease: "power2.out" })
          .to(rest, { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.5");
      }
    };
  }

  /* ---------- BlockProjectsHighlight module ---------- */
  function BlockProjectsHighlight(root) {
    function equalize() {
      if (window.innerWidth < 998) return;
      root.querySelectorAll(".blockProjectsHighlight__smallImagesWrapper").forEach(function (t) {
        var cards = t.querySelectorAll(".imageCard");
        if (!cards.length) return;
        var min = Math.min.apply(null, Array.from(cards).map(function (s) { return s.offsetHeight; }));
        cards.forEach(function (s) { s.style.height = min + "px"; });
        t.style.setProperty("--sticky-offset", window.innerHeight - min - window.innerHeight * 0.15 + "px");
      });
    }
    function whenLoaded() {
      var pending = Array.from(root.querySelectorAll(".imageCard img")).filter(function (e) { return !e.complete; });
      if (!pending.length) { equalize(); return; }
      var done = 0;
      function tick() { done++; if (done >= pending.length) equalize(); }
      pending.forEach(function (e) {
        e.addEventListener("load", tick, { once: true });
        e.addEventListener("error", tick, { once: true });
      });
    }
    return {
      init: function () {
        whenLoaded();
        window.addEventListener("resize", equalize);
      }
    };
  }

  /* ---------- GlobalLatestOverview module ---------- */
  function GlobalLatestOverview(root) {
    var active = false;
    var touchFlag = document.documentElement.getAttribute("data-istoch");
    var teardown = function () {};
    function setup() {
      if (window.innerWidth < 991 || touchFlag === "true") { teardown(); active = false; return; }
      if (active) return;
      active = true;
      var list = root.querySelector(".globalLatestOverview__list");
      var container = root.querySelector(".globalLatestOverview__imageContainer");
      if (!list || !container) return;
      var rows = list.querySelectorAll("li");
      var srcs = [];
      root.querySelectorAll(".globalLatestOverview__images img").forEach(function (e) { srcs.push(e.getAttribute("src")); });
      function show() {
        gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.2 }).then(function () { container.classList.add("on"); });
      }
      function hideC() {
        gsap.fromTo(container, { opacity: 1 }, { opacity: 0, duration: 0.3 }).then(function () {
          container.classList.remove("on");
          Array.from(container.children).forEach(function (e) { e.remove(); });
        });
      }
      gsap.set(container, { yPercent: -50 });
      var moveY = gsap.quickTo(container, "y", { duration: 0.5, ease: "power4" });
      function move(e) { moveY(e.clientY + window.scrollY + container.offsetHeight / 1.75); }
      var handlers = [];
      rows.forEach(function (row, i) {
        var h = function () { push(i); };
        row.addEventListener("mouseenter", h);
        handlers.push({ row: row, handler: h });
      });
      function push(i) {
        if (!srcs[i]) return;
        var d = document.createElement("div"), img = document.createElement("img");
        img.src = srcs[i];
        d.appendChild(img);
        container.appendChild(d);
        gsap.to([d, img], { y: 0, duration: 0.6, ease: "expo.inOut" });
        if (container.children.length > 20) container.children[0].remove();
      }
      list.addEventListener("mouseenter", show);
      list.addEventListener("mouseleave", hideC);
      list.addEventListener("mousemove", move);
      teardown = function () {
        list.removeEventListener("mouseenter", show);
        list.removeEventListener("mouseleave", hideC);
        list.removeEventListener("mousemove", move);
        handlers.forEach(function (h) { h.row.removeEventListener("mouseenter", h.handler); });
        container.classList.remove("on");
        Array.from(container.children).forEach(function (e) { e.remove(); });
      };
    }
    window.addEventListener("resize", setup);
    return { init: setup };
  }

  /* ---------- NavigationFooter module ---------- */
  function NavigationFooter(root) {
    var tl = null, menu = null, plus = null, items = null;
    function scrollTop() {
      root.querySelectorAll(".navigationFooter__bottomText").forEach(function (u) {
        u.addEventListener("click", function () {
          if (lenis) lenis.scrollTo(0);
          else window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
    }
    function reset() {
      if (tl) tl.kill();
      if (menu && plus) { gsap.set(plus, { clearProps: "rotate" }); menu.dataset.footerMenu = "close"; }
      if (items) gsap.set(items, { clearProps: "all" });
    }
    function enter() { if (menu.dataset.footerMenu !== "open") gsap.to(plus, { rotate: 90, duration: 0.3, ease: "power1.inOut" }); }
    function leave() { if (menu.dataset.footerMenu !== "open") gsap.to(plus, { rotate: 0, duration: 0.3, ease: "power1.inOut" }); }
    function toggle() {
      if (menu.dataset.footerMenu === "open") {
        menu.dataset.footerMenu = "close";
        gsap.to(plus, { rotate: 90, duration: 0.1, ease: "power1.inOut", onComplete: function () { gsap.set(plus, { clearProps: "rotate" }); } });
        tl.timeScale(1.5).reverse();
      } else {
        menu.dataset.footerMenu = "open";
        gsap.to(plus, { rotate: 135, duration: 0.2, ease: "power1.inOut" });
        tl.play();
      }
    }
    var bound = false;
    function setupMenu() {
      menu = root.querySelector("[data-footer-menu]");
      if (!menu) return;
      plus = menu.querySelector(".icon-plus");
      items = menu.querySelectorAll(".navigationFooter__bottomMenuItem");
      if (window.innerWidth < 768) { reset(); return; }
      if (tl) tl.kill();
      tl = gsap.timeline({ paused: true });
      gsap.set(items, { width: "0", opacity: 0, marginLeft: "-20px" });
      tl.to(items, { marginLeft: "0px", duration: 0.3 })
        .to(items, { width: "auto", opacity: 1, stagger: 0.1, duration: 0.3 }, "-=0.3");
      if (!bound) {
        menu.addEventListener("mouseenter", enter);
        menu.addEventListener("mouseleave", leave);
        menu.addEventListener("click", toggle);
        bound = true;
      }
    }
    function parallax() {
      var img = root.querySelector(".navigationFooter__mainImage");
      if (!img) return;
      gsap.timeline({
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true, id: "footerImage" }
      }).to(img, { yPercent: -20, ease: "none", duration: 1 });
    }
    return {
      init: function () {
        parallax();
        setupMenu();
        scrollTop();
        window.addEventListener("resize", setupMenu);
      }
    };
  }

  /* ---------- generic animations (main.js: Yi) ---------- */
  function GenericAnimations() {
    var parallaxConfig = {
      desktopBreakpoint: 1024,
      object: { threshold: 0.25, multiplier: 400, minPercent: -0.05, maxPercent: -1e-6 },
      image: { threshold: 0.25, multiplier: 150, minPercent: -0.1, maxPercent: -1e-6 }
    };
    function animate(t) {
      var kind = t.dataset.fadeinanimation;
      if (kind === "imageAppear") t.classList.add("transition--imageAppear");
      else if (kind === "fadeInUp") {
        t.classList.add("transition--fadeInUp");
        setTimeout(function () {
          t.removeAttribute("data-fadeinanimation");
          t.classList.remove("transition--fadeInUp");
        }, 1000);
      }
    }
    var fadeObs = new IntersectionObserver(function (entries, obs) {
      var c = 0;
      entries.forEach(function (o) {
        if (o.isIntersecting) {
          setTimeout(function () { animate(o.target); }, c * 100);
          c += 1;
          obs.unobserve(o.target);
        }
      });
    }, { threshold: 0 });
    document.querySelectorAll("[data-fadeinanimation]").forEach(function (t) { fadeObs.observe(t); });

    var imgObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (o) {
        if (o.isIntersecting) { o.target.dataset.imageanimate = "true"; obs.unobserve(o.target); }
      });
    }, { threshold: 0 });
    document.querySelectorAll("[data-imageanimate]").forEach(function (s) { imgObs.observe(s); });

    function setupParallax(t, cfg, desktopOnly, isImage) {
      t.style.willChange = "transform";
      t.style.transition = "none";
      var running = false;
      function frame() {
        var base = (t.closest('[class*="module"]') || t.parentElement).offsetTop;
        var v = (base - window.scrollY) / (window.innerHeight * 2) * cfg.threshold;
        var u = Math.min(Math.max(v, cfg.minPercent), cfg.maxPercent);
        t.style.transform = "translateY(" + (isImage ? u * cfg.multiplier * -1 : u * cfg.multiplier) + "%)";
      }
      function on() { if (!running) { running = true; window.addEventListener("scroll", frame); frame(); } }
      function off() { if (running) { running = false; window.removeEventListener("scroll", frame); } }
      new IntersectionObserver(function (entries) {
        entries.forEach(function (s) {
          var visible = s.intersectionRatio > 0;
          var desktop = window.innerWidth >= parallaxConfig.desktopBreakpoint;
          (desktopOnly ? visible && desktop : visible) ? on() : off();
        });
      }).observe(t);
    }
    document.querySelectorAll("[data-animate-parallax]").forEach(function (c) { setupParallax(c, parallaxConfig.object, true, false); });
    document.querySelectorAll("[data-animate-parallax--image]").forEach(function (c) { setupParallax(c, parallaxConfig.image, false, true); });
  }

  /* ---------- hash links (main.js: ir) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (t) {
      var target = document.querySelector(this.getAttribute("href"));
      if (target) { t.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
    });
  });

  /* ---------- BlockHeaderMarkets module (subpage header reveal) ---------- */
  function BlockHeaderMarkets(root) {
    return {
      init: function () {
        var label = root.querySelector(".blockHeaderMarkets__contentLabel");
        var sub = root.querySelector(".blockHeaderMarkets__contentSubtitle");
        var title = root.querySelector(".blockHeaderMarkets__title");
        var items = root.querySelectorAll(".blockHeaderMarkets__subpageItem");
        var btn = root.querySelector(".blockHeaderMarkets__button");
        var img = root.querySelector(".blockHeaderMarkets__image");
        var overlay = root.querySelector(".blockHeaderMarkets__imageOverlay");
        var wrap = root.querySelector(".blockHeaderMarkets__imageWrapper");
        /* LPAS script-CLp9Hrj4.js 그대로: 제목 블러 해제 후 부제, 라벨, 버튼 순서 */
        var tl = gsap.timeline();
        if (title) gsap.set(title, { filter: "blur(10px)", opacity: 0, y: 10 });
        if (btn) gsap.set(btn, { y: 5 });
        if (items.length) gsap.set(items, { opacity: 0, y: 5 });
        if (title) tl.to(title, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, delay: 0.5 });
        if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.3 }, "-=0.4");
        if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.3 }, "-=0.4");
        if (items.length) tl.to(items, { opacity: 1, y: 0, duration: 0.2, stagger: 0.1 }, "-=0.2");
        if (btn) tl.to(btn, { opacity: 1, y: 0, duration: 0.3 }, "-=0.4");
        /* 홈 카드에서 올라오며 들어올 때 이미지 시차 (swup-config markets in) */
        if (wrap && window.__vtIncoming === "market") gsap.fromTo(wrap, { yPercent: 50 }, { yPercent: 0, duration: 1.5, ease: "power3.out", delay: 0.2 });
        /* 스크롤하면 이미지가 살짝 올라가고 어두운 막이 걷힘 */
        if (img) {
          var stl = gsap.timeline({ scrollTrigger: { trigger: "body", start: "top top", end: "+=" + window.innerHeight * 1.2, scrub: true } });
          stl.to(img, { yPercent: -10, ease: "none", duration: 1 });
          if (overlay) stl.to(overlay, { opacity: 0, duration: 0.5 }, "<");
        }
        if (btn) {
          btn.addEventListener("click", function () {
            var next = root.nextElementSibling;
            if (!next) return;
            if (lenis) lenis.scrollTo(next); else next.scrollIntoView({ behavior: "smooth" });
          });
        }
      }
    };
  }

  /* ---------- BlockIntroDouble module (single tab, line reveal) ---------- */
  function BlockIntroDouble(root) {
    return {
      init: function () {
        var line = root.querySelector(".blockIntroDouble__headerLine");
        var active = root.querySelector(".blockIntroDouble__headerButton");
        if (!line || !active) return;
        gsap.set(line, { width: active.offsetWidth });
        gsap.to(line, { opacity: 1, duration: 0.6, scrollTrigger: { trigger: root, start: "top 85%" } });
      }
    };
  }

  /* ---------- BlockProcessCardSlider module (swiper 대신 가로 스크롤) ---------- */
  function BlockProcessCardSlider(root) {
    return {
      init: function () {
        var track = root.querySelector(".blockProcessCardSlider__contentSectionWrapper");
        if (!track) return;
        var cards = Array.from(track.querySelectorAll(".cardItem"));
        var items = Array.from(root.querySelectorAll(".blockProcessCardSlider__listItem"));
        track.style.overflowX = "auto";
        track.style.scrollSnapType = "x mandatory";
        track.style.scrollBehavior = "smooth";
        cards.forEach(function (c) { c.style.scrollSnapAlign = "start"; });
        function pos(c) { return c.getBoundingClientRect().left - track.getBoundingClientRect().left; }
        function current() {
          var best = 0;
          cards.forEach(function (c, i) { if (Math.abs(pos(c)) < Math.abs(pos(cards[best]))) best = i; });
          return best;
        }
        function go(i) {
          i = Math.max(0, Math.min(cards.length - 1, i));
          track.scrollLeft += pos(cards[i]);
        }
        function mark() {
          var c = current();
          items.forEach(function (li, i) { li.classList.toggle("is-active", i === c); });
        }
        var back = root.querySelector(".buttonCircle--back");
        var fwd = root.querySelector(".buttonCircle--forward");
        if (back) back.addEventListener("click", function () { go(current() - 1); });
        if (fwd) fwd.addEventListener("click", function () { go(current() + 1); });
        items.forEach(function (li, i) { li.style.cursor = "pointer"; li.addEventListener("click", function () { go(i); }); });
        track.addEventListener("scroll", mark, { passive: true });
        mark();
      }
    };
  }

  /* ---------- module loader (main.js: Qi) ---------- */
  var registry = {
    Preloader: Preloader,
    NavigationMain: NavigationMain,
    HomeHero: HomeHero,
    BlockIntroGeneral: BlockIntroGeneral,
    BlockProjectsHighlight: BlockProjectsHighlight,
    GlobalLatestOverview: GlobalLatestOverview,
    NavigationFooter: NavigationFooter,
    BlockHeaderMarkets: BlockHeaderMarkets,
    BlockIntroDouble: BlockIntroDouble,
    BlockProcessCardSlider: BlockProcessCardSlider
  };
  document.querySelectorAll("[data-control]").forEach(function (el) {
    var name = el.getAttribute("data-control");
    var factory = registry[name];
    if (!factory) return;
    try {
      factory(el).init();
    } catch (err) {
      console.error("module " + name + " failed", err);
    }
  });
  /* ---------- 1-4 project slider: wheel over slider = horizontal, infinite loop ---------- */
  function ProjSlider(root) {
    var viewport = root.querySelector(".projSlider__viewport");
    var track = root.querySelector(".projSlider__track");
    var originals = Array.prototype.slice.call(track.children);
    var total = originals.length;
    if (!total) return;
    // 앞뒤로 한 벌씩 복제해 끊김 없는 무한 루프를 만든다
    originals.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    originals.slice().reverse().forEach(function (c) { track.insertBefore(c.cloneNode(true), track.firstChild); });
    var fill = root.querySelector(".projSlider__barFill");
    var current = root.querySelector("[data-proj-current]");
    var totalEl = root.querySelector("[data-proj-total]");
    if (totalEl) totalEl.textContent = total;
    var footer = root.querySelector(".projSlider__footer");
    var cardW = 0, setW = 0, startX = 0, target = 0, pos = 0, dirty = true;
    function measure() {
      // 사진 3장과 간격 2개(카드 폭의 7%)가 본문 폭에 딱 맞도록 카드 폭을 정한다
      if (footer) root.style.setProperty("--projCardW", footer.getBoundingClientRect().width / 3.14 + "px");
      // 카드 폭에 카드 사이 간격까지 포함한 한 칸의 길이
      cardW = originals[1] ? originals[1].getBoundingClientRect().left - originals[0].getBoundingClientRect().left : originals[0].getBoundingClientRect().width;
      // 첫 카드는 본문 왼쪽 선에 맞추고, 그 왼쪽 여백에도 앞 카드가 보이게 한다
      startX = footer ? footer.getBoundingClientRect().left - viewport.getBoundingClientRect().left : 0;
      setW = cardW * total;
    }
    function mod(n, m) { return ((n % m) + m) % m; }
    measure();
    window.addEventListener("resize", function () { measure(); dirty = true; });

    // 휠 횡스크롤은 뺐다. 휠은 페이지 세로 스크롤로 그대로 넘긴다

    var prev = root.querySelector("[data-proj-prev]");
    var next = root.querySelector("[data-proj-next]");
    function snap(dir) { target = (Math.round(target / cardW) + dir) * cardW; }
    if (prev) prev.addEventListener("click", function () { snap(-1); });
    if (next) next.addEventListener("click", function () { snap(1); });

    var dragX = null;
    viewport.addEventListener("pointerdown", function (e) {
      dragX = e.clientX;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", function (e) {
      if (dragX === null) return;
      target -= e.clientX - dragX;
      dragX = e.clientX;
    });
    function endDrag() { dragX = null; viewport.classList.remove("is-dragging"); }
    viewport.addEventListener("pointerup", endDrag);
    // 끌지 않고 사진을 누르면 그 사진을 가운데 칸으로 보낸다
    var downX = 0;
    viewport.addEventListener("pointerdown", function (e) { downX = e.clientX; });
    // 드래그용 포인터 캡처 때문에 클릭 대상이 틀로 바뀌므로, 손을 뗀 위치의 사진을 직접 찾는다
    viewport.addEventListener("pointerup", function (e) {
      if (Math.abs(e.clientX - downX) > 5) return;
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      var card = hit && hit.closest("[data-photo]");
      if (card && root.projGoTo) root.projGoTo(+card.getAttribute("data-photo"));
    });
    viewport.addEventListener("pointercancel", endDrag);
    viewport.style.touchAction = "pan-y";

    gsap.ticker.add(function () {
      if (!setW) return;
      // 멈춰 있으면 매 프레임 다시 그리지 않는다 (세로 스크롤 버벅임 방지)
      if (Math.abs(target - pos) < 0.05 && !dirty) return;
      dirty = false;
      pos += (target - pos) * 0.12;
      var m = mod(pos, setW);
      track.style.transform = "translate3d(" + (startX - setW - m) + "px,0,0)";
      var idx = Math.floor(mod(pos + cardW / 2, setW) / cardW) + 1;
      if (current && current.textContent != idx) current.textContent = idx;
      if (fill) fill.style.transform = "translateX(" + (m / setW) * 1000 + "%)";
      // 가운데 칸 사진에 테두리를 켜고 키맵에 알린다
      var ci = Math.floor(mod(pos + cardW * 1.5, setW) / cardW);
      if (ci !== lastCenter) {
        lastCenter = ci;
        Array.prototype.forEach.call(track.children, function (c, i) { c.classList.toggle("is-center", i % total === ci); });
        root.dispatchEvent(new CustomEvent("projcenter", { detail: ci + 1 }));
      }
    });
    var lastCenter = -1;
    // 키맵 클릭 시 해당 사진을 가운데 칸으로 보낸다 (k는 1부터)
    root.projGoTo = function (k) {
      var base = (k - 2) * cardW;
      target = base + Math.round((target - base) / setW) * setW;
    };
  }
  document.querySelectorAll("[data-proj-slider]").forEach(function (el) {
    try { ProjSlider(el); } catch (err) { console.error("ProjSlider failed", err); }
  });

  GenericAnimations();

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
