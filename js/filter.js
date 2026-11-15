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
   8. Seminar Mobile-Only Carousel Slider (2s Auto-Pass, Center-Focus)
   ========================================================================== */
function initSeminarMobileSlider() {
  const gallery       = document.getElementById('seminar-gallery');
  const track         = document.getElementById('seminar-gallery-track');
  const dotsContainer = document.getElementById('seminar-slider-dots');
  if (!gallery || !track) return;

  const frames = Array.from(track.querySelectorAll('.gallery-photo-frame'));
  const total  = frames.length;
  if (total <= 1) return;

  let currentIndex = 0;
  let intervalId   = null;
  let isPaused     = false;
  let startX       = 0;
  let startY       = 0;
  let currentX     = 0;
  let currentY     = 0;
  let isDragging   = false;

  /* ── Build indicator dots ── */
  if (dotsContainer) {
    dotsContainer.innerHTML = frames.map((_, i) =>
      `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
    ).join('');

    dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetIndex = parseInt(dot.dataset.index, 10);
        goToSlide(targetIndex);
        resetTimer();
      });
    });
  }

  function updateClasses() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      /* Desktop view: remove slider positioning classes entirely */
      frames.forEach(frame => {
        frame.classList.remove('slide-active', 'slide-prev', 'slide-next', 'slide-hidden');
      });
      return;
    }

    frames.forEach((frame, i) => {
      frame.classList.remove('slide-active', 'slide-prev', 'slide-next', 'slide-hidden');
      if (i === currentIndex) {
        frame.classList.add('slide-active');
      } else if (i === (currentIndex - 1 + total) % total) {
        frame.classList.add('slide-prev');
      } else if (i === (currentIndex + 1) % total) {
        frame.classList.add('slide-next');
      } else {
        frame.classList.add('slide-hidden');
      }
    });

    if (dotsContainer) {
      dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % total;
    updateClasses();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + total) % total;
    updateClasses();
  }

  function goToSlide(index) {
    currentIndex = (index + total) % total;
    updateClasses();
  }

  function startTimer() {
    stopTimer();
    if (window.innerWidth <= 768 && !isPaused) {
      intervalId = setInterval(nextSlide, 2000); /* 2 seconds pass */
    }
  }

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resetTimer() {
    stopTimer();
    startTimer();
  }

  /* ── Mobile Touch Swipes ── */
  gallery.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    currentY = startY;
    isDragging = true;
    stopTimer();
  }, { passive: true });

  gallery.addEventListener('touchmove', (e) => {
    if (!isDragging || window.innerWidth > 768) return;
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
  }, { passive: true });

  gallery.addEventListener('touchend', () => {
    if (!isDragging || window.innerWidth > 768) return;
    isDragging = false;
    const diffX = currentX - startX;
    const diffY = currentY - startY;
    /* If horizontal motion is greater than vertical, trigger slide */
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    resetTimer();
  });

  /* ── Intercept clicks on non-active preview cards to bring them to center ── */
  frames.forEach((frame, i) => {
    frame.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (i !== currentIndex) {
          e.stopPropagation();
          e.preventDefault();
          goToSlide(i);
          resetTimer();
        }
      }
    }, true);
  });

  /* ── Pause on hover ── */
  gallery.addEventListener('mouseenter', () => {
    isPaused = true;
    stopTimer();
  });
  gallery.addEventListener('mouseleave', () => {
    isPaused = false;
    startTimer();
  });

  /* ── Pause when tab hidden ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  /* ── Pause when inspector drawer opens ── */
  const drawerEl = document.getElementById('inspector-drawer');
  if (drawerEl && 'MutationObserver' in window) {
    const drawerObserver = new MutationObserver(() => {
      const isOpen = drawerEl.classList.contains('is-open');
      if (isOpen) {
        stopTimer();
      } else {
        startTimer();
      }
    });
    drawerObserver.observe(drawerEl, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Responsive breakpoint listener ── */
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    const wasMobile = lastW <= 768;
    const isMobile  = window.innerWidth <= 768;
    lastW = window.innerWidth;

    if (wasMobile !== isMobile) {
      updateClasses();
      if (isMobile) {
        startTimer();
      } else {
        stopTimer();
      }
    }
  });

  /* Initial activation */
  updateClasses();
  if (window.innerWidth <= 768) {
    startTimer();
  }
}

/* ==========================================================================
   Public init — called by app.js after all DOM is rendered
   ========================================================================== */
function initNetworkBackgrounds() {
  const sections = document.querySelectorAll('.section');
  if (!sections.length) return;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = new Map();
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const state = states.get(entry.target);
          if (!state) return;
          if (entry.isIntersecting) state.start();
          else state.stop();
        });
      }, { rootMargin: '100px 0px' })
    : null;

  function createNetwork(section) {
    const canvas = document.createElement('canvas');
    canvas.className = 'network-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);

    const context = canvas.getContext('2d');
    if (!context) {
      console.warn('[Portfolio] Network background could not create a canvas context.');
      canvas.remove();
      return;
    }

    let width = 0;
    let height = 0;
    let frameId = 0;
    let previousTime = 0;
    let visible = false;
    let points = [];

    function render(delta, time) {
      context.clearRect(0, 0, width, height);

      points.forEach(point => {
        point.x += point.vx * delta;
        point.y += point.vy * delta;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
        point.x = Math.max(0, Math.min(width, point.x));
        point.y = Math.max(0, Math.min(height, point.y));
      });

      const linkDistance = Math.min(230, Math.max(130, width * 0.17));
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance >= linkDistance) continue;

          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.strokeStyle = `rgba(230, 232, 236, ${0.18 + (1 - distance / linkDistance) * 0.45})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }

      points.forEach(point => {
        const pulse = (Math.sin(time * 0.0012 + point.phase) + 1) / 2;
        context.beginPath();
        context.arc(point.x, point.y, 2 + pulse * 1.5, 0, Math.PI * 2);
        context.fillStyle = `rgba(230, 232, 236, ${0.72 + pulse * 0.28})`;
        context.shadowColor = 'rgba(230, 232, 236, 0.85)';
        context.shadowBlur = 5 + pulse * 9;
        context.fill();
      });
      context.shadowBlur = 0;
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.max(30, Math.min(90, Math.round((width * height) / 18000)));
      points = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.15 + Math.random() * 0.25;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          phase: Math.random() * Math.PI * 2,
        };
      });
      render(0, performance.now());
    }

    function tick(time) {
      frameId = 0;
      if (!visible || document.hidden) return;
      const delta = previousTime ? Math.min((time - previousTime) / 16.67, 2) : 1;
      previousTime = time;
      render(delta, time);
      frameId = window.requestAnimationFrame(tick);
    }

    const state = {
      start() {
        visible = true;
        if (reducedMotion || document.hidden) {
          render(0, performance.now());
          return;
        }
        if (!frameId) frameId = window.requestAnimationFrame(tick);
      },
      stop() {
        visible = false;
        previousTime = 0;
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
      },
      pause() {
        previousTime = 0;
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
      },
      resume() {
        if (visible && !reducedMotion && !document.hidden && !frameId) {
          frameId = window.requestAnimationFrame(tick);
        }
      },
    };

    resize();
    states.set(section, state);
    if (observer) observer.observe(section);
    else state.start();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(section);
    else window.addEventListener('resize', resize, { passive: true });
  }

  sections.forEach(section => {
    if (!section.querySelector('.network-canvas')) createNetwork(section);
  });

  document.addEventListener('visibilitychange', () => {
    states.forEach(state => {
      if (document.hidden) state.pause();
      else if (observer) state.resume();
      else state.start();
    });
  });
}

function initFilters() {
  initNetworkBackgrounds();
  initProjectFilters();
  initArchiveExpander();
  initCertTabs();
  setupViewMore('.skill-card',         'viewMoreSkillsBtn', 4);
  setupViewMore('.certification-card', 'viewMoreCertsBtn',  4);
  initSeminarMobileSlider();
  initScrollReveal();
  initMobileMenu();
  initActiveNavHighlight();
}

