/**
 * app.js — Main Bootstrapper & DOM Renderers
 *
 * Load order (index.html): modal.js → filter.js → app.js  (all deferred)
 *
 * Responsibilities:
 *  - Fetch all JSON data files in parallel (Promise.all)
 *  - Render Projects grid (pillar cards shown, archive hidden by default)
 *  - Render Archive expander button (+N More Projects / Collapse)
 *  - Render Certificates tabs + grid from certificate.json
 *  - Render Seminars showcase from seminars.json
 *  - Wire drawer (Drawer.*) on card clicks
 *  - Expose window.PortfolioState for filter.js cross-module coordination
 *  - Call initFilters() and Drawer.init() after DOM is fully populated
 */

/* ── Shared cross-module state ─────────────────────────────────────────── */
window.PortfolioState = {
  archiveExpanded: false,   // toggled by archive button
  activeFilter:   'all',    // set by filter.js on each click
};

/* ── Data paths ────────────────────────────────────────────────────────── */
const DATA = {
  projects:     'data/projects.json',
  certificates: 'data/certificates.json',
  seminars:     'data/seminars.json',
};

/* ==========================================================================
   Helpers
   ========================================================================== */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ==========================================================================
   Projects Renderer
   ========================================================================== */
function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const duoCards        = projects.filter(p => p.type === 'featured-duo');
  const productionCards = projects.filter(p => p.type === 'production');
  const standardCards   = projects.filter(p => p.type === 'standard');

  let html = '';

  /* ── Featured Duo (2-col side-by-side) */
  if (duoCards.length) {
    html += `<div class="featured-duo-grid">`;
    duoCards.forEach(p => { html += buildFeaturedDuoCard(p); });
    html += `</div>`;
  }

  /* ── Production (full-width span) */
  productionCards.forEach(p => { html += buildProductionCard(p); });

  /* ── Standard thumbnail cards */
  standardCards.forEach(p => { html += buildStandardCard(p); });

  grid.innerHTML = html;

  /* ── Apply archive hide on non-pillar cards immediately */
  grid.querySelectorAll('.project-card[data-pillar="false"]').forEach(card => {
    card.classList.add('archive-hidden');
  });

  /* ── Wire drawer on thumbnail click (standard cards) */
  grid.querySelectorAll('.project-media img').forEach(img => {
    const card = img.closest('.project-card');
    const id   = card?.dataset.projectId;
    if (!id) return;
    img.addEventListener('click', () => {
      const project = projects.find(p => p.id === id);
      if (project) Drawer.openProject(project);
    });
  });

  /* ── Wire drawer on banner click (flagship / production cards) */
  grid.querySelectorAll('.project-banner').forEach(banner => {
    const card = banner.closest('.project-card');
    const id   = card?.dataset.projectId;
    if (!id) return;
    banner.style.cursor = 'pointer';
    banner.title = 'Click to inspect project details';
    banner.addEventListener('click', () => {
      const project = projects.find(p => p.id === id);
      if (project) Drawer.openProject(project);
    });
  });
}

/* ==========================================================================
   Card Builders
   ========================================================================== */
function buildBannerIcons(icons) {
  return (icons || [])
    .map(ic => `<span title="${escAttr(ic.title)}"><i class="${ic.icon}"></i></span>`)
    .join('');
}

function buildTechTags(tags) {
  return (tags || [])
    .map(t => `<span class="tech-tag">${t}</span>`)
    .join('');
}

function buildLinks(links) {
  return (links || [])
    .map(l => {
      const dl  = l.download ? 'download' : '';
      const cls = l.type === 'architecture' ? 'btn btn-architecture' : 'btn btn-secondary';
      return `<a href="${l.href}" target="_blank" rel="noopener" class="${cls}" ${dl}>
                <i class="${l.icon}"></i> ${l.label}
              </a>`;
    })
    .join('');
}

function buildFeaturedDuoCard(p) {
  const cats = (p.categories || []).join(' ');
  return `
    <div class="project-card featured-duo-card"
         data-category="${cats}"
         data-project-id="${p.id}"
         data-pillar="${p.pillar ? 'true' : 'false'}">
      <div class="featured-ribbon">
        <i class="${p.ribbon.icon}"></i> ${p.ribbon.label}
      </div>
      <div class="project-banner ${p.bannerClass}">
        <div class="banner-tech-icons">${buildBannerIcons(p.bannerIcons)}</div>
        <div class="banner-title-area">
          <h3>${p.title}</h3>
          <p>${p.subtitle}</p>
        </div>
      </div>
      <div class="project-body">
        <p class="project-description">${p.description}</p>
        <div class="project-tech-stack">${buildTechTags(p.tags)}</div>
        <div class="project-links">${buildLinks(p.links)}</div>
      </div>
    </div>`;
}

function buildProductionCard(p) {
  const cats = (p.categories || []).join(' ');
  const flexTag = p.flexibilityTag
    ? `<div class="flexibility-tag"><i class="fas fa-check-circle"></i> ${p.flexibilityTag}</div>`
    : '';
  return `
    <div class="project-card production-project"
         data-category="${cats}"
         data-project-id="${p.id}"
         data-pillar="${p.pillar ? 'true' : 'false'}">
      <div class="production-ribbon">
        <span class="pulse-indicator"></span> ${p.ribbon.label}
      </div>
      <div class="project-banner ${p.bannerClass}">
        <div class="banner-tech-icons">${buildBannerIcons(p.bannerIcons)}</div>
        <div class="banner-title-area">
          ${flexTag}
          <h3>${p.title}</h3>
          <p>${p.subtitle}</p>
        </div>
      </div>
      <div class="project-body">
        <p class="project-description">${p.description}</p>
        <div class="project-tech-stack">${buildTechTags(p.tags)}</div>
        <div class="project-links">${buildLinks(p.links)}</div>
      </div>
    </div>`;
}

function buildStandardCard(p) {
  const cats = (p.categories || []).join(' ');
  return `
    <div class="project-card"
         data-category="${cats}"
         data-project-id="${p.id}"
         data-pillar="${p.pillar ? 'true' : 'false'}">
      <div class="project-media">
        <img src="${p.image}" alt="${escAttr(p.imageAlt || p.title)}" loading="lazy">
      </div>
      <div class="project-body">
        <h3>${p.title}</h3>
        <p class="project-description">${p.description}</p>
        <div class="project-tech-stack">${buildTechTags(p.tags)}</div>
        <div class="project-links">${buildLinks(p.links)}</div>
      </div>
    </div>`;
}

/* ==========================================================================
   Certificates Renderer
   ========================================================================== */
function renderCertificates(data) {
  const tabBar = document.getElementById('cert-tab-bar');
  const grid   = document.getElementById('certifications-grid');
  if (!grid) return;

  /* Render tab bar */
  if (tabBar && data.tabs) {
    const allTab = `<button class="cert-tab-btn active" data-tab="all" role="tab" aria-selected="true">
                      <i class="fas fa-th-large"></i> All
                    </button>`;
    const tabs = data.tabs.map(t =>
      `<button class="cert-tab-btn" data-tab="${t.id}" role="tab" aria-selected="false">
         <i class="${t.icon}"></i> ${t.label}
       </button>`
    ).join('');
    tabBar.innerHTML = allTab + tabs;
  }

  /* Render cert cards */
  grid.innerHTML = (data.certificates || []).map(c => `
    <div class="certification-card" data-category="${c.category}" data-cert-id="${c.id}"
         role="button" tabindex="0" aria-label="View ${c.title} certificate">
      <img src="${c.image}" alt="${escAttr(c.title)}" loading="lazy">
      <h3>${c.title}</h3>
      <p><strong>Issued by:</strong> ${c.issuer}</p>
      <p>${c.date}</p>
    </div>`
  ).join('');

  /* Wire drawer: click + Enter/Space keyboard */
  grid.querySelectorAll('.certification-card').forEach(card => {
    const id = card.dataset.certId;
    const openIt = () => {
      const cert = data.certificates.find(c => c.id === id);
      if (cert) Drawer.openCert(cert);
    };
    card.addEventListener('click', openIt);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); }
    });
  });
}

/* ==========================================================================
   Seminars Renderer
   ========================================================================== */
function renderSeminars(seminars) {
  const container = document.getElementById('seminar-container');
  if (!container || !seminars.length) return;

  const s = seminars[0];

  const metaHTML = `
    <div class="seminar-meta-strip">
      <span class="meta-badge speaker"><i class="${s.meta.roleIcon}"></i> ${s.meta.role}</span>
      <span class="meta-badge audience"><i class="${s.meta.audienceIcon}"></i> ${s.meta.audience}</span>
      <span class="meta-badge venue"><i class="${s.meta.venueIcon}"></i> ${s.meta.venue}</span>
    </div>`;

  const photosHTML = s.photos.map((ph, i) => `
    <div class="gallery-photo-frame ${i === 0 ? 'primary' : 'secondary'}"
         data-photo-src="${escAttr(ph.src)}"
         data-photo-alt="${escAttr(ph.alt)}"
         data-photo-label="${escAttr(ph.label)}"
         role="button" tabindex="0"
         title="Click to expand view"
         aria-label="${escAttr(ph.label)}">
      <img src="${ph.src}" alt="${escAttr(ph.alt)}" loading="lazy">
      <span class="frame-label"><i class="${ph.labelIcon}"></i> ${ph.label}</span>
    </div>`
  ).join('');

  const syllabusHTML = s.syllabus.map(item => `
    <div class="syllabus-item">
      <h4><i class="${item.icon}"></i> ${item.title}</h4>
      <p>${item.body}</p>
    </div>`
  ).join('');

  const tagsHTML = s.tags.map(t =>
    `<span class="tech-tag"><i class="${t.icon}"></i> ${t.label}</span>`
  ).join('');

  container.innerHTML = `
    <div class="seminar-showcase-card">
      ${metaHTML}
      <div class="seminar-grid-layout">
        <div class="seminar-visual-col">
          <div class="seminar-dual-gallery">${photosHTML}</div>
        </div>
        <div class="seminar-details-col">
          <span class="seminar-kicker">${s.kicker}</span>
          <h3>${s.title}</h3>
          <p class="seminar-abstract">${s.abstract}</p>
          <div class="syllabus-grid">${syllabusHTML}</div>
          <div class="seminar-footer-actions">
            <div class="seminar-tech-tags">${tagsHTML}</div>
          </div>
        </div>
      </div>
    </div>`;

  /* Wire photo frames → drawer */
  container.querySelectorAll('.gallery-photo-frame').forEach(frame => {
    const openIt = () => {
      Drawer.openPhoto({
        src:   frame.dataset.photoSrc,
        alt:   frame.dataset.photoAlt,
        label: frame.dataset.photoLabel,
      });
    };
    frame.addEventListener('click', openIt);
    frame.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); }
    });
  });
}

/* ==========================================================================
   Bootstrap
   ========================================================================== */
async function bootstrap() {
  try {
    const [projects, certData, seminars] = await Promise.all([
      fetchJSON(DATA.projects),
      fetchJSON(DATA.certificates),
      fetchJSON(DATA.seminars),
    ]);

    renderProjects(projects);
    renderCertificates(certData);
    renderSeminars(seminars);

    /* Init interactive behaviours AFTER DOM is fully populated */
    Drawer.init();
    initFilters();

  } catch (err) {
    console.error('[Portfolio] Bootstrap failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
