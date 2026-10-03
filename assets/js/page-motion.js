/* ==========================================================
     JADARA — PAGE MOTION ENGINE (all sections except members)
     tagging · word-mask headings · IO reveals · parallax
     counters · header state · contact micro-states
     ========================================================== */
  (function initPageMotion() {
    var root = document.documentElement;
    if (root.classList.contains('pg-ready')) return;

    var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    var io = null;
    var pars = [];
    var queued = false;

    function kids(el, i) { return el && el.children[i]; }
    function all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

    /* ---------- observer ---------- */
    function observer() {
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            reveal(entry.target);
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      }
      return io;
    }

    function reveal(el) {
      el.classList.add('is-in');
      if (el.hasAttribute('data-pg-count')) countUp(el);
      window.setTimeout(function () { el.style.removeProperty('--pg-t'); }, 1500);
    }

    /* ---------- tagging ---------- */
    function mark(el, mode, delay) {
      if (!el || el.nodeType !== 1) return null;
      if (el.closest('#members')) return null;
      if (mode === 'split') {
        split(el);
        el.setAttribute('data-pg-split', '');
      } else {
        el.setAttribute('data-pg', mode);
        el.classList.add('pg-' + mode);
      }
      if (delay) el.style.setProperty('--pg-t', delay + 'ms');
      observer().observe(el);
      return el;
    }

    function stagger(list, mode, base, step) {
      list.forEach(function (el, i) {
        if (el) mark(el, mode, base + i * step);
      });
    }

    function addPar(el, max) {
      if (!el) return;
      el.setAttribute('data-pg-par', '');
      el.classList.add('pg-par');
      pars.push({ el: el, max: max });
    }

    /* ---------- word-mask split ---------- */
    function split(el) {
      if (!el || el.querySelector('.pg-w')) return;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            if (!child.nodeValue || !child.nodeValue.trim()) return;
            var frag = document.createDocumentFragment();
            child.nodeValue.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
              var outer = document.createElement('span');
              outer.className = 'pg-w';
              var inner = document.createElement('span');
              inner.textContent = part;
              outer.appendChild(inner);
              frag.appendChild(outer);
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1 && !child.classList.contains('pg-w')) {
            walk(child);
          }
        });
      };
      walk(el);
      all('.pg-w', el).forEach(function (w, i) { w.style.setProperty('--i', i); });
    }

    /* ---------- counters ---------- */
    function countUp(el) {
      var m = /^(\D*)(\d+)(\D*)$/.exec(el.textContent.trim());
      if (!m || el.dataset.pgCounted) return;
      el.dataset.pgCounted = '1';
      var prefix = m[1], digits = m[2], suffix = m[3];
      var target = parseInt(digits, 10);
      var min = digits.length;
      var start = null;
      var dur = 1400;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        var out = String(Math.round(target * eased));
        while (out.length < min) out = '0' + out;
        el.textContent = prefix + out + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /* ---------- parallax ---------- */
    function paintParallax() {
      queued = false;
      if (!pars.length) return;
      var vh = window.innerHeight;
      var dy = window.pageYOffset;
      for (var i = 0; i < pars.length; i++) {
        var p = pars[i];
        var r = p.el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue;
        var mid = (r.top + r.height / 2 - vh / 2) / vh;
        var y = Math.max(-p.max, Math.min(p.max, -mid * p.max));
        p.el.style.setProperty('--pg-py', y.toFixed(2) + 'px');
      }
      void dy;
    }
    var sweepTimer = null;
    function scheduleSweep() {
      if (sweepTimer) clearTimeout(sweepTimer);
      sweepTimer = window.setTimeout(function () { sweepTimer = null; sweepVisible(); }, 180);
    }
    function onScroll() {
      paintHeader();
      if (queued) return;
      queued = true;
      requestAnimationFrame(paintParallax);
      scheduleSweep();
    }

    /* ---------- header state ---------- */
    var header = document.querySelector('[data-pg="header"]');
    function paintHeader() {
      if (!header) return;
      header.classList.toggle('pg-scrolled', window.pageYOffset > 24);
    }

    /* ---------- additive hooks ---------- */
    function decorate() {
      all('[data-pg="header"] nav a').forEach(function (a) {
        if (!a.closest('#mobile-drawer')) a.classList.add('pg-navlink');
      });
      all('[data-pg="footer"] a[href^="#"]').forEach(function (a) {
        if (a.querySelector('svg')) a.classList.add('pg-social');
        else if (!a.querySelector('img')) a.classList.add('pg-link');
      });
      all('a[href="#contact"]').forEach(function (a) { a.classList.add('pg-cta'); });
      var btn = document.getElementById('contact-submit-btn');
      if (btn && !btn.querySelector('.pg-btn-spinner')) {
        var spin = document.createElement('span');
        spin.className = 'pg-btn-spinner';
        spin.setAttribute('aria-hidden', 'true');
        btn.appendChild(spin);
      }
    }

    /* ---------- contact field states ---------- */
    function wireContact() {
      var form = document.getElementById('contact-form');
      if (!form) return;
      var pairs = [];
      all('input, textarea', form).forEach(function (field) {
        var wrap = field.closest('.field-wrapper');
        if (!wrap) return;
        var err = wrap.querySelector('.field-error');
        var sync = function () {
          var val = field.value.trim();
          var filled = field.required ? !!val : true;
          var format = filled ? field.checkValidity() : false;
          var shown = !!err && !err.classList.contains('hidden');
          wrap.classList.toggle('is-valid', filled && format);
          wrap.classList.toggle('is-invalid', field.required && !format && shown);
        };
        pairs.push(sync);
        field.addEventListener('input', function () { window.setTimeout(sync, 0); });
        field.addEventListener('blur', sync);
      });
      form.addEventListener('submit', function () {
        window.setTimeout(function () {
          pairs.forEach(function (sync) { sync(); });
          var firstBad = form.querySelector('.field-wrapper.is-invalid input, .field-wrapper.is-invalid textarea');
          if (firstBad && firstBad.focus) firstBad.focus({ preventScroll: true });
        }, 0);
      });
    }

    /* ---------- hero ---------- */
    function buildHero() {
      var hero = document.querySelector('[data-pg="hero"]');
      if (!hero) return 0;
      var grid = kids(hero, 0);
      var left = kids(grid, 0);
      var right = kids(grid, 1);
      var n = 0;
      var order = [kids(left, 0), kids(left, 2), kids(left, 3), kids(left, 4)];
      order.forEach(function (el, i) { if (mark(el, 'rise', 120 + i * 90)) n++; });
      if (mark(kids(left, 1), 'split', 200)) n++;

      var proof = kids(left, 4);
      if (proof) {
        var stack = kids(proof, 0);
        if (stack) {
          all(':scope > *', stack).forEach(function (av, i) {
            av.classList.add('pg-avatar');
            av.style.setProperty('--pg-t', (620 + i * 70) + 'ms');
            observer().observe(av);
          });
        }
      }

      var frame = kids(right, 0);
      if (frame) {
        var img = kids(frame, 0);
        if (img) { img.classList.add('pg-zoom-in'); img.style.setProperty('--pg-t', '140ms'); }
        mark(frame, 'wipe-b', 100);
        addPar(frame, 46);
        n++;
        var caption = kids(frame, 2);
        if (mark(caption, 'rise', 620)) n++;
      }
      if (mark(kids(right, 1), 'rise', 700)) n++;
      if (mark(kids(right, 2), 'rise', 780)) n++;
      return n;
    }

    /* ---------- about ---------- */
    function buildAbout() {
      var sec = document.getElementById('about');
      if (!sec) return 0;
      var cols = kids(sec, 0);
      var left = kids(cols, 0);
      var right = kids(cols, 1);
      var n = 0;
      var copy = kids(left, 0);
      if (mark(kids(copy, 0), 'left', 0)) n++;
      if (mark(kids(copy, 1), 'split', 90)) n++;
      stagger([kids(copy, 2), kids(copy, 3)], 'rise', 260, 90);
      n += 2;
      var stats = kids(left, 1);
      if (mark(stats, 'rise', 420)) n++;
      [0, 1].forEach(function (i) {
        var cell = kids(stats, i);
        var value = kids(cell, 0);
        if (!value) return;
        value.setAttribute('data-pg-count', '');
        mark(value, 'pop', 520 + i * 90);
        if (mark(kids(cell, 1), 'rise', 600 + i * 90)) n++;
      });
      var frame = kids(right, 0);
      if (frame) {
        mark(frame, 'wipe-b', 120);
        addPar(frame, 34);
        n++;
        var chip = kids(frame, 1);
        if (mark(chip, 'pop', 480)) n++;
      }
      if (mark(kids(right, 1), 'rise', 560)) n++;
      return n;
    }

    /* ---------- values ---------- */
    function buildValues() {
      var sec = document.getElementById('values');
      if (!sec) return 0;
      var n = 0;
      var head = kids(sec, 0);
      var headCopy = kids(head, 0);
      if (mark(kids(headCopy, 0), 'left', 0)) n++;
      if (mark(kids(headCopy, 1), 'split', 90)) n++;
      if (mark(kids(head, 1), 'rise', 300)) n++;
      var grid = kids(sec, 1);
      all(':scope > div', grid).forEach(function (card, i) {
        card.classList.add('pg-card');
        if (mark(card, 'rise', 180 + i * 90)) n++;
        var foot = kids(card, 1);
        if (foot) mark(kids(foot, 1), 'right', 420 + i * 90);
      });
      return n;
    }

    /* ---------- events ---------- */
    function buildEvents() {
      var sec = document.getElementById('events');
      if (!sec) return 0;
      var n = 0;
      var head = kids(sec, 0);
      var headCopy = kids(head, 0);
      if (mark(kids(headCopy, 0), 'left', 0)) n++;
      if (mark(kids(headCopy, 1), 'split', 90)) n++;
      if (mark(kids(head, 1), 'rise', 280)) n++;
      var grid = kids(sec, 1);
      all(':scope > article', grid).forEach(function (card, i) {
        var delay = 200 + i * 120;
        card.classList.add('pg-card');
        if (mark(card, 'rise', delay)) n++;
        var frame = kids(card, 0);
        if (frame) {
          mark(frame, 'wipe-b', delay + 90);
          all(':scope > img', frame).forEach(function (img) { img.classList.add('pg-zoom-in'); });
          all(':scope > div', frame).forEach(function (chip, c) { mark(chip, 'pop', delay + 260 + c * 70); });
        }
        var body = kids(card, 1);
        if (body) {
          var inner = kids(body, 0);
          if (inner) {
            stagger([kids(inner, 0), kids(inner, 2)], 'rise', delay + 200, 80);
            if (mark(kids(inner, 1), 'split', delay + 260)) n++;
          }
          var foot = kids(body, 1);
          if (foot) mark(kids(foot, 1), 'right', delay + 460);
        }
      });
      return n;
    }

    /* ---------- global team ---------- */
    function buildTeam() {
      var sec = document.getElementById('global-team');
      if (!sec) return 0;
      var n = 0;
      var wrap = kids(sec, 0);
      var head = kids(wrap, 0);
      var headCopy = kids(head, 0);
      if (mark(kids(headCopy, 0), 'left', 0)) n++;
      if (mark(kids(headCopy, 1), 'split', 90)) n++;
      if (mark(kids(head, 1), 'rise', 240)) n++;

      var grid = kids(wrap, 1);
      var media = kids(grid, 0);
      if (mark(media, 'left', 160)) n++;
      var frame = kids(media, 0);
      if (frame) {
        var img = frame.querySelector('img');
        if (img) { img.classList.add('pg-zoom-in'); addPar(img, 18); }
        var cap = kids(frame, 2);
        if (mark(cap, 'rise', 460)) n++;
      }

      var side = kids(grid, 1);
      var hub = kids(side, 0);
      if (hub) {
        if (mark(hub, 'rise', 220)) n++;
        all(':scope > ol > li', hub).forEach(function (li, i) {
          mark(li, i % 2 ? 'right' : 'left', 320 + i * 90);
        });
      }
      var figs = kids(side, 1);
      if (figs) {
        all(':scope > div', figs).forEach(function (card, i) {
          card.classList.add('pg-card');
          if (mark(card, 'rise', 640 + i * 90)) n++;
          var num = card.querySelector('[data-pg-count]');
          if (num) mark(num, 'rise', 700 + i * 90);
        });
      }
      var cta = kids(side, 2);
      if (mark(cta, 'rise', 820)) n++;
      return n;
    }

    /* ---------- story ---------- */
    function buildStory() {
      var sec = document.getElementById('story');
      if (!sec) return 0;
      var n = 0;
      var bg = kids(sec, 0);
      if (bg) { bg.classList.add('pg-story-bg'); addPar(bg, 54); }
      var content = kids(sec, 1);
      if (mark(kids(content, 0), 'left', 0)) n++;
      if (mark(kids(content, 1), 'split', 100)) n++;
      if (mark(kids(content, 2), 'rise', 320)) n++;
      if (mark(kids(content, 3), 'rise', 440)) n++;
      return n;
    }

    /* ---------- gallery ---------- */
    function buildGallery() {
      var sec = document.getElementById('gallery');
      if (!sec) return 0;
      var n = 0;
      var head = kids(sec, 0);
      var headCopy = kids(head, 0);
      if (mark(kids(headCopy, 0), 'left', 0)) n++;
      if (mark(kids(headCopy, 1), 'split', 90)) n++;
      if (mark(kids(head, 1), 'rise', 280)) n++;
      var grid = kids(sec, 1);
      all(':scope > div', grid).forEach(function (tile, i) {
        var delay = 160 + i * 110;
        tile.classList.add('pg-card');
        if (mark(tile, 'wipe-b', delay)) n++;
        all(':scope > img', tile).forEach(function (img) { img.classList.add('pg-zoom-in'); });
        var cap = kids(tile, 1);
        if (cap) {
          cap.classList.add('pg-cap');
          var icon = cap.querySelector('.material-symbols-outlined');
          if (icon) icon.classList.add('pg-zoomicon');
        }
      });
      return n;
    }

    /* ---------- testimonials ---------- */
    function buildQuotes() {
      var sec = document.querySelector('[data-pg="quotes"]');
      if (!sec) return 0;
      var n = 0;
      var inner = kids(sec, 0);
      if (mark(kids(inner, 0), 'left', 0)) n++;
      if (mark(kids(inner, 1), 'rise', 160)) n++;
      if (mark(kids(inner, 2), 'rise', 320)) n++;
      var slider = document.getElementById('testimonial-slider');
      if (slider) {
        all('.testimonial-slide', slider).forEach(function (slide) { slide.classList.add('pg-slide'); });
        all('.dot-indicator', sec).forEach(function (dot) { dot.classList.add('pg-dot'); });
        all('.dot-indicator.bg-primary', sec).forEach(function (dot) { dot.classList.add('is-on'); });
      }
      return n;
    }

    /* ---------- join / admissions ---------- */
    function buildJoin() {
      var sec = document.querySelector('[data-pg="join"]');
      if (!sec) return 0;
      var n = 0;
      var card = kids(sec, 0);
      card.classList.add('pg-card');
      if (mark(card, 'rise', 0)) n++;
      var grid = kids(card, 0);
      var left = kids(grid, 0);
      var right = kids(grid, 1);
      if (mark(kids(left, 0), 'left', 120)) n++;
      if (mark(kids(left, 1), 'split', 200)) n++;
      if (mark(kids(left, 2), 'rise', 340)) n++;
      if (mark(kids(left, 3), 'rise', 440)) n++;
      if (mark(kids(right, 0), 'rise', 500)) n++;
      if (mark(kids(right, 1), 'rise', 580)) n++;
      return n;
    }

    /* ---------- contact ---------- */
    function buildContact() {
      var sec = document.getElementById('contact');
      if (!sec) return 0;
      var n = 0;
      var wrap = kids(sec, 0);
      var head = kids(wrap, 0);
      if (mark(kids(head, 0), 'left', 0)) n++;
      if (mark(kids(head, 1), 'split', 90)) n++;
      if (mark(kids(head, 2), 'rise', 260)) n++;
      var grid = kids(wrap, 1);
      var left = kids(grid, 0);
      var formCard = kids(grid, 1);
      if (mark(left, 'rise', 340)) n++;
      if (mark(formCard, 'rise', 460)) n++;
      var form = document.getElementById('contact-form');
      if (form) {
        all('.field-wrapper', form).forEach(function (field, i) {
          mark(field, 'rise', 560 + i * 70);
        });
      }
      return n;
    }

    /* ---------- footer ---------- */
    function buildFooter() {
      var sec = document.querySelector('[data-pg="footer"]');
      if (!sec) return 0;
      var n = 0;
      var inner = kids(sec, 0);
      var grid = kids(inner, 0);
      all(':scope > div', grid).forEach(function (col, i) {
        if (mark(col, 'rise', i * 110)) n++;
      });
      if (mark(kids(inner, 1), 'rise', 360)) n++;
      return n;
    }

    /* ---------- safety net ---------- */
    function sweepVisible() {
      var vh = window.innerHeight;
      all('[data-pg],[data-pg-split]').forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var r = el.getBoundingClientRect();
        // reveal what is on screen, and anything already scrolled past
        if ((r.top < vh && r.bottom > 0) || r.bottom <= 0) reveal(el);
      });
    }

    function boot() {
      root.classList.add('pg-ready');
      decorate();

      if (reduceMQ.matches) {
        root.classList.add('pg-reduced');
        wireContact();
        paintHeader();
        return;
      }

      var tagged = 0;
      [buildHero, buildAbout, buildValues, buildEvents, buildTeam, buildStory,
       buildGallery, buildQuotes, buildJoin, buildContact, buildFooter]
        .forEach(function (fn) { tagged += fn() || 0; });

      root.classList.add('pg-enhanced');
      wireContact();
      paintParallax();
      paintHeader();

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { onScroll(); paintHeader(); sweepVisible(); }, { passive: true });
      window.addEventListener('load', sweepVisible);
      reduceMQ.addEventListener('change', function () {
        root.classList.toggle('pg-reduced', reduceMQ.matches);
        if (reduceMQ.matches) sweepVisible();
      });

      root.dataset.pgTagged = tagged;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();
