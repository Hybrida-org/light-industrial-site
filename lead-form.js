/* lead-form.js — the full lead form, written once and dropped into every page
   that needs it. There is no build step here (plain files on GitHub Pages), so
   a page marks the spot with <div data-lead-form> and this script fills it in.

   Load it with a plain <script src="lead-form.js"></script> placed after the
   placeholder. A page in a sub-folder points at "../lead-form.js".

   Two headings, one form. A page can reword the heading and the button without
   touching the fields, by naming a variant:

       <div data-lead-form data-variant="contact"></div>

   Change a field once, here, and it changes on every page. See
   docs/lead-form-spec.md for why each field is here, and HYBRIDA-905.

   ── Before go-live ────────────────────────────────────────────────────────
   LEAD_ENDPOINT is empty until the Cloudflare Worker in worker/ is deployed.
   While it is empty the form hands the answers to the visitor's own email app
   instead of posting them. That is weaker than HubSpot, but it never silently
   swallows a lead.

   PRIVACY_URL is empty until the privacy page exists (HYBRIDA-912). While it
   is empty the consent tick simply has no link under it — better than a link
   that goes nowhere.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var slots = document.querySelectorAll('[data-lead-form]');
  if (!slots.length) return;

  /* Where the site root sits, worked out from this script's own address — it
     lives at the root, so stripping its filename leaves the root. This is what
     lets a page in a sub-folder link back to /thank-you/ correctly. */
  var ROOT = (function () {
    var self = document.currentScript;
    if (!self) return '';
    return self.src.replace(/lead-form\.js(\?.*)?$/, '');
  })();

  /* Where a lead goes, who to fall back to, and where a sender lands afterwards
     all live in savings/sums.js, so pasting the deployed Worker URL in that one
     place turns on every form on the site at once (HYBRIDA-907). A page that
     does not load sums.js falls back to the same values written out here — so
     if you change one, change both. */
  var SETTINGS = (window.SavingsSums && window.SavingsSums.SETTINGS) || {};
  var LEAD_ENDPOINT = SETTINGS.leadEndpoint || '';
  var CONTACT_EMAIL = SETTINGS.contactEmail || 'danika@lightindustrial.co.za';

  /* A real submission lands on its own page. A page load is a far more reliable
     conversion signal for Google Ads than a JavaScript event, which ad blockers
     and flaky networks can swallow. */
  var THANK_YOU_URL = SETTINGS.thankYouUrl || (ROOT + 'thank-you/index.html');

  // Fill this in the day the privacy page ships (HYBRIDA-912).
  var PRIVACY_URL = '';

  /* The same form, framed two ways. Only the words around it change — the
     fields, the checks and where it sends are shared, so there is one form to
     fix when something is wrong with it. */
  var VARIANTS = {
    contact: {
      eyebrow: 'Get in touch',
      title: 'Tell us about your paperwork',
      intro: 'Six questions, about a minute. We’ll get back to you within 24 hours.',
      button: 'Send my details'
    },
    worksheet: {
      eyebrow: 'ROI worksheet',
      title: 'Email me the worksheet',
      intro: 'We’ll send the worksheet through and call you to talk it over.',
      button: 'Email me the worksheet'
    }
  };

  /* The fields, in the order they are asked. Keeping them in one list means the
     markup, the checks and the data sent to HubSpot can never drift apart.

     'key' is the name HubSpot sees. 'empty' is what we say when it is left
     blank, 'check'/'invalid' catch an answer that is filled in but wrong. */
  var FIELDS = [
    {
      key: 'name', label: 'Your name', type: 'text',
      placeholder: 'Your full name', autocomplete: 'name',
      empty: 'We need your name to get back to you.'
    },
    {
      key: 'company', label: 'Company', type: 'text',
      placeholder: 'Where you work', autocomplete: 'organization',
      empty: 'Let us know which company you are with.'
    },
    {
      key: 'email', label: 'Work email', type: 'email',
      placeholder: 'you@yourcompany.co.za', autocomplete: 'email', inputmode: 'email',
      empty: 'We need an email address to reply to.',
      check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
      invalid: 'That email does not look right. Check for a typo.'
    },
    {
      key: 'phone', label: 'Phone', type: 'tel',
      placeholder: '021 555 0123', autocomplete: 'tel', inputmode: 'tel',
      empty: 'We need a number to call you on.',
      // Nine digits is a South African landline or mobile with the leading 0
      // dropped; anything shorter is a typo, not a number we can ring.
      check: function (v) { return v.replace(/[^0-9]/g, '').length >= 9; },
      invalid: 'That number looks too short. Include the area code.'
    },
    {
      /* The qualifying question. A delivery note is the paper that arrives with
         a delivery and has to be checked, matched and typed in — how many land
         each week is how much of someone's day is disappearing. We ask this
         instead of turnover because volume is a polite question and revenue is
         not, and it tells us roughly the same thing.

         It is a pick-one list so it is a single tap on a phone, so nobody
         answers "lots", and so someone who genuinely does not know can say so.
         The bands line up with the price tiers — see docs/lead-form-spec.md. */
      key: 'delivery_notes_per_week', label: 'Supplier delivery notes a week', type: 'select',
      placeholder: 'Pick the closest',
      options: [
        ['under-10', 'Fewer than 10 a week'],
        ['10-30', '10 to 30 a week'],
        ['30-100', '30 to 100 a week'],
        ['over-100', 'More than 100 a week'],
        ['unsure', 'I’m not sure']
      ],
      empty: 'Pick the closest option so we know how to help.'
    },
    {
      /* Tells us what we would be syncing with, and how much of a change this
         is for them. A pick-one list rather than a text box so the answers can
         be counted in HubSpot instead of arriving as 40 spellings of "Excel". */
      key: 'stock_system', label: 'What runs your stock today', type: 'select',
      placeholder: 'Pick the closest',
      options: [
        ['spreadsheet', 'A spreadsheet'],
        ['sage', 'Sage'],
        ['pastel', 'Pastel'],
        ['other-erp', 'Another ERP'],
        ['nothing', 'Nothing yet'],
        ['other', 'Something else']
      ],
      empty: 'Pick the closest option so we know what we’d be working with.'
    },
    {
      // Required by law before we may contact them, and worded so it cannot be
      // mistaken for a newsletter sign-up.
      key: 'consent', label: 'I’m happy for Light Industrial to contact me about this enquiry.',
      type: 'checkbox',
      note: 'We’ll only use your details to reply to you.',
      empty: 'Please tick the box so we’re allowed to contact you.'
    }
  ];

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function attr(name, value) {
    return value ? ' ' + name + '="' + escapeHtml(value) + '"' : '';
  }

  /* Every id is prefixed with the form's own number, so two copies of this form
     on one page still have unique ids and labels that point at the right box. */
  function fieldMarkup(field, prefix) {
    var id = prefix + '-' + field.key;
    var errorId = id + '-err';
    var described = ' aria-describedby="' + errorId + '"';
    var error = '<p class="lf-error" id="' + errorId + '" hidden></p>';

    if (field.type === 'checkbox') {
      var link = PRIVACY_URL
        ? ' <a href="' + PRIVACY_URL + '">How we handle your data</a>'
        : '';  // no privacy page yet (HYBRIDA-912) — a dead link is worse than none
      return '' +
        '<div class="lf-field lf-field--check">' +
        '  <label class="lf-check" for="' + id + '">' +
        '    <input type="checkbox" id="' + id + '" name="' + field.key + '"' + described + '>' +
        '    <span>' + escapeHtml(field.label) + '</span>' +
        '  </label>' +
        '  <p class="lf-note">' + escapeHtml(field.note) + link + '</p>' +
        error +
        '</div>';
    }

    var control;
    if (field.type === 'select') {
      var options = field.options.map(function (option) {
        return '<option value="' + escapeHtml(option[0]) + '">' + escapeHtml(option[1]) + '</option>';
      }).join('');
      control = '<select id="' + id + '" name="' + field.key + '"' + described + '>' +
        '<option value="">' + escapeHtml(field.placeholder) + '</option>' + options + '</select>';
    } else {
      control = '<input type="' + field.type + '" id="' + id + '" name="' + field.key + '"' +
        attr('placeholder', field.placeholder) +
        attr('autocomplete', field.autocomplete) +
        attr('inputmode', field.inputmode) + described + '>';
    }

    return '' +
      '<div class="lf-field">' +
      '  <label for="' + id + '">' + escapeHtml(field.label) + ' <span class="lf-req" aria-hidden="true">*</span></label>' +
      '  ' + control +
      error +
      '</div>';
  }

  function formMarkup(variant, prefix) {
    var fields = FIELDS.map(function (field) { return fieldMarkup(field, prefix); }).join('\n');

    return '' +
      '<div class="lf-head">' +
      '  <p class="lf-eyebrow">' + escapeHtml(variant.eyebrow) + '</p>' +
      '  <h2 class="lf-title font-head" id="' + prefix + '-title">' + escapeHtml(variant.title) + '</h2>' +
      '  <p class="lf-intro">' + escapeHtml(variant.intro) + '</p>' +
      '</div>' +
      '<form class="lf-form" id="' + prefix + '-form" novalidate aria-labelledby="' + prefix + '-title">' +
      fields +
      // Spam trap: hidden from people, filled in by bots. Never remove the
      // label — a screen reader needs it, and a bot reads it as a real field.
      '  <div class="lf-trap" aria-hidden="true">' +
      '    <label for="' + prefix + '-website">Website</label>' +
      '    <input type="text" id="' + prefix + '-website" name="website" tabindex="-1" autocomplete="off">' +
      '  </div>' +
      '  <p class="lf-form-error" id="' + prefix + '-form-err" role="alert" hidden></p>' +
      '  <button type="submit" class="lf-submit" id="' + prefix + '-submit">' + escapeHtml(variant.button) + '</button>' +
      '</form>' +
      '<div class="lf-done" id="' + prefix + '-done" hidden>' +
      '  <div class="lf-tick" aria-hidden="true">✓</div>' +
      '  <h2 class="lf-done-title font-head" tabindex="-1">We have your details.</h2>' +
      '  <p class="lf-done-text">We’ll be in touch within 24 hours.</p>' +
      '</div>';
  }

  function wire(slot, variant, variantName, prefix) {
    var form = document.getElementById(prefix + '-form');
    var done = document.getElementById(prefix + '-done');
    var head = slot.querySelector('.lf-head');
    var formError = document.getElementById(prefix + '-form-err');
    var submitBtn = document.getElementById(prefix + '-submit');

    function controlOf(field) { return form.elements[field.key]; }
    function errorOf(field) { return document.getElementById(prefix + '-' + field.key + '-err'); }

    function valueOf(field) {
      var el = controlOf(field);
      return el.type === 'checkbox' ? (el.checked ? 'yes' : '') : (el.value || '').trim();
    }

    // Returns the message to show, or '' when the field is fine.
    function problemWith(field) {
      var value = valueOf(field);
      if (!value) return field.empty;
      if (field.check && !field.check(value)) return field.invalid;
      return '';
    }

    /* Red text is never the only signal: the message is written out, and the
       box is marked aria-invalid so a screen reader announces it too. */
    function showProblem(field, message) {
      var el = controlOf(field);
      var errorEl = errorOf(field);
      errorEl.textContent = message;
      errorEl.hidden = !message;
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }

    /* Check a field when the person leaves it, but only clear-as-you-type once
       they have already been told about it — correcting mid-word is annoying. */
    FIELDS.forEach(function (field) {
      var el = controlOf(field);
      var leaveEvent = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'blur';
      el.addEventListener(leaveEvent, function () { showProblem(field, problemWith(field)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid')) showProblem(field, problemWith(field));
      });
    });

    // Marks every bad field and hands back the first one, to focus.
    function firstProblem() {
      var first = null;
      FIELDS.forEach(function (field) {
        var message = problemWith(field);
        showProblem(field, message);
        if (message && !first) first = field;
      });
      return first;
    }

    function answers() {
      var lead = { source: slot.getAttribute('data-source') || 'website', variant: variantName, page: window.location.pathname };
      FIELDS.forEach(function (field) {
        var el = controlOf(field);
        lead[field.key] = el.type === 'checkbox' ? el.checked : (el.value || '').trim();
      });
      return lead;
    }

    function showDone(message) {
      if (message) done.querySelector('.lf-done-text').textContent = message;
      form.hidden = true;
      if (head) head.hidden = true;
      done.hidden = false;
      done.querySelector('.lf-done-title').focus();
    }

    /* Fallback while LEAD_ENDPOINT is empty: hand the details to the visitor's
       own email app. Weaker than posting to HubSpot, but it does not lose the
       lead — and the old form's silent failure did. */
    function sendByEmail(lead) {
      var lines = FIELDS.filter(function (field) { return field.type !== 'checkbox'; })
        .map(function (field) { return field.label + ': ' + lead[field.key]; });

      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('Light Industrial enquiry from ' + lead.company) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      /* Deliberately not the thank-you page: nothing has actually reached us
         until they press send, and only this message tells them to. */
      showDone('Your email app should have opened with your details ready. Hit send and we’ll get back to you.');
    }

    function sendToWorker(lead) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).then(function (response) {
        if (!response.ok) throw new Error('Worker returned ' + response.status);
        window.location.href = THANK_YOU_URL;
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = variant.button;
        // Never lose the lead: if our end breaks, give them an address that works.
        formError.innerHTML = 'Something went wrong on our side. Email ' +
          '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a> and we’ll pick it up.';
        formError.hidden = false;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formError.hidden = true;

      var bad = firstProblem();
      if (bad) { controlOf(bad).focus(); return; }

      /* A person never sees the trap field, so anything in it came from a bot.
         Show the normal thank-you and drop it, rather than telling the bot it
         failed and inviting it to try again. */
      if (form.elements.website.value) { showDone(); return; }

      var lead = answers();
      if (LEAD_ENDPOINT) sendToWorker(lead); else sendByEmail(lead);
    });
  }

  Array.prototype.forEach.call(slots, function (slot, index) {
    var name = slot.getAttribute('data-variant');
    if (!VARIANTS[name]) name = 'contact';
    var variant = VARIANTS[name];

    // Unique per form, so two copies on one page keep their own ids and labels.
    var prefix = 'lf' + (index + 1);
    slot.className += (slot.className ? ' ' : '') + 'lf-block';
    slot.innerHTML = formMarkup(variant, prefix);
    wire(slot, variant, name, prefix);
  });
})();
