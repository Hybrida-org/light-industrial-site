/* tracking.js — consent, GTM and the dataLayer events for lightindustrial.co.za.

   Loaded as the FIRST script in <head> of every page. Everything that talks to
   a vendor (GA4, Google Ads, Meta, LinkedIn, Clarity, HubSpot tracking) fires
   inside GTM, so IDs are pasted once there. This file only:

     1. sets Consent Mode v2 defaults before GTM loads,
     2. loads GTM when gtmId is set,
     3. remembers consent in localStorage 'li_consent' and shows a banner,
     4. pushes the events listed in docs/tracking-setup.md into dataLayer,
     5. remembers how the visitor first arrived (UTMs, click IDs, landing
        page) in localStorage 'li_attr', hands it to every lead form through
        LI_TRACKING.attribution(), and carries the UTMs into Calendly links,
     6. turns a Calendly booking into the demo_booked event,
     7. submits every lead form to HubSpot through LI_TRACKING.sendLead().

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
  // The HubSpot form every lead form on the site submits to. Paste the form ID
  // from HubSpot (Marketing > Forms > the form > Share > Embed code, formId).
  // While it is empty the forms hand the lead to the visitor's mail app instead.
  hubspotFormGuid: '9bf3fdde-023f-4f9f-91f6-e683978abc73',
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

  // ── Attribution ────────────────────────────────────────────────────────────
  // First touch only: the campaign that brought them here is the one that gets
  // the credit, however many pages they read before filling in a form. HubSpot
  // works the same out from its own cookie, but only once its script has loaded
  // and the visitor has not blocked it; this copy travels with the lead itself.
  var ATTR_KEY = 'li_attr';
  var ATTR_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'msclkid', 'li_fat_id'];
  function readAttr() {
    try { return JSON.parse(window.localStorage.getItem(ATTR_KEY) || 'null') || null; } catch (e) { return null; }
  }
  (function captureAttr() {
    if (readAttr()) return;
    var q; try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
    var a = {}, any = false;
    ATTR_PARAMS.forEach(function (k) { var v = q.get(k); if (v) { a[k] = v.slice(0, 200); any = true; } });
    var ref = document.referrer || '';
    if (!any && (!ref || ref.indexOf(window.location.host) !== -1)) return;  // direct visit: nothing to remember yet
    a.landing_page = window.location.pathname + (q.toString() ? '?' + q.toString() : '');
    a.referrer = ref.slice(0, 500);
    a.first_seen = new Date().toISOString();
    try { window.localStorage.setItem(ATTR_KEY, JSON.stringify(a)); } catch (e) { /* storage blocked */ }
  })();
  function cookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  // Everything a lead form should send alongside the answers. Never personal data.
  T.attribution = function () {
    var a = readAttr() || {};
    a.hutk = cookie('hubspotutk');  // HubSpot's visitor cookie, so the contact joins its own page views
    a.page_url = window.location.href.split('#')[0];
    a.page_title = document.title;
    return a;
  };
  // ── Leads to HubSpot ───────────────────────────────────────────────────────
  // The HubSpot Forms API takes a browser POST with no key (the form ID is not
  // a secret), so there is no server of ours in the way. Site field name on the
  // left, HubSpot contact property on the right. Every property on the right
  // must exist on the HubSpot form, or HubSpot rejects the whole submission, so
  // a rejection is retried with the core fields alone: a missing property must
  // never cost a lead. docs/tracking-setup.md § HubSpot lists the properties.
  var LEAD_FIELDS = {
    email: 'email', company: 'company', phone: 'phone',
    delivery_notes_per_week: 'delivery_notes_per_week', stock_system: 'stock_system',
    source: 'lead_source_detail', variant: 'lead_form_variant', page: 'lead_page',
    minutes_per_document: 'calc_minutes_per_document', monthly_staff_cost: 'calc_monthly_staff_cost',
    error_rate_percent: 'calc_error_rate_percent', short_delivery_percent: 'calc_short_delivery_percent',
    monthly_supplier_spend: 'calc_monthly_supplier_spend', documents_per_month: 'calc_documents_per_month',
    hours_saved: 'calc_hours_saved', monthly_net: 'calc_monthly_net', break_even_month: 'calc_break_even_month'
  };
  var ATTR_FIELDS = {
    utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign',
    utm_content: 'utm_content', utm_term: 'utm_term', gclid: 'gclid',
    landing_page: 'landing_page', referrer: 'first_referrer'
  };
  var CORE_FIELDS = ['email', 'firstname', 'lastname', 'company', 'phone'];
  var CONSENT_TEXT = 'I\u2019m happy for Light Industrial to contact me about this enquiry.';
  function text(v) {
    return (v === undefined || v === null || v === false) ? '' : String(v).trim().slice(0, 1000);
  }
  // Pure: lead object in, HubSpot submission body out. Tested in docs/test-lead.js.
  T.hubspotPayload = function (lead, attr) {
    var fields = [];
    function add(name, v) { v = text(v); if (v) fields.push({ name: name, value: v }); }
    var parts = text(lead.name).split(/\s+/).filter(Boolean);
    if (parts.length) {
      add('firstname', parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]);
      if (parts.length > 1) add('lastname', parts[parts.length - 1]);
    }
    for (var k in LEAD_FIELDS) add(LEAD_FIELDS[k], lead[k]);
    attr = attr || {};
    for (var a in ATTR_FIELDS) add(ATTR_FIELDS[a], attr[a]);
    var body = { fields: fields, context: {} };
    if (attr.hutk) body.context.hutk = attr.hutk;
    if (attr.page_url) body.context.pageUri = attr.page_url;
    if (attr.page_title) body.context.pageName = attr.page_title;
    if (lead.consent === true || lead.consent === 'yes') {
      body.legalConsentOptions = { consent: { consentToProcess: true, text: CONSENT_TEXT } };
    }
    return body;
  };
  T.coreOnly = function (body) {
    var copy = JSON.parse(JSON.stringify(body));
    copy.fields = copy.fields.filter(function (f) { return CORE_FIELDS.indexOf(f.name) !== -1; });
    return copy;
  };
  // Resolves when HubSpot has the lead, rejects when it does not.
  T.sendLead = function (lead) {
    var url = 'https://api-' + T.hubspotRegion + '.hsforms.com/submissions/v3/integration/submit/' +
      T.hubspotPortalId + '/' + T.hubspotFormGuid;
    function post(body) {
      return window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    var body = T.hubspotPayload(lead, T.attribution());
    return post(body).then(function (res) {
      if (res.ok) return res;
      return post(T.coreOnly(body)).then(function (res2) {
        if (!res2.ok) throw new Error('HubSpot returned ' + res2.status);
        return res2;
      });
    });
  };

  // Calendly keeps utm_* from its link on the booking, and its HubSpot
  // integration copies them onto the contact. So every demo link carries them.
  function withUtms(url) {
    var a = readAttr(); if (!a) return url;
    var extra = ATTR_PARAMS.filter(function (k) { return k.indexOf('utm_') === 0 && a[k]; })
      .map(function (k) { return k + '=' + encodeURIComponent(a[k]); }).join('&');
    if (!extra) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + extra;
  }
  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  onReady(function () {
    var links = document.querySelectorAll('a[href*="calendly.com"], [data-cal-url]');
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      if (el.hasAttribute('data-cal-url')) el.setAttribute('data-cal-url', withUtms(el.getAttribute('data-cal-url')));
      else el.setAttribute('href', withUtms(el.getAttribute('href')));
    }
  });

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
  // The hero form and the full form redirect here on success, so this page
  // load is their lead event, counted once. The savings gate unlocks in place
  // and pushes its own lead_form_submit.
  // Calendly can redirect here with ?src=demo after a booking made in its own
  // tab (a paid Calendly setting), which is how bookings from pages without the
  // modal get counted.
  if (type === 'thank_you') {
    var q = null, src = 'hero';
    try { q = new URLSearchParams(location.search); src = q.get('src') || 'hero'; } catch (e) {}
    if (src === 'demo') push('demo_booked', { page_path: path, location: 'calendly_redirect' });
    else push('lead_form_submit', { form_source: src, page_path: path,
      delivery_notes_band: q && q.get('band'), stock_system: q && q.get('sys') });
  }

  // The Calendly modal posts a message when a slot is booked. That, not the
  // click that opened it, is the demo conversion.
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com') return;
    if (e.data && e.data.event === 'calendly.event_scheduled') push('demo_booked', { page_path: path, location: 'modal' });
  });

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
