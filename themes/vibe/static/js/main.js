(function() {
  const storageKey = 'prefers-theme';
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
  }

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
      if (match) {
        a.addEventListener('click', function() {
          setActiveNav('#' + match[1]);
        });
      }
    });
  }

  function initScrollSpy() {
    const ids = ['about', 'experience', 'education'];
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return; // not on home

    const headerOffset = 88; // sticky header height
    let ticking = false;

    function updateActiveFromScroll() {
      ticking = false;
      let bestId = null;
      let bestDelta = Infinity;
      for (const s of sections) {
        const rect = s.getBoundingClientRect();
        // Only consider if section is on screen at least partially
        if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
          const delta = Math.abs(rect.top - headerOffset);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestId = s.id;
          }
        }
      }
      if (bestId) setActiveNav('#' + bestId);
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveFromScroll);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', function() {
      updateActiveFromScroll();
    });

    // Initial call
    updateActiveFromScroll();
  }

  function initBrandToggle() {
    const brand = document.querySelector('.brand');
    const label = document.querySelector('.brand-text');
    if (!brand || !label) return;
    label.addEventListener('click', function() {
      brand.classList.toggle('lang-ta');
    });
  }

  function initExperienceTabs() {
    const rootEl = document.getElementById('experience-tabs');
    if (!rootEl) return;
    const tabs = Array.from(rootEl.querySelectorAll('[role="tab"]'));
    const panels = Array.from(rootEl.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || !panels.length) return;

    function activate(index) {
      tabs.forEach((t, i) => {
        const selected = i === index;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((p, i) => {
        p.classList.toggle('active', i === index);
      });
    }

    // initial
    activate(0);

    tabs.forEach((t, idx) => {
      t.addEventListener('click', () => activate(idx));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (idx + dir + tabs.length) % tabs.length;
          tabs[next].focus();
          activate(next);
        }
      });
    });
  }

  // Wire up after DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    const menuBtn = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', function() {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      });

      mobileMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
          mobileMenu.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Highlight on load if URL has hash
    if (location.hash) setActiveNav(location.hash);
    // Update on hash changes
    window.addEventListener('hashchange', function() { setActiveNav(location.hash); });

    // Update immediately on in-page nav clicks
    wireInPageNavClicks();

    // Scroll-based active state on home
    initScrollSpy();
    initBrandToggle();
    initExperienceTabs();
  });
})();
