/* tracking.js — consent, GTM and the dataLayer events for lightindustrial.co.za.

   Loaded as the FIRST script in <head> of every page. Everything that talks to
   a vendor (GA4, Google Ads, Meta, LinkedIn, Clarity, HubSpot tracking) fires
   inside GTM, so IDs are pasted once there. This file only:

     1. sets Consent Mode v2 defaults before GTM loads,
     2. loads GTM when gtmId is set,
     3. remembers consent in localStorage 'li_consent' and shows a banner,
     4. pushes the events listed in docs/tracking-setup.md into dataLayer.

   It must never throw when every ID below is empty. */
window.LI_TRACKING = {
  gtmId: '',                 // GTM-XXXXXXX
  ga4Id: '',                 // G-XXXXXXXXXX  (set inside GTM, kept here for the doc)
  googleAdsId: '',           // AW-XXXXXXXXX
  googleAdsLeadLabel: '',    // conversion label for lead_form_submit
  googleAdsDemoLabel: '',    // conversion label for demo_click
  metaPixelId: '',           // 15-16 digits
  linkedinPartnerId: '',
  clarityId: '',
  hubspotPortalId: '148893758', hubspotRegion: 'eu1',
  // No banner: POPIA does not require one, so consent defaults to granted and
  // nothing is shown. Set true to bring the banner and the denied defaults back.
  consentBanner: false
};

(function () {
  'use strict';
  var T = window.LI_TRACKING;
  var KEY = 'li_consent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  function push(name, params) {
    var ev = { event: name };
    for (var k in params) if (params[k] !== undefined && params[k] !== null && params[k] !== '') ev[k] = params[k];
    window.dataLayer.push(ev);
  }

  // ── Consent ────────────────────────────────────────────────────────────────
  function readConsent() {
    try {
      var c = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      return c && typeof c === 'object' ? c : null;
    } catch (e) { return null; }
  }
  function writeConsent(c) {
    try { window.localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* storage blocked */ }
  }
  function consentSignals(c) {
    var a = c && c.analytics ? 'granted' : 'denied';
    var m = c && c.marketing ? 'granted' : 'denied';
    return {
      ad_storage: m, ad_user_data: m, ad_personalization: m,
      analytics_storage: a,
      functionality_storage: 'granted', security_storage: 'granted'
    };
  }

  var stored = readConsent();
  var defaults = consentSignals(T.consentBanner ? null : { analytics: true, marketing: true });
  defaults.wait_for_update = 500;
  gtag('consent', 'default', defaults);
  if (T.consentBanner && stored) gtag('consent', 'update', consentSignals(stored));

  function setConsent(analytics, marketing) {
    var c = { analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
    writeConsent(c);
    gtag('consent', 'update', consentSignals(c));
    push('consent_update', { analytics: c.analytics, marketing: c.marketing });
    stored = c;
  }

  // ── GTM ────────────────────────────────────────────────────────────────────
  if (T.gtmId) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(T.gtmId);
    (document.head || document.documentElement).appendChild(s);
  }

  // ── Page type ──────────────────────────────────────────────────────────────
  var path = window.location.pathname;
  function pageType() {
    if (/^\/(index\.html)?$/.test(path)) return 'home';
    if (/^\/(document-intake|intake)\//.test(path)) return 'intake';
    if (/^\/erp\//.test(path)) return 'erp';
    if (/^\/pricing\//.test(path)) return 'pricing';
    if (/^\/about\//.test(path)) return 'about';
    if (/^\/contact\//.test(path)) return 'contact';
    if (/^\/savings\//.test(path)) return 'savings';
    if (/^\/stop-retyping\//.test(path)) return 'lander';
    if (/^\/thank-you\//.test(path)) return 'thank_you';
    if (/^\/(privacy|terms|accessibility|data-handling)\//.test(path)) return 'legal';
    return 'other';
  }
  var type = pageType();
  push('page_view_li', { page_path: path, page_type: type });
  if (type === 'pricing') push('pricing_view', { page_path: path });
  // The hero mini form on Home redirects here on success, so this page load is
  // the lead event for it. The full form and the savings gate push their own
  // lead_form_submit inline and never land here.
  if (type === 'thank_you') {
    var src = 'hero';
    try { src = new URLSearchParams(location.search).get('src') || 'hero'; } catch (e) {}
    push('lead_form_submit', { form_source: src, page_path: path });
  }

  // ── Banner ─────────────────────────────────────────────────────────────────
  var CSS = '' +
    '.li-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:460px;margin:0 auto;' +
      'background:var(--paper,#efece6);color:#1a1816;border:1px solid var(--bronze,#a88a6d);border-radius:12px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.35);padding:18px 18px 16px;font-family:"Mona Sans",system-ui,sans-serif;font-size:14px;line-height:1.45}' +
    '@media(min-width:640px){.li-cc{left:auto;right:24px;bottom:24px}}' +
    '.li-cc h2{margin:0 0 6px;font:600 16px/1.3 Poppins,"Mona Sans",sans-serif;color:#1a1816}' +
    '.li-cc p{margin:0 0 12px}' +
    '.li-cc a{color:var(--bronze-ink,#6d5641);text-decoration:underline}' +
    '.li-cc-row{display:flex;flex-wrap:wrap;gap:8px}' +
    '.li-cc button{font:600 14px Poppins,"Mona Sans",sans-serif;border-radius:8px;padding:10px 14px;cursor:pointer;border:1px solid var(--bronze,#a88a6d);background:transparent;color:#1a1816;flex:1 1 auto;min-height:44px}' +
    '.li-cc button.li-cc-primary{background:var(--bronze,#a88a6d);color:#15100b}' +
    '.li-cc button.li-cc-link{border:0;flex:1 1 100%;padding:6px;text-decoration:underline;font-weight:500}' +
    '.li-cc button:focus-visible{outline:2px solid var(--sage,#8ea596);outline-offset:2px}' +
    '.li-cc-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid rgba(26,24,22,.12)}' +
    '.li-cc-opt label{flex:1}' +
    '.li-cc-opt small{display:block;color:#5c5852}' +
    '.li-cc-opt input{width:22px;height:22px;accent-color:var(--bronze-ink,#6d5641);flex:none}' +
    '.li-cc[hidden]{display:none}';

  var banner, lastFocus;
  function removeBanner() {
    if (!banner) return;
    banner.parentNode.removeChild(banner);
    banner = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function showBanner(settings) {
    if (banner) removeBanner();
    lastFocus = document.activeElement;
    if (!document.getElementById('li-cc-css')) {
      var st = document.createElement('style');
      st.id = 'li-cc-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    banner = document.createElement('div');
    banner.className = 'li-cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'li-cc-title');
    banner.setAttribute('aria-describedby', 'li-cc-desc');
    var a = stored ? stored.analytics : false, m = stored ? stored.marketing : false;
    banner.innerHTML = settings
      ? '<h2 id="li-cc-title">Cookie settings</h2>' +
        '<p id="li-cc-desc">Necessary cookies are always on. Choose the rest.</p>' +
        '<div class="li-cc-opt"><label for="li-cc-a">Analytics<small>How the site is used, so we can improve it.</small></label><input type="checkbox" id="li-cc-a"' + (a ? ' checked' : '') + '></div>' +
        '<div class="li-cc-opt"><label for="li-cc-m">Marketing<small>Measures our adverts and shows relevant ones.</small></label><input type="checkbox" id="li-cc-m"' + (m ? ' checked' : '') + '></div>' +
        '<div class="li-cc-row"><button type="button" class="li-cc-primary" data-cc="save">Save settings</button>' +
        '<button type="button" data-cc="all">Accept all</button></div>'
      : '<h2 id="li-cc-title">Cookies on this site</h2>' +
        '<p id="li-cc-desc">We use cookies to see how the site is used and to measure our adverts. See our <a href="/privacy/">privacy policy</a>.</p>' +
        '<div class="li-cc-row"><button type="button" class="li-cc-primary" data-cc="all">Accept all</button>' +
        '<button type="button" data-cc="none">Only necessary</button>' +
        '<button type="button" class="li-cc-link" data-cc="settings">Cookie settings</button></div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-cc]') : null;
      if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'settings') return showBanner(true);
      if (act === 'all') setConsent(true, true);
      else if (act === 'none') setConsent(false, false);
      else setConsent(document.getElementById('li-cc-a').checked, document.getElementById('li-cc-m').checked);
      removeBanner();
    });
    banner.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!stored) setConsent(false, false);  // Escape on first visit = only necessary
      removeBanner();
    });
    banner.querySelector('button').focus();
  }
  T.openSettings = function () { onReady(function () { showBanner(true); }); };

  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  onReady(function () { if (T.consentBanner && !stored) showBanner(false); });

  // ── Events ─────────────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var demo = t.closest('[data-open-demo]');
    if (demo) {
      var loc = 'section';
      if (demo.closest('footer')) loc = 'footer';
      else if (demo.closest('nav, header')) loc = 'nav';
      else if (demo.closest('#hero')) loc = 'hero';
      push('demo_click', { page_path: path, location: loc });
      return;
    }
    var link = t.closest('a[href^="mailto:"], a[href^="tel:"]');
    if (link) push('contact_click', { method: link.getAttribute('href').indexOf('tel:') === 0 ? 'phone' : 'email' });
  }, true);

  var scrolled = false;
  window.addEventListener('scroll', function () {
    if (scrolled) return;
    var h = document.documentElement;
    var max = h.scrollHeight - window.innerHeight;
    if (max > 0 && (window.scrollY || h.scrollTop) / max >= 0.75) {
      scrolled = true;
      push('scroll_75', { page_path: path });
    }
  }, { passive: true });

  if (type === 'home' && window.IntersectionObserver) onReady(function () {
    var el = document.getElementById('pricing') || document.getElementById('modules');
    if (!el) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      io.disconnect();
      push('pricing_view', { page_path: path });
    }, { threshold: 0.25 });
    io.observe(el);
  });
})();
