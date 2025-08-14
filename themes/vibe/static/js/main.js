(function() {
  const storageKey = 'prefers-theme';
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) { root.setAttribute('data-theme', theme); }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  }

  // Apply immediately
  applyTheme(getPreferredTheme());

  function setActiveNav(urlHash) {
    const desktopLinks = document.querySelectorAll('.nav a');
    const mobileLinks = document.querySelectorAll('#mobile-menu a');
    const all = [...desktopLinks, ...mobileLinks];
    all.forEach(a => a.classList.remove('active'));
    if (!urlHash) return;
    const target = '/#' + urlHash.replace(/^#/, '');
    all.forEach(a => { if (a.getAttribute('href') === target) a.classList.add('active'); });
  }

  function wireInPageNavClicks() {
    const all = document.querySelectorAll('.nav a, #mobile-menu a');
    all.forEach(a => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/^\/#(.+)/);
      if (match) { a.addEventListener('click', function() { setActiveNav('#' + match[1]); }); }
    });
  }

  function initScrollSpy() {
    const ids = ['about', 'experience', 'education'];
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return; // not on home
    const headerOffset = 88; let ticking = false;
    function updateActiveFromScroll() {
      ticking = false; let bestId = null; let bestDelta = Infinity;
      for (const s of sections) {
        const rect = s.getBoundingClientRect();
        if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
          const delta = Math.abs(rect.top - headerOffset);
          if (delta < bestDelta) { bestDelta = delta; bestId = s.id; }
        }
      }
      if (bestId) setActiveNav('#' + bestId);
    }
    window.addEventListener('scroll', function() { if (!ticking) { window.requestAnimationFrame(updateActiveFromScroll); ticking = true; } }, { passive: true });
    window.addEventListener('resize', function() { updateActiveFromScroll(); });
    updateActiveFromScroll();
  }

  function initBrandToggle() {
    const brand = document.querySelector('.brand');
    const label = document.querySelector('.brand-text');
    if (!brand || !label) return;
    label.addEventListener('click', function() { brand.classList.toggle('lang-ta'); });
  }

  function initExperienceTabs() {
    const rootEl = document.getElementById('experience-tabs');
    if (!rootEl) return;
    const tabs = Array.from(rootEl.querySelectorAll('[role="tab"]'));
    const panels = Array.from(rootEl.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || !panels.length) return;
    function activate(index) {
      tabs.forEach((t, i) => { const selected = i === index; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; });
      panels.forEach((p, i) => { p.classList.toggle('active', i === index); });
    }
    activate(0);
    tabs.forEach((t, idx) => {
      t.addEventListener('click', () => activate(idx));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); const dir = e.key === 'ArrowRight' ? 1 : -1; const next = (idx + dir + tabs.length) % tabs.length; tabs[next].focus(); activate(next);
        }
      });
    });
  }

  function initCommentsToggle() {
    const toggle = document.getElementById('comments-toggle');
    const body = document.getElementById('comments-body');
    if (!toggle || !body) return;
    toggle.addEventListener('click', function() {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      toggle.setAttribute('aria-expanded', String(next));
      toggle.title = next ? 'Collapse comments' : 'Expand comments';
      body.style.display = next ? 'block' : 'none';
      toggle.innerHTML = '<span class="material-symbols-rounded icon">' + (next ? 'unfold_less' : 'unfold_more') + '</span>';
    });
  }

  function initKavidhaiStack() {
    const viewport = document.getElementById('kav-viewport');
    const stack = document.getElementById('kav-stack');
    if (!stack || !viewport) return;

    const cards = Array.from(stack.querySelectorAll('[data-card]'));
    const isDesktop = () => window.matchMedia('(min-width:701px)').matches;

    cards.forEach(card => {
      const header = card.querySelector('[data-toggle]');
      const body = card.querySelector('.kav-card-body');
      if (!header || !body) return;

      const setOpen = (open) => {
        card.setAttribute('data-open', String(open));
        if (isDesktop()) { body.style.maxHeight = 'none'; return; }
        if (open) {
          body.style.maxHeight = body.scrollHeight + 'px';
          // after transition, allow natural height
          body.addEventListener('transitionend', function onEnd() {
            body.removeEventListener('transitionend', onEnd);
            if (card.getAttribute('data-open') === 'true') body.style.maxHeight = 'none';
          });
        } else {
          body.style.maxHeight = '0px';
        }
      };

      header.addEventListener('click', () => {
        const currentlyOpen = card.getAttribute('data-open') === 'true';
        if (!isDesktop()) {
          cards.forEach(other => {
            if (other !== card) {
              other.setAttribute('data-open', 'false');
              const ob = other.querySelector('.kav-card-body');
              if (ob) ob.style.maxHeight = '0px';
            }
          });
        }
        setOpen(!currentlyOpen);
      });

      setOpen(false);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('theme-toggle'); if (btn) btn.addEventListener('click', toggleTheme);
    const menuBtn = document.getElementById('menu-toggle'); const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function() {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      });
      mobileMenu.addEventListener('click', function(e) { if (e.target.tagName === 'A') { mobileMenu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); mobileMenu.setAttribute('aria-hidden', 'true'); } });
    }

    if (location.hash) setActiveNav(location.hash);
    window.addEventListener('hashchange', function() { setActiveNav(location.hash); });

    wireInPageNavClicks();
    initScrollSpy();
    initBrandToggle();
    initExperienceTabs();
    initCommentsToggle();
    initKavidhaiStack();
  });
})();
