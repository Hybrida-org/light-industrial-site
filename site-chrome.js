/* site-chrome.js — the site's nav and footer, written once and dropped into
   every page. There is no build step here (plain files on GitHub Pages), so a
   page marks the two spots with <div data-site-nav> and <div data-site-footer>
   and this script fills them in.

   Load it with a plain <script src="site-chrome.js"></script> placed after the
   footer placeholder but BEFORE a page's own scripts: those scripts bind the
   contact and demo buttons, and the nav's button has to exist by then. A page
   in a sub-folder points at "../site-chrome.js".

   Change a link once, here, and it changes everywhere.

   ── Before go-live ────────────────────────────────────────────────────────
   Links below are written as file paths ending in index.html, so the site can
   be previewed by double-clicking a page in VS Code with no server running.
   That works on a real server too, but the tidy public address for a page is
   "/savings/", not "/savings/index.html". Both resolve, which means search
   engines can see one page at two addresses.

   The fix at launch: set USE_CLEAN_URLS to true below. Nothing else changes.
   Tracked as item 28 in docs/open-questions.md.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Flip to true at launch so links read '/savings/' instead of
  // 'savings/index.html'. Breaks double-click previews off the disk.
  var USE_CLEAN_URLS = false;

  // 'folder' is the page's folder under the site root, '' meaning the root
  // itself. Pages marked `built: false` are not written yet, so their href is
  // '#'. Give a page a folder and flip its flag the day it ships, and every
  // nav and footer on the site picks it up.
  //
  // 'homeAnchor' is for a page that does not exist yet but whose content is
  // already a section on the home page: the link goes to that section instead of
  // nowhere. The day the page ships, flip `built` to true and the anchor is
  // ignored — no link has to be found and changed.
  var PAGES = [
    { label: 'Home',            folder: '',                built: true  },
    { label: 'Document Intake', folder: 'document-intake',  built: true  },
    { label: 'ERP',             folder: 'erp',              built: true  },
    { label: 'Pricing',         folder: 'pricing',          built: true  },
    { label: 'About Us',        folder: 'about',            built: true  },
    { label: 'Contact Us',      folder: 'contact',          built: true  }
  ];

  var LEGAL_PAGES = [
    { label: 'Privacy',       folder: 'privacy',       built: false },
    { label: 'Terms',         folder: 'terms',         built: false },
    { label: 'Accessibility', folder: 'accessibility', built: false }
  ];

  // Footer-only links: real pages that don't earn a slot in the top nav.
  var EXTRA_FOOTER_PAGES = [
    { label: 'Savings calculator', folder: 'savings', built: true }
  ];

  /* Where the site root sits, worked out from this script's own address —
     it lives at the root, so stripping its filename leaves the root. This is
     what lets one shared file serve pages at any depth, on a server or off
     the disk. */
  var ROOT = (function () {
    var self = document.currentScript;
    if (!self) return '';                       // very old browser: fall back to root-absolute
    return self.src.replace(/site-chrome\.js(\?.*)?$/, '');
  })();

  var CONTACT_EMAIL = 'danika@lightindustrial.co.za';
  var CONTACT_MAILTO = 'mailto:' + CONTACT_EMAIL + '?subject=Light%20Industrial%20enquiry';
  var DEMO_URL = 'https://calendly.com/donovan-lightindustrial/30min';

  /* The phone number for the site, waiting on HYBRIDA-918. Paste it here in the
     shape a person should read it; PHONE_DIAL is the same number in the shape a
     phone should dial. While PHONE is empty nothing renders — a page with no
     number is better than a page with a wrong one. */
  var PHONE = '';
  var PHONE_DIAL = '';

  /* The office address, shown in the footer on every page. One line per line of
     the address; change it here and it changes site-wide. */
  var ADDRESS_LINES = [
    '22 on Sloane',
    '39 Somerset Rd',
    'Green Point',
    'Cape Town, 8005'
  ];

  function hrefFor(page) {
    if (!page.built) return page.homeAnchor ? homeAnchorHref(page.homeAnchor) : '#';
    if (USE_CLEAN_URLS) return '/' + (page.folder ? page.folder + '/' : '');
    return ROOT + (page.folder ? page.folder + '/' : '') + 'index.html';
  }

  /* A bare '#pricing' from a sub-page would look for that section on the
     sub-page, so off the home page the link carries the home page with it.
     The smooth glide is CSS (`scroll-behavior: smooth`), not script. */
  function homeAnchorHref(anchor) {
    if (document.getElementById(anchor)) return '#' + anchor;
    return hrefFor(PAGES[0]) + '#' + anchor;
  }

  /* Where every 'Get in touch' button points. Looked up rather than written
     out, so the link follows the Contact Us entry in PAGES above. */
  function contactHref() {
    for (var i = 0; i < PAGES.length; i++) {
      if (PAGES[i].folder === 'contact') return hrefFor(PAGES[i]);
    }
    return CONTACT_MAILTO;
  }

  /* Drop 'index.html' and any trailing slash so '/savings', '/savings/' and
     '/savings/index.html' all compare as the same page. */
  function normalise(path) {
    var tidy = path.replace(/index\.html$/, '');
    return tidy.length > 1 ? tidy.replace(/\/+$/, '') : '/';
  }

  var currentPath = normalise(window.location.pathname);

  function isCurrent(page) {
    if (!page.built) return false;
    var pagePath = normalise(hrefFor(page).replace(/^.*?:\/\/[^/]*/, ''));
    return pagePath === currentPath;
  }

  function linkAttrs(page) {
    return isCurrent(page) ? ' aria-current="page"' : '';
  }

  function navMarkup() {
    var deskLinks = PAGES.map(function (page) {
      return '<a href="' + hrefFor(page) + '" class="nav-link"' + linkAttrs(page) + '>' + page.label + '</a>';
    }).join('\n            ');

    var mobileLinks = PAGES.map(function (page) {
      return '<a href="' + hrefFor(page) + '" class="mobile-menu-link"' + linkAttrs(page) + '>' + page.label + '</a>';
    }).join('\n          ');

    return '' +
      '<div class="nav-pill">' +
      '  <a href="' + hrefFor(PAGES[0]) + '" class="flex items-center gap-3 nav-brand-link">' +
      '    <span class="brand-mark font-head">LI</span>' +
      '    <div>' +
      '      <div class="font-head text-[13px] uppercase tracking-[0.24em] brand-name">Light Industrial</div>' +
      '      <div class="mt-[2px] text-[10px] uppercase tracking-[0.18em] brand-sub">Stock control software</div>' +
      '    </div>' +
      '  </a>' +
      '  <nav class="flex items-center gap-6 text-sm" aria-label="Main">' + deskLinks + '</nav>' +
      // 'Get in touch' goes to the Contact Us page, where the full lead form
      // lives. It used to open a pop-up; the pop-up is going away (HYBRIDA-905).
      '  <a href="' + contactHref() + '" class="nav-book-btn">Get in touch</a>' +
      '  <button class="mobile-menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu">' +
      '    <iconify-icon icon="solar:hamburger-menu-linear" width="20" height="20"></iconify-icon>' +
      '  </button>' +
      '</div>' +
      '<div class="mobile-menu" id="mobileMenu" hidden>' + mobileLinks +
      '  <a href="' + contactHref() + '" class="mobile-menu-cta">Get in touch</a>' +
      '</div>';
  }

  function footerMarkup() {
    var navLinks = PAGES.concat(EXTRA_FOOTER_PAGES).map(function (page) {
      return '<a href="' + hrefFor(page) + '" class="site-footer-link-v1"' + linkAttrs(page) + '>' + page.label + '</a>';
    }).join('\n                ');

    var legalLinks = LEGAL_PAGES.map(function (page) {
      return '<a href="' + hrefFor(page) + '">' + page.label + '</a>';
    }).join('\n              ');

    return '' +
      '<div class="site-footer-shell-v1">' +
      '  <div class="site-footer-frame-v1">' +
      '    <div class="site-footer-inner-v1">' +
      '      <div class="site-footer-top-v1">' +
      '        <div class="site-footer-brand-v1 reveal-fade" style="transition-delay: 0.08s;">' +
      '          <div class="site-footer-mark-v1 font-head">LI</div>' +
      '          <h2 class="site-footer-name-v1 font-head">Light Industrial</h2>' +
      '          <p class="site-footer-text-v1">' +
      '            Document intelligence and operations software for South African manufacturers, workshops and merchants.' +
      '            Clean data, accurate stock and' +
      '            books that stay in sync, from the order you place to the stock on your shelf.' +
      '          </p>' +
      '        </div>' +
      '        <div class="reveal-fade" style="transition-delay: 0.14s;">' +
      '          <p class="site-footer-heading-v1">Navigate</p>' +
      '          <div class="site-footer-links-v1">' + navLinks + '</div>' +
      '        </div>' +
      '        <div class="reveal-fade" style="transition-delay: 0.20s;">' +
      '          <p class="site-footer-heading-v1">Connect</p>' +
      '          <div class="site-footer-contact-v1">' +
      '            <a href="' + contactHref() + '" class="site-footer-contact-item-v1">Get in touch</a>' +
      '            <a href="mailto:' + CONTACT_EMAIL + '" class="site-footer-contact-item-v1">' + CONTACT_EMAIL + '</a>' +
      '            <a href="' + DEMO_URL + '" target="_blank" rel="noopener" class="site-footer-contact-item-v1" data-open-demo>Book a 30-min demo</a>' +
      // Street address. <address> is the tag browsers and search engines read as
      // "this is where the business is"; the italics it adds are turned off in CSS.
      '            <address class="site-footer-address-v1">' + ADDRESS_LINES.join('<br>') + '</address>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="site-footer-bottom-v1 reveal-fade" style="transition-delay: 0.24s;">' +
      '        <div class="site-footer-meta-v1">© 2026 Light Industrial. Document intelligence and operations software.</div>' +
      '        <div class="site-footer-legal-v1">' + legalLinks + '</div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  /* The click-to-call card on Contact Us. A tel: link is what makes the number
     tappable on a phone, and it needs the number with no spaces in it. */
  function phoneMarkup() {
    if (!PHONE) return '';
    return '' +
      '<a href="tel:' + PHONE_DIAL + '" class="contact-way">' +
      '  <span class="contact-way-icon" aria-hidden="true">' +
      '    <iconify-icon icon="solar:phone-linear" width="20" height="20"></iconify-icon>' +
      '  </span>' +
      '  <span class="contact-way-label">Call us</span>' +
      '  <span class="contact-way-value">' + PHONE + '</span>' +
      '  <span class="contact-way-note">Tap to dial on a phone.</span>' +
      '</a>';
  }

  function fill(selector, markup) {
    var slot = document.querySelector(selector);
    if (slot) slot.innerHTML = markup;
    return slot;
  }

  /* In-page links to another page on the site: mark the <a> with
     data-site-link="<folder>" and its href is written here from PAGES above.
     That way a link in the body of a page follows the same single source of
     truth as the nav — including the homeAnchor fallback, so a link to a page
     that is not built yet lands on the matching home-page section instead of
     nowhere, and starts pointing at the real page the day it ships. */
  function applySiteLinks() {
    document.querySelectorAll('[data-site-link]').forEach(function (link) {
      var folder = link.getAttribute('data-site-link');
      for (var i = 0; i < PAGES.length; i++) {
        if (PAGES[i].folder === folder) { link.setAttribute('href', hrefFor(PAGES[i])); return; }
      }
    });
  }

  fill('[data-site-nav]', navMarkup());
  fill('[data-site-footer]', footerMarkup());
  fill('[data-site-phone]', phoneMarkup());
  applySiteLinks();

  // Mobile menu toggle. It lives here because the button it drives is created
  // here — a page script could run before this file on a page that loads it late.
  (function () {
    var btn = document.querySelector('.mobile-menu-btn');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    function setOpen(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { setOpen(menu.hidden); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();
})();
