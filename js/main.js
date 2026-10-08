/* =========================================================
   双足实验室 · 招新申请页 — 交互脚本
   零依赖，原生 JS
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------
     1. 背景粒子网络（Canvas）
     --------------------------------------------------- */
  function initParticles() {
    var canvas = $('#bgCanvas');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, particles = [], raf = null;
    var pointer = { x: -9999, y: -9999 };

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var density = Math.min(96, Math.max(38, Math.round((w * h) / 22000)));
      particles = [];
      for (var i = 0; i < density; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.7 + 0.7,
          hue: Math.random() > 0.72 ? 268 : 190   // 少量紫色点缀
        });
      }
    }

    var LINK = 132;
    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;

        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        // 鼠标轻推
        var dx = p.x - pointer.x, dy = p.y - pointer.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          var f = (130 - d) / 130 * 0.6;
          p.x += (dx / (d || 1)) * f;
          p.y += (dy / (d || 1)) * f;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',92%,68%,.55)';
        ctx.fill();
      }

      // 连线
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a], pb = particles[b];
          var ex = pa.x - pb.x, ey = pa.y - pb.y;
          var dist = Math.sqrt(ex * ex + ey * ey);
          if (dist < LINK) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = 'rgba(90,165,255,' + (0.17 * (1 - dist / LINK)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', function () {
      clearTimeout(resize._t);
      resize._t = setTimeout(resize, 180);
    });
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY;
    });
    window.addEventListener('pointerleave', function () {
      pointer.x = pointer.y = -9999;
    });
    // 页面不可见时暂停，省电
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { raf = requestAnimationFrame(frame); }
    });

    resize();
    frame();
  }

  /* ---------------------------------------------------
     2. 滚动进度条 + 导航状态
     --------------------------------------------------- */
  function initScrollChrome() {
    var bar = $('#scrollBar');
    var nav = $('#nav');
    var toTop = $('#toTop');

    function onScroll() {
      var top = window.pageYOffset || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (top / max) * 100 : 0;

      if (bar) bar.style.width = pct.toFixed(2) + '%';
      if (nav) nav.classList.toggle('is-stuck', top > 40);
      if (toTop) toTop.classList.toggle('is-on', top > 600);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    // 当前区块高亮
    var links = $$('.nav__link');
    var sections = links
      .map(function (l) { return $(l.getAttribute('href')); })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-46% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------------------------------------------------
     3. 移动端导航抽屉
     --------------------------------------------------- */
  function initNavToggle() {
    var btn = $('#navToggle');
    var links = $('#navLinks');
    if (!btn || !links) return;

    function close() {
      links.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', '打开菜单');
    }

    btn.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });

    $$('.nav__link', links).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); });
  }

  /* ---------------------------------------------------
     4. 锚点滚动（补偿固定导航高度）
     --------------------------------------------------- */
  function initSmoothAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = (id === '#home') ? 0 : (window.innerWidth > 900 ? 74 : 62);
        var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---------------------------------------------------
     5. 入场动效（IntersectionObserver + 错峰延迟）
     --------------------------------------------------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    els.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    els.forEach(function (el) { io.observe(el); });

    // 安全网：若观察器因环境原因未触发，把已进入视口的元素兜底显示出来
    function safetyNet() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh + 80) el.classList.add('in');
      });
    }
    setTimeout(safetyNet, 1600);
    window.addEventListener('load', safetyNet);
    var stBusy = false;
    window.addEventListener('scroll', function () {
      if (stBusy) return;
      stBusy = true;
      requestAnimationFrame(function () { safetyNet(); stBusy = false; });
    }, { passive: true });
  }

  /* ---------------------------------------------------
     6. 数字滚动
     --------------------------------------------------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var dur = 1300, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------
     7. 技能条 + 路线图进度填充
     --------------------------------------------------- */
  function initBars() {
    var bars = $$('.bar');
    bars.forEach(function (b) {
      var lv = Math.max(0, Math.min(100, parseFloat(b.getAttribute('data-level')) || 0));
      b.style.setProperty('--w', lv + '%');
    });

    function fillBar(b) {
      var lv = Math.max(0, Math.min(100, parseFloat(b.getAttribute('data-level')) || 0));
      var inner = b.firstElementChild;
      if (inner) inner.style.width = lv + '%';
    }

    if (!('IntersectionObserver' in window) || reduceMotion) {
      bars.forEach(fillBar);
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en, i) {
          if (!en.isIntersecting) return;
          var b = en.target;
          setTimeout(function () { fillBar(b); }, i * 90);
          obs.unobserve(b);
        });
      }, { threshold: 0.35 });
      bars.forEach(function (b) { io.observe(b); });
    }

    // 路线图横线
    var road = $('#roadFill');
    if (road) {
      if (!('IntersectionObserver' in window) || reduceMotion) { road.style.width = '100%'; }
      else {
        var io2 = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            road.style.width = '100%';
            obs.unobserve(en.target);
          });
        }, { threshold: 0.35 });
        io2.observe(road.parentElement);
      }
    }
  }

  /* ---------------------------------------------------
     8. 打字机
     --------------------------------------------------- */
  function initTyped() {
    var el = $('#typedText');
    if (!el) return;

    var lines = [
      'while (1) { 学一点，做一点，改一点； }',
      'printf("51 → STM32 → 多模态交互 → 3D 识别");',
      '// 目标：让机器不仅"看到"，还能"看懂"',
      'git commit -m "第一次独立跑通完整链路"'
    ];

    if (reduceMotion) { el.textContent = lines[0]; return; }

    var li = 0, ci = 0, deleting = false;
    function tick() {
      var cur = lines[li];
      if (!deleting) {
        el.textContent = cur.slice(0, ++ci);
        if (ci >= cur.length) { deleting = true; return setTimeout(tick, 1900); }
        return setTimeout(tick, 46 + Math.random() * 46);
      }
      el.textContent = cur.slice(0, --ci);
      if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; return setTimeout(tick, 340); }
      setTimeout(tick, 22);
    }
    setTimeout(tick, 900);
  }

  /* ---------------------------------------------------
     9. 3D 倾斜悬停
     --------------------------------------------------- */
  function initTilt() {
    if (isTouch || reduceMotion) return;
    var max = 7;

    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(900px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateY(-4px)';
        // 光斑跟随
        card.style.setProperty('--mx', ((px + 0.5) * 100) + '%');
        card.style.setProperty('--my', ((py + 0.5) * 100) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------
     10. 鼠标光晕 + 视差
     --------------------------------------------------- */
  function initPointerFX() {
    var glow = $('#cursorGlow');
    var parallaxEls = $$('[data-parallax]');

    if (glow && !isTouch) {
      document.body.classList.add('has-pointer');
      var tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty;
      var rafId = null;

      function loop() {
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        glow.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        rafId = requestAnimationFrame(loop);
      }
      window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; });
      loop();
    }

    if (parallaxEls.length && !reduceMotion) {
      var ticking = false;
      function apply() {
        var vh = window.innerHeight;
        parallaxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var center = r.top + r.height / 2;
          var delta = (center - vh / 2) / vh;               // -1 ~ 1
          var speed = parseFloat(el.getAttribute('data-parallax')) || 0.05;
          el.style.transform = 'translate3d(0,' + (-delta * speed * vh).toFixed(1) + 'px,0)';
        });
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(apply); }
      }, { passive: true });
      apply();
    }
  }

  /* ---------------------------------------------------
     11. 卡片指针光斑（跟随 hover 的高光）
     --------------------------------------------------- */
  function initCardSheen() {
    if (isTouch || reduceMotion) return;
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointerenter', function () {
        card.style.boxShadow = '0 24px 60px -26px rgba(34,211,238,.5)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.boxShadow = '';
      });
    });
  }

  /* ---------------------------------------------------
     启动
     --------------------------------------------------- */
  function boot() {
    initParticles();
    initScrollChrome();
    initNavToggle();
    initSmoothAnchors();
    initReveal();
    initCounters();
    initBars();
    initTyped();
    initTilt();
    initPointerFX();
    initCardSheen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
