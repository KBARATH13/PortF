/**
 * filter.js — Project filter bar, Certificate tab switcher & UX helpers
 *
 * Archive-state contract with app.js (window.PortfolioState):
 *
 *   archiveExpanded  — true when user has clicked "View Archive"
 *   activeFilter     — current filter string ('all' | 'mobile' | 'full-stack' | …)
 *
 * Filter × Archive matrix:
 *
 *  ┌──────────────────────┬───────────────────────────────────────────────┐
 *  │ activeFilter         │ Visibility rule                               │
 *  ├──────────────────────┼───────────────────────────────────────────────┤
 *  │ 'all'                │ Show pillar cards; archive obeys its toggle   │
 *  │ any specific filter  │ Show ALL matching cards (pillar + archive)    │
 *  │                      │ Archive expander hidden while filter is active│
 *  └──────────────────────┴───────────────────────────────────────────────┘
 */

/* ==========================================================================
   1. Project Filter Bar
   ========================================================================== */
function initProjectFilters() {
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const duoGrid      = document.querySelector('.featured-duo-grid');
  const expanderWrap = document.getElementById('archive-expander-wrap');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      /* ── Activate clicked button ── */
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      window.PortfolioState.activeFilter = filter;

      const isAll = filter === 'all';

      /* ── Show / hide each card ── */
      const allCards = document.querySelectorAll('.projects-grid .project-card');
      let visibleDuoCount = 0;

      allCards.forEach(card => {
        const cats    = (card.dataset.category || '').split(' ');
        const isPillar = card.dataset.pillar !== 'false';
        const matches  = isAll ? true : cats.includes(filter);

        if (!matches) {
          /* Doesn't match filter → always hide */
          card.style.display = 'none';
          return;
        }

        if (isAll) {
          /* Matches + filter is "all" → respect archive toggle */
          const inArchive = !isPillar;
          const hidden    = inArchive && !window.PortfolioState.archiveExpanded;
          card.style.display = hidden ? 'none' : 'flex';
        } else {
          /* Matches + specific filter → always show (reveals archive) */
          card.style.display = 'flex';
          /* Animate in if it was archive-hidden */
          if (card.classList.contains('archive-hidden')) {
            card.classList.remove('archive-hidden');
            card.style.opacity = '0';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.3s ease';
              card.style.opacity    = '1';
            });
          } else {
            card.style.opacity   = '0';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.3s ease';
              card.style.opacity    = '1';
            });
          }
        }

        /* Count visible duo-grid children for column collapse */
        if (duoGrid && duoGrid.contains(card)) visibleDuoCount++;
      });

      /* ── Duo-grid column adjustment ── */
      if (duoGrid) {
        const dueVisible = [...duoGrid.querySelectorAll('.project-card')]
          .filter(c => c.style.display !== 'none').length;

        if (dueVisible === 0) {
          duoGrid.style.display = 'none';
        } else {
          duoGrid.style.display = 'grid';
          duoGrid.style.gridTemplateColumns =
            (dueVisible === 1 || window.innerWidth <= 960)
              ? '1fr'
              : 'repeat(2, 1fr)';
        }
      }

      /* ── Archive expander visibility ── */
      if (expanderWrap) {
        /* Hide expander while a specific filter is active (it's redundant context) */
        expanderWrap.style.display = isAll ? '' : 'none';
      }
    });
  });
}

/* ==========================================================================
   2. Certificate Tab Switcher
   ========================================================================== */
function initCertTabs() {
  const tabBar = document.getElementById('cert-tab-bar');
  if (!tabBar) return;

  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.cert-tab-btn');
    if (!btn) return;

    /* Update tab active state */
    tabBar.querySelectorAll('.cert-tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const tab = btn.dataset.tab;
    const certCards = document.querySelectorAll('.certification-card');

    certCards.forEach(card => {
      const cat  = card.dataset.category || '';
      const show = tab === 'all' || cat === tab;
      card.style.display = show ? '' : 'none';

      if (show) {
        card.style.opacity = '0';
        requestAnimationFrame(() => {
          card.style.transition = 'opacity 0.3s ease';
          card.style.opacity    = '1';
        });
      }
    });
  });
}

/* ==========================================================================
   3. "View More" expander (skills & certs on mobile ≤768px)
   ========================================================================== */
function setupViewMore(itemsSelector, btnId, visibleCount) {
  const items = document.querySelectorAll(itemsSelector);
  const btn   = document.getElementById(btnId);
  if (!btn || !items.length) return;

  let isExpanded = false;
  let lastWidth = window.innerWidth;

  function applyLimit() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (isExpanded) {
        items.forEach(item => (item.style.display = ''));
        btn.style.display = 'none';
      } else if (items.length > visibleCount) {
        items.forEach((item, i) => {
          item.style.display = i >= visibleCount ? 'none' : '';
        });
        btn.style.display = 'inline-block';
      }
    } else {
      items.forEach(item => (item.style.display = ''));
      btn.style.display = 'none';
    }
  }

  btn.addEventListener('click', () => {
    isExpanded = true;
    items.forEach(item => (item.style.display = ''));
    btn.style.display = 'none';
  });

  applyLimit();

  // Fix: Mobile browsers trigger resize on scroll when the address bar hides/shows (changing innerHeight only).
  // Ignore purely vertical resizes so expanded sections never collapse unexpectedly!
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    applyLimit();
  });
}

/* ==========================================================================
   4. Scroll-reveal via IntersectionObserver
   ========================================================================== */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          // Fix: Once revealed, unobserve immediately to prevent section shrinking/jumping during scroll
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
  );

  document.querySelectorAll('.section:not(#navbar)').forEach(sec => {
    sec.classList.add('animate-on-scroll');
    observer.observe(sec);
  });
}

/* ==========================================================================
   5. Mobile hamburger auto-close on link click
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  if (!menuToggle) return;
  document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => { menuToggle.checked = false; });
  });
}

/* ==========================================================================
   6. Active nav-link highlighting on scroll
   ========================================================================== */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('main section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-list a');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(s => observer.observe(s));
}

/* ==========================================================================
   7. Top 3 vs Archive Projects Expander
   ========================================================================== */
function initArchiveExpander() {
  const wrap = document.getElementById('archive-expander-wrap');
  const grid = document.getElementById('projects-grid');
  if (!wrap || !grid) return;

  const archiveCards = grid.querySelectorAll('.project-card[data-pillar="false"]');
  const count = archiveCards.length;
  if (!count) return;

  wrap.innerHTML = `
    <button id="archive-expander-btn" class="archive-expander-btn" aria-expanded="false">
      <i class="fas fa-layer-group"></i>
      <span class="archive-btn-text">View Archive</span>
      <span class="archive-count-badge">(+${count} More Projects)</span>
      <i class="fas fa-chevron-down archive-chevron"></i>
    </button>`;

  wrap.hidden = false;

  const btn = document.getElementById('archive-expander-btn');

  btn.addEventListener('click', () => {
    const expanding = !window.PortfolioState.archiveExpanded;
    window.PortfolioState.archiveExpanded = expanding;
    btn.setAttribute('aria-expanded', String(expanding));

    const currentArchiveCards = grid.querySelectorAll('.project-card[data-pillar="false"]');

    if (expanding) {
      /* Reveal archive cards with staggered fade-in */
      currentArchiveCards.forEach((card, i) => {
        card.classList.remove('archive-hidden');
        card.style.opacity = '0';
        card.style.transition = `opacity 0.35s ease ${i * 60}ms`;
        requestAnimationFrame(() => { card.style.opacity = '1'; });
      });
      btn.querySelector('.archive-btn-text').textContent   = 'Collapse Archive';
      btn.querySelector('.archive-count-badge').textContent = `(−${count} Projects)`;
      btn.querySelector('.archive-chevron').style.transform = 'rotate(180deg)';
      btn.classList.add('is-expanded');
    } else {
      /* Collapse: re-hide archive cards */
      currentArchiveCards.forEach(card => {
        card.style.opacity   = '';
        card.style.transition = '';
        card.classList.add('archive-hidden');
      });
      btn.querySelector('.archive-btn-text').textContent   = 'View Archive';
      btn.querySelector('.archive-count-badge').textContent = `(+${count} More Projects)`;
      btn.querySelector('.archive-chevron').style.transform = '';
      btn.classList.remove('is-expanded');
    }
  });
}

/* ==========================================================================
   Public init — called by app.js after all DOM is rendered
   ========================================================================== */
function initFilters() {
  initProjectFilters();
  initArchiveExpander();
  initCertTabs();
  setupViewMore('.skill-card',         'viewMoreSkillsBtn', 4);
  setupViewMore('.certification-card', 'viewMoreCertsBtn',  4);
  initScrollReveal();
  initMobileMenu();
  initActiveNavHighlight();
}
