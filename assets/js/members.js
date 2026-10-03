// ============================================================
// JADARA — MEMBERS / SPECIALISTS MOTION ENGINE
// Entrance · sliding filter · FLIP grid · batched reveals ·
// image reveal · profile drawer · bottom sheet · parallax ·
// counters · prev/next · reduced motion
// ============================================================
(function () {
  var doc = document;
  var root = doc.documentElement;
  var section = doc.querySelector('[data-jd-members]');
  if (!section) return;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  var narrow = window.matchMedia('(max-width: 767px)');
  root.classList.add('jd-enhanced');
  if (reduce) root.classList.add('jd-reduced');

  var grid = section.querySelector('[data-jd-grid]');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.jd-card'));
  var filterBox = section.querySelector('[data-jd-filter]');
  var filterItems = Array.prototype.slice.call(filterBox.querySelectorAll('.jd-filter__item'));
  var indicator = section.querySelector('[data-jd-indicator]');
  var countOut = section.querySelector('[data-jd-count]');
  var statsBox = section.querySelector('[data-jd-stats]');
  var headlineLines = Array.prototype.slice.call(section.querySelectorAll('[data-jd-line]'));
  var spotlight = section.querySelector('[data-open]');

  var CAT_LABEL = {
    all: 'ALL', design: 'DESIGN', technology: 'TECHNOLOGY', business: 'BUSINESS',
    media: 'MEDIA', 'art-culture': 'ART & CULTURE', education: 'EDUCATION'
  };

  var active = 'all';
  var busy = false;
  var queuedFilter = null;
  var lockY = 0;
  var INDICATOR_BASE = 100;

  // ---------------------------------------------------------
  // 1. SECTION ENTRANCE
  // ---------------------------------------------------------
  headlineLines.forEach(function (line, i) {
    line.style.setProperty('--d', (260 + i * 100) + 'ms');
  });

  var statNodes = Array.prototype.slice.call(statsBox.querySelectorAll('.jd-stat'));
  statNodes.forEach(function (stat, i) {
    stat.style.setProperty('--sd', (i * 90) + 'ms');
  });

  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      section.classList.add('jd-on');
      sectionIO.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  sectionIO.observe(section);

  // ---------------------------------------------------------
  // 2. MEMBER CARD SCROLL REVEAL (batched, 70ms apart)
  // ---------------------------------------------------------
  var cardIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var lead = entry.target;
      var group = [lead];
      var sibling = lead.nextElementSibling;
      while (group.length < 3 && sibling && sibling.classList.contains('jd-card')) {
        if (!sibling.classList.contains('is-in') && !sibling.hidden) group.push(sibling);
        sibling = sibling.nextElementSibling;
      }
      group.forEach(function (card, i) {
        card.style.setProperty('--cd', (i * 70) + 'ms');
        card.style.setProperty('--id', (i * 70 + 90) + 'ms');
        card.classList.add('is-in');
        cardIO.unobserve(card);
      });
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  function watchCards() {
    cards.forEach(function (card) { cardIO.unobserve(card); });
    cards.forEach(function (card) {
      if (card.hidden) return;
      if (card.classList.contains('is-in')) return;
      cardIO.observe(card);
    });
  }

  // ---------------------------------------------------------
  // 3. SPECIALTY FILTER — sliding underline + FLIP layout
  // ---------------------------------------------------------
  function matches(card) { return active === 'all' || card.getAttribute('data-category') === active; }
  function shownCards() { return cards.filter(function (c) { return !c.hidden; }); }

  function moveIndicator(instant) {
    var current = filterBox.querySelector('.jd-filter__item.is-active');
    if (!current) return;
    if (instant) indicator.style.transition = 'none';
    indicator.style.transform =
      'translate3d(' + current.offsetLeft + 'px,0,0) scaleX(' + (current.offsetWidth / INDICATOR_BASE) + ')';
    if (instant) requestAnimationFrame(function () { indicator.style.transition = ''; });
  }

  function updateCount() {
    var n = cards.filter(matches).length;
    if (countOut.textContent !== String(n)) {
      countOut.textContent = n;
      if (countOut.parentNode.animate) {
        countOut.parentNode.animate([{ opacity: 0.35 }, { opacity: 1 }],
          { duration: reduce ? 1 : 260, easing: 'ease-out' });
      }
    }
  }

  function setFilter(next) {
    if (next === active) return;
    if (busy) { queuedFilter = next; return; }
    active = next;
    filterItems.forEach(function (item) {
      var on = item.getAttribute('data-filter') === active;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    moveIndicator(false);
    if (narrow.matches) {
      filterBox.scrollTo({ left: Math.max(0, filterBox.querySelector('.is-active').offsetLeft - 12), behavior: reduce ? 'auto' : 'smooth' });
    }
    updateCount();

    if (reduce) { commitLayout(); return; }

    var firstRects = new Map();
    cards.forEach(function (card) { if (!card.hidden) firstRects.set(card, card.getBoundingClientRect()); });
    busy = true;

    cards.forEach(function (card) {
      if (card.hidden || matches(card)) return;
      card.classList.remove('is-flip', 'is-entering');
      card.classList.add('is-exiting');
    });

    setTimeout(function () {
      commitLayout();

      var step = 0;
      cards.forEach(function (card) {
        if (card.hidden) return;
        card.classList.add('is-flip');
        card.style.transition = 'none';
        var first = firstRects.get(card);
        if (first) {
          var last = card.getBoundingClientRect();
          card.style.transform =
            'translate(' + (first.left - last.left).toFixed(2) + 'px,' + (first.top - last.top).toFixed(2) + 'px)';
        } else {
          card.classList.add('is-entering');
        }
        card.style.setProperty('--cd', (Math.min(step, 7) * 70) + 'ms');
        card.style.setProperty('--id', (Math.min(step, 7) * 70 + 40) + 'ms');
        step++;
      });

      void grid.offsetHeight;

      requestAnimationFrame(function () {
        cards.forEach(function (card) {
          if (card.hidden) return;
          card.style.transition = '';
          card.style.transform = '';
          card.classList.remove('is-entering');
        });
      });

      setTimeout(function () {
        cards.forEach(function (card) {
          card.style.transition = '';
          card.style.transform = '';
          card.classList.remove('is-flip', 'is-entering', 'is-exiting');
        });
        busy = false;
        if (queuedFilter && queuedFilter !== active) {
          var nextCat = queuedFilter;
          queuedFilter = null;
          setFilter(nextCat);
        }
      }, 560 + 7 * 70);
    }, 280);
  }

  function commitLayout() {
    cards.forEach(function (card) {
      card.classList.remove('is-exiting', 'is-flip', 'is-entering');
      card.hidden = !matches(card);
      card.style.transition = '';
      card.style.transform = '';
    });
    if (narrow.matches && grid.scrollLeft) grid.scrollTo({ left: 0, behavior: 'auto' });
    watchCards();
  }

  filterItems.forEach(function (item) {
    item.addEventListener('click', function () { setFilter(item.getAttribute('data-filter')); });
    item.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var i = filterItems.indexOf(item);
      var next = filterItems[(i + (e.key === 'ArrowRight' ? 1 : -1) + filterItems.length) % filterItems.length];
      next.focus();
      setFilter(next.getAttribute('data-filter'));
    });
  });

  window.addEventListener('resize', function () {
    moveIndicator(false);
    watchCards();
  }, { passive: true });

  // ---------------------------------------------------------
  // 4. PROFILE DRAWER (desktop panel / mobile bottom sheet)
  // ---------------------------------------------------------
  var dRoot = doc.querySelector('[data-jd-drawer-root]');
  var panel = dRoot.querySelector('[data-jd-drawer]');
  var overlay = dRoot.querySelector('[data-jd-overlay]');
  var closeBtn = dRoot.querySelector('[data-jd-close]');
  var prevBtn = dRoot.querySelector('[data-jd-prev]');
  var nextBtn = dRoot.querySelector('[data-jd-next]');
  var dImg = dRoot.querySelector('[data-jd-dimg]');
  var dCaption = dRoot.querySelector('[data-jd-dcaption]');
  var dCat = dRoot.querySelector('[data-jd-dcat]');
  var dName = dRoot.querySelector('[data-jd-dname]');
  var dRole = dRoot.querySelector('[data-jd-drole]');
  var dAbout = dRoot.querySelector('[data-jd-dabout]');
  var dSpecs = dRoot.querySelector('[data-jd-dspecs]');
  var dConnect = dRoot.querySelector('.jd-drawer__connect');
  var specsWrap = dRoot.querySelector('.jd-drawer__specs');
  var dNum = dRoot.querySelector('[data-jd-dnum]');
  var dTotal = dRoot.querySelector('[data-jd-dtotal]');
  var stages = [dCat, dName, dRole, dAbout, specsWrap, dConnect];
  var openStages = [120, 165, 210, 255, 310, 500];
  var swapStages = [60, 90, 120, 150, 185, 265];
  var dBase = 380;

  var current = null;
  var lastFocus = null;
  var isOpen = false;

  function readMember(el) {
    var photo = el.querySelector('.jd-card__img');
    var trigger = el.querySelector('[data-open]');
    return {
      id: el.getAttribute('data-open') || (trigger ? trigger.getAttribute('data-open') : ''),
      num: el.getAttribute('data-num') || '',
      name: el.getAttribute('data-name') || '',
      role: el.getAttribute('data-role') || '',
      city: el.getAttribute('data-city') || '',
      cat: el.getAttribute('data-category') || el.getAttribute('data-cat') || 'media',
      since: el.getAttribute('data-since') || '',
      about: el.getAttribute('data-about') || '',
      specs: (el.getAttribute('data-specs') || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean),
      img: el.getAttribute('data-img') || (photo ? photo.getAttribute('src') : ''),
      alt: el.getAttribute('data-alt') || (photo ? photo.getAttribute('alt') : '')
    };
  }

  function catalogue() {
    var list = spotlight ? [readMember(spotlight)] : [];
    return list.concat(shownCards().map(readMember));
  }

  function stageDelays(base) {
    stages.forEach(function (el, i) { el.style.setProperty('--d', base[i] + 'ms'); });
  }

  function render(member, direction) {
    dImg.style.setProperty('--shift', (direction > 0 ? 18 : -18) + 'px');
    dImg.setAttribute('src', member.img);
    dImg.setAttribute('alt', member.alt || member.name);
    dCaption.textContent = 'Member #' + member.num + ' — ' + member.city;
    dCat.textContent = CAT_LABEL[member.cat] || '';
    dName.textContent = member.name;
    dRole.textContent = member.role + ' • ' + member.city;
    dAbout.textContent = member.about;
    dNum.textContent = '#' + member.num;

    dSpecs.innerHTML = '';
    member.specs.forEach(function (text, i) {
      var item = doc.createElement('li');
      item.className = 'jd-spec';
      item.style.setProperty('--d', (dBase + 60 + i * 70) + 'ms');
      var num = doc.createElement('span');
      num.className = 'jd-spec__num';
      num.textContent = ('0' + (i + 1)).slice(-2);
      var label = doc.createElement('span');
      label.className = 'jd-spec__text';
      label.textContent = text;
      item.appendChild(num);
      item.appendChild(label);
      dSpecs.appendChild(item);
    });
  }

  function syncNav() {
    var list = catalogue();
    prevBtn.disabled = list.length < 2;
    nextBtn.disabled = list.length < 2;
    dTotal.textContent = 'of ' + list.length + ' in view';
  }

  function openDrawer(id, sourceEl) {
    var member = catalogue().find(function (m) { return m.id === id; });
    if (!member) return;
    lastFocus = sourceEl || doc.activeElement;
    current = id;
    dBase = 380;
    stageDelays(openStages);
    render(member, 1);
    syncNav();

    dRoot.classList.add('is-active', 'is-open');
    dRoot.setAttribute('aria-hidden', 'false');
    panel.classList.remove('is-closing', 'is-swapping');
    panel.classList.add('is-open');
    isOpen = true;
    lockScroll(true);
    closeBtn.focus({ preventScroll: true });
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.add('is-closing');
    dRoot.classList.add('is-closing');

    [dConnect, specsWrap, dAbout, dRole, dName, dCat].forEach(function (el, i) {
      el.style.setProperty('--cd', (i * 45) + 'ms');
    });
    dRoot.querySelectorAll('.jd-spec').forEach(function (el, i) {
      el.style.setProperty('--cd', (30 + i * 25) + 'ms');
    });

    setTimeout(function () {
      panel.classList.remove('is-open', 'is-closing', 'is-swapping');
      dRoot.classList.remove('is-open', 'is-active', 'is-closing');
      dRoot.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      current = null;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduce ? 20 : 460);
  }

  function step(dir) {
    var list = catalogue();
    if (list.length < 2) return;
    var i = list.findIndex(function (m) { return m.id === current; });
    if (i < 0) i = 0;
    var member = list[(i + dir + list.length) % list.length];
    if (member.id === current) return;

    if (reduce) {
      current = member.id;
      dBase = 0;
      stageDelays(swapStages);
      render(member, dir);
      return;
    }

    panel.classList.add('is-swapping');
    setTimeout(function () {
      current = member.id;
      dBase = 120;
      stageDelays(swapStages);
      render(member, dir);
      panel.classList.remove('is-swapping');
    }, 190);
  }

  /* restore the scroll position instantly — the page is scroll-smooth,
     so a plain scrollTo() would visibly animate from the top */
  function jumpTo(y) {
    var html = doc.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev;
  }

  function lockScroll(on) {
    var body = doc.body;
    if (on) {
      lockY = window.scrollY;
      var gap = window.innerWidth - doc.documentElement.clientWidth;
      body.style.position = 'fixed';
      body.style.top = -lockY + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      if (gap > 0) body.style.paddingRight = gap + 'px';
    } else {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.paddingRight = '';
      jumpTo(lockY);
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var items = panel.querySelectorAll('a[href], button:not([disabled])');
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  section.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open]');
    if (!trigger) return;
    e.preventDefault();
    openDrawer(trigger.getAttribute('data-open'), trigger);
  });

  overlay.addEventListener('click', closeDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  panel.addEventListener('keydown', trapFocus);
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  });

  // ---------------------------------------------------------
  // 5. PARALLAX — photography only, information stays stable
  // ---------------------------------------------------------
  var layers = Array.prototype.slice.call(doc.querySelectorAll('[data-jd-parallax]'));
  var wide = window.matchMedia('(min-width: 1024px)');
  var queued = false;

  function parallax() {
    queued = false;
    if (reduce || !wide.matches) {
      layers.forEach(function (el) { el.style.transform = ''; });
      return;
    }
    var vh = window.innerHeight;
    var limit = parseFloat(layers[0] ? layers[0].getAttribute('data-jd-parallax') : 0.22) * 100;
    layers.forEach(function (el) {
      var host = el.parentElement;
      var box = host.getBoundingClientRect();
      if (box.bottom < -80 || box.top > vh + 80) return;
      var progress = (box.top + box.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (-progress * limit).toFixed(2) + 'px,0)';
    });
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(parallax);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // ---------------------------------------------------------
  // 6. MEMBER STATISTICS — ease-out counters, once only
  // ---------------------------------------------------------
  var counters = Array.prototype.slice.call(statsBox.querySelectorAll('[data-count]'));
  var counted = false;

  function countUp(el, delay) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    setTimeout(function () {
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function runCounters() {
    if (counted) return;
    counted = true;
    counters.forEach(function (el, i) { countUp(el, i * 110); });
  }

  counters.forEach(function (el) { el.textContent = '0'; });

  var statsIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      statsBox.classList.add('jd-on');
      runCounters();
      statsIO.unobserve(entry.target);
    });
  }, { threshold: 0.35 });
  statsIO.observe(statsBox);

  setTimeout(function () {
    if (!counted) counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }, 6000);

  // ---------------------------------------------------------
  // 7. BOOT
  // ---------------------------------------------------------
  mqReduce.addEventListener('change', function (e) {
    reduce = e.matches;
    root.classList.toggle('jd-reduced', reduce);
    onScroll();
  });

  window.addEventListener('load', function () { moveIndicator(true); parallax(); });
  if (reduce) cards.forEach(function (card) { card.classList.add('is-in'); });

  requestAnimationFrame(function () {
    moveIndicator(true);
    watchCards();
    parallax();
  });
})();
