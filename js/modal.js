/**
 * modal.js — Slide-Out Inspector Drawer
 *
 * Manages a 420px right-side drawer for:
 *  - Project card image inspection
 *  - Certificate enlarged preview
 *  - Seminar gallery photo enlargement
 *
 * Replaces the old pitch-black fullscreen modal.
 * Exported as a module-style IIFE; consumed by app.js.
 */

const Drawer = (() => {
  /* ─── Internal state ─────────────────────────────── */
  let _isOpen = false;

  /* ─── DOM refs (resolved on first open) ─────────── */
  let _drawer, _overlay, _closeBtn, _body;

  function _resolve() {
    _drawer  = document.getElementById('inspector-drawer');
    _overlay = document.getElementById('drawer-overlay');
    _closeBtn = document.getElementById('drawer-close-btn');
    _body    = document.getElementById('drawer-body');
  }

  /* ─── Core open / close ──────────────────────────── */
  function open(contentHTML, titleText = 'Inspector') {
    if (!_drawer) _resolve();

    // Update header title
    const titleEl = _drawer.querySelector('.drawer-header-title span');
    if (titleEl) titleEl.textContent = titleText;

    // Inject content
    _body.innerHTML = contentHTML;

    // Reveal
    _drawer.classList.add('is-open');
    _overlay.classList.add('is-open');
    _isOpen = true;

    // Trap focus on close button
    _closeBtn && _closeBtn.focus();
  }

  function close() {
    if (!_drawer) return;
    _drawer.classList.remove('is-open');
    _overlay.classList.remove('is-open');
    _isOpen = false;

    // Clear after CSS transition (~350ms)
    setTimeout(() => {
      if (_body) _body.innerHTML = '';
    }, 380);
  }

  /* ─── Content builders ───────────────────────────── */

  /**
   * Opens the drawer showing a project's thumbnail + full details.
   * @param {Object} project — from projects.json
   */
  function openProject(project) {
    const imageHTML = project.image
      ? `<div class="drawer-image-wrap">
           <img src="${project.image}" alt="${project.imageAlt || project.title}" loading="lazy">
         </div>`
      : '';

    const tagsHTML = (project.tags || [])
      .map(t => `<span class="tech-tag">${t}</span>`)
      .join('');

    const linksHTML = (project.links || [])
      .map(l => {
        const dl = l.download ? 'download' : '';
        const cls = l.type === 'architecture' ? 'btn btn-architecture' : 'btn btn-secondary';
        return `<a href="${l.href}" target="_blank" rel="noopener" class="${cls}" ${dl}>
                  <i class="${l.icon}"></i> ${l.label}
                </a>`;
      })
      .join('');

    const html = `
      ${imageHTML}
      <p class="drawer-title">${project.title}</p>
      ${project.subtitle ? `<p class="drawer-subtitle">${project.subtitle}</p>` : ''}
      <p class="drawer-description">${project.description}</p>
      <div class="drawer-tags">${tagsHTML}</div>
      <div class="drawer-links">${linksHTML}</div>
    `;

    open(html, project.title);
  }

  /**
   * Opens the drawer showing a full-size certificate.
   * @param {Object} cert — from certificate.json
   */
  function openCert(cert) {
    const html = `
      <img class="drawer-cert-img" src="${cert.image}" alt="${cert.title}" loading="lazy">
      <p class="drawer-title">${cert.title}</p>
      <div class="drawer-cert-meta">
        <p><strong>Issued by:</strong> ${cert.issuer}</p>
        <p><strong>Date:</strong> ${cert.date}</p>
      </div>
    `;
    open(html, cert.title);
  }

  /**
   * Opens the drawer showing a seminar photo at full width.
   * @param {Object} photo — { src, alt, label }
   */
  function openPhoto(photo) {
    const html = `
      <div class="drawer-image-wrap">
        <img src="${photo.src}" alt="${photo.alt}" loading="lazy" style="max-height:none">
      </div>
      <p class="drawer-title">${photo.label}</p>
    `;
    open(html, 'Seminar Photo');
  }

  /* ─── Event wiring (called once by app.js) ───────── */
  function init() {
    _resolve();
    if (!_drawer || !_overlay || !_closeBtn) {
      console.warn('[Drawer] DOM elements not found. Check index.html.');
      return;
    }

    _closeBtn.addEventListener('click', close);
    _overlay.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _isOpen) close();
    });
  }

  return { init, open, close, openProject, openCert, openPhoto };
})();
