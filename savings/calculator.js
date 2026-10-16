// Savings results page — drawing only.
//
// Every number and every formula lives in sums.js, which this file must load
// after. Nothing here does arithmetic; it reads the sliders, asks for the sums,
// and paints them.

(function () {
  'use strict';

  var SETTINGS = window.SavingsSums.SETTINGS;
  var COLOURS = window.SavingsSums.COLOURS;
  var rands = window.SavingsSums.rands;
  var hoursWord = window.SavingsSums.hoursWord;
  var errorCurve = window.SavingsSums.errorCurve;
  var QUERY_KEYS = window.SavingsSums.QUERY_KEYS;
  var paybackWord = window.SavingsSums.paybackWord;
  var breakEvenDocsPerWeek = window.SavingsSums.breakEvenDocsPerWeek;

  var el = function (id) { return document.getElementById(id); };

  var result = el('roiResult');
  if (!result) return;

  var inputs = {
    docsPerWeek: el('roiDocs'),
    minsPerDoc: el('roiMins'),
    salary: el('roiSalary'),
    errorRate: el('roiErrors'),
    shortRate: el('roiShort'),
    spend: el('roiSpend')
  };

  // The one place the page turns controls into the plain object sums.js wants.
  function readInputs() {
    return {
      docsPerWeek: +inputs.docsPerWeek.value,
      minsPerDoc: +inputs.minsPerDoc.value,
      salary: +inputs.salary.value,
      errorRate: +inputs.errorRate.value,
      shortRate: +inputs.shortRate.value,
      spend: +inputs.spend.value
    };
  }

  function sums() {
    return window.SavingsSums.calculate(readInputs());
  }

  // ── Tile 1: two bars, one measure, before and after ─────────────────────────

  function renderBars(s) {
    var longest = Math.max(s.currentHours, 1);
    el('roiBarToday').style.width = '100%';
    el('roiBarAfter').style.width = Math.max((s.newHours / longest) * 100, 2) + '%';
    el('roiBarTodayVal').textContent = hoursWord(Math.round(s.currentHours));
    el('roiBarAfterVal').textContent = hoursWord(Math.round(s.newHours));
  }

  // ── Tile 2: one line, six months ────────────────────────────────────────────

  function renderErrorChart(startRate) {
    var chart = el('roiLineChart');
    var rates = errorCurve(startRate);
    var top = Math.max(Math.ceil(startRate / 5) * 5, 5);

    var left = 34, right = 306, topY = 14, baseY = 98;
    var x = function (month) { return left + ((month - 1) / (SETTINGS.decayMonths - 1)) * (right - left); };
    var y = function (rate) { return baseY - (rate / top) * (baseY - topY); };

    var parts = [];

    // Hairline grid, solid, one shade off the surface.
    [0, top / 2, top].forEach(function (rate) {
      parts.push('<line x1="' + left + '" y1="' + y(rate).toFixed(1) + '" x2="' + right +
        '" y2="' + y(rate).toFixed(1) + '" stroke="' + COLOURS.grid + '" stroke-width="1"/>');
      parts.push('<text x="' + (left - 8) + '" y="' + (y(rate) + 3.5).toFixed(1) +
        '" text-anchor="end" class="roi-axis">' + Math.round(rate) + '%</text>');
    });

    var points = rates.map(function (rate, i) { return x(i + 1).toFixed(1) + ',' + y(rate).toFixed(1); });
    parts.push('<polyline points="' + points.join(' ') + '" fill="none" stroke="' + COLOURS.after +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');

    rates.forEach(function (rate, i) {
      var month = i + 1;
      var isEnd = (month === 1 || month === SETTINGS.decayMonths);
      parts.push('<circle cx="' + x(month).toFixed(1) + '" cy="' + y(rate).toFixed(1) + '" r="' +
        (isEnd ? 4 : 3) + '" fill="' + COLOURS.after + '" stroke="#f4f1ec" stroke-width="2"/>');
      // A hit target you can actually land on, and the value without a tooltip library.
      parts.push('<circle cx="' + x(month).toFixed(1) + '" cy="' + y(rate).toFixed(1) +
        '" r="12" fill="transparent"><title>Month ' + month + ': ' + rate.toFixed(1) +
        '% need a fix</title></circle>');
      parts.push('<text x="' + x(month).toFixed(1) + '" y="' + (baseY + 18) +
        '" text-anchor="middle" class="roi-axis">' + month + '</text>');
    });

    // Direct-label the two that carry the story, not every point.
    parts.push('<text x="' + x(1).toFixed(1) + '" y="' + (y(rates[0]) - 11).toFixed(1) +
      '" text-anchor="start" class="roi-point-label">' + Math.round(rates[0]) + '%</text>');
    parts.push('<text x="' + x(SETTINGS.decayMonths).toFixed(1) + '" y="' +
      (y(rates[rates.length - 1]) - 11).toFixed(1) + '" text-anchor="end" class="roi-point-label">' +
      rates[rates.length - 1].toFixed(0) + '%</text>');

    parts.push('<text x="' + ((left + right) / 2) + '" y="128" text-anchor="middle" class="roi-axis">Month</text>');

    chart.innerHTML = parts.join('');

    var body = el('roiLineTable').querySelector('tbody');
    body.innerHTML = rates.map(function (rate, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + rate.toFixed(1) + '%</td></tr>';
    }).join('');

    var settled = rates[rates.length - 1];
    var clean = Math.round(100 - settled);
    el('roiErrorNote').textContent = startRate <= SETTINGS.settledErrorRate
      ? 'You are already about as clean as this gets. Matching memory keeps it there without anyone minding it.'
      : 'Every correction teaches it. By month ' + SETTINGS.decayMonths + ', about ' + clean +
        ' lines in every 100 go through untouched.';
  }

  // ── The headline ────────────────────────────────────────────────────────────

  function renderHeadline(s) {
    var verdict = el('roiVerdict');
    var headline = el('roiHeadline');
    var sub = el('roiSub');
    var flag = el('roiFlag');
    var hours = Math.round(s.hoursSaved);

    flag.hidden = true;
    verdict.hidden = false;

    // The sliders can claim more than one person's whole month on paperwork. Show
    // the number, but say so — it is past what a calculator can honestly answer.
    if (s.currentHours > SETTINGS.workingHoursPerMonth) {
      flag.hidden = false;
      flag.textContent = "That's more than one person's whole month spent on paperwork. " +
        'The sum still works, but a number that big is worth a conversation rather than a slider.';
    }

    var takeaways = [
      '<b>Hours recovered:</b> ' + hoursWord(hours) + ' a month freed up for your team.',
      '<b>Preventable leakage:</b> ' + rands(s.moneySaved) + ' a month saved from overcharges and short deliveries.'
    ];

    if (s.net > 0) {
      result.setAttribute('data-state', 'pays');
      verdict.textContent = 'Net monthly gain';
      headline.innerHTML = '<span class="roi-amount">' + rands(s.net) + '</span> a month.';
      sub.innerHTML = 'Pays for itself in <b>' + paybackWord(s.paybackDays) + '</b>. ' +
        '<b>' + rands(s.labourSaved) + '</b> of time plus <b>' + rands(s.moneySaved) +
        '</b> of leakage stopped, less Document Intake at <b>' + rands(s.price) + '</b> a month.';
      takeaways.push('<b>Payback:</b> fully covers the ' + rands(s.price) + ' software cost and returns ' +
        s.roiPercent + '% on it every month.');
    } else {
      // Never a negative on the page. The win is the hours, and we say what it
      // would take for the rands to follow.
      result.setAttribute('data-state', 'time');
      verdict.textContent = 'What you win back';
      headline.innerHTML = '<span class="roi-amount">' + (hours ? hoursWord(hours) : 'Under an hour') + '</span> a month.';
      sub.innerHTML = '<b>' + rands(s.totalSaved) + '</b> a month saved against Document Intake at <b>' +
        rands(s.price) + '</b> a month. At this volume the win is the time, not the rands.';
      var enough = breakEvenDocsPerWeek(readInputs());
      takeaways.push('<b>Payback:</b> ' + (enough
        ? 'from about ' + enough + ' delivery notes a week it pays for itself on these numbers.'
        : 'not at this volume. Worth a conversation rather than a slider.'));
    }

    el('roiTakeaways').innerHTML = takeaways.map(function (t) { return '<li>' + t + '</li>'; }).join('');
  }

  // ── The sum, written out ────────────────────────────────────────────────────

  function renderWorking(s) {
    var lines = [
      s.docs + ' documents a month. ' + inputs.docsPerWeek.value + ' a week &times; ' +
        SETTINGS.weeksPerYear + ' weeks &divide; ' + SETTINGS.monthsPerYear + ' months.',
      hoursWord(Math.round(s.currentHours)) + ' a month on paperwork today. ' + s.docs + ' documents &times; ' +
        inputs.minsPerDoc.value + ' minutes.',
      hoursWord(Math.round(s.newHours)) + ' with intake. Someone still glances at each document and approves it, about ' +
        Math.round(SETTINGS.reviewShare * 100) + '% of the time it takes today.',
      rands(s.hourlyCost) + ' an hour. ' + rands(+inputs.salary.value) + ' a month &divide; ' +
        SETTINGS.workingHoursPerMonth + ' working hours.',
      rands(s.labourSaved) + ' of labour freed a month. ' + hoursWord(Math.round(s.hoursSaved)) +
        ' &times; ' + rands(s.hourlyCost) + '.',
      rands(s.moneyShort) + ' stopped on short deliveries and billing errors. ' + inputs.shortRate.value + '% of ' +
        rands(+inputs.spend.value) + ' supplier spend a month.',
      rands(s.moneyOverpay) + ' stopped on moved prices and re-captured lines. ' + inputs.errorRate.value + '% of ' +
        rands(+inputs.spend.value) + '.',
      '<b>' + rands(s.totalSaved) + ' saved a month.</b>',
      s.docs <= SETTINGS.tiers[0].upToDocs
        ? 'Less ' + rands(s.price) + ' a month for document intake, ' + SETTINGS.tiers[0].upToDocs + ' documents included.'
        : 'Less an estimated ' + rands(s.price) + ' a month at ' + s.docs + ' documents. Over ' +
          SETTINGS.tiers[0].upToDocs + ' documents, talk to us for a price.',
      s.net > 0
        ? '<b>' + rands(s.net) + ' net a month, to the nearest R100. Pays for itself in ' + paybackWord(s.paybackDays) + '.</b>'
        : ''
    ];
    el('roiWorking').innerHTML = lines.filter(Boolean).map(function (line) { return '<li>' + line + '</li>'; }).join('');
  }

  // Only the first band is published. The upper bands stay in sums.js because
  // the sum needs a price above 50 documents, but the page says "talk to us".
  function tierSentence() {
    return 'Document intake is ' + rands(SETTINGS.tiers[0].price) + ' a month, ' +
      SETTINGS.tiers[0].upToDocs + ' documents included. More volume, talk to us. ' +
      'No set-up fee. All prices ex VAT.';
  }

  // ── Draw everything ─────────────────────────────────────────────────────────

  function render() {
    el('roiDocsOut').textContent = inputs.docsPerWeek.value;
    el('roiMinsOut').textContent = inputs.minsPerDoc.value + ' min';
    el('roiSalaryOut').textContent = rands(+inputs.salary.value);
    el('roiErrorsOut').textContent = inputs.errorRate.value + '%';
    el('roiShortOut').textContent = inputs.shortRate.value + '%';
    el('roiSpendOut').textContent = rands(+inputs.spend.value);

    var s = sums();

    renderHeadline(s);
    renderBars(s);
    renderErrorChart(+inputs.errorRate.value);

    el('roiShortFigure').textContent = s.shortCaught;
    el('roiShortNote').textContent = s.shortCaught === 0
      ? 'Nothing arrives short, on your numbers. If that changes, it gets caught.'
      : (s.shortCaught === 1 ? 'A short or mismatched delivery a month, caught'
                              : 'Short or mismatched deliveries a month, caught') +
        ' at the dock, before you approve the supplier invoice.';
    el('roiTimeNote').textContent = 'Win back ' + hoursWord(Math.round(s.hoursSaved)) + ' every single month.';

    renderWorking(s);
    el('roiTerms').textContent = tierSentence();
    el('roiCtaPrice').textContent = rands(SETTINGS.tiers[0].price) + ' a month, ' +
      SETTINGS.tiers[0].upToDocs + ' documents included. No set-up fee.';
  }

  // ── The tracked event ───────────────────────────────────────────────────────
  // One of only two key events, so it has to mean something: it fires once, and
  // only after the visitor has actually moved something. A default nobody touched
  // is not a signal. Harmless while no tag manager is listening.

  var reported = false;
  function reportCompleted() {
    if (reported) return;
    reported = true;
    var s = sums();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'calculator_completed',
      documents_per_month: s.docs,
      minutes_per_document: +inputs.minsPerDoc.value,
      monthly_staff_cost: +inputs.salary.value,
      hours_saved: Math.round(s.hoursSaved),
      monthly_net: s.net,
      break_even_month: s.breakEvenMonth,
      outcome: s.net > 0 ? 'pays_back' : 'time_only'
    });
  }

  // ── Wiring ──────────────────────────────────────────────────────────────────

  // The home-page teaser hands its slider values over in the address bar, so the
  // results a visitor arrives on are the ones they just set. A missing or silly
  // value falls back to the default rather than breaking the page, which also
  // means a hand-edited or truncated link still shows something sensible.
  var handedOver = new URLSearchParams(window.location.search);

  function startingValue(name, config) {
    var given = parseFloat(handedOver.get(QUERY_KEYS[name]));
    if (isNaN(given)) return config.start;
    return Math.min(Math.max(given, config.min), config.max);
  }

  Object.keys(inputs).forEach(function (name) {
    var slider = inputs[name];
    var config = SETTINGS.sliders[name];
    slider.min = config.min;
    slider.max = config.max;
    slider.step = config.step;
    slider.value = startingValue(name, config);
    slider.addEventListener('input', render);
    slider.addEventListener('change', reportCompleted);
  });

  render();

  // ── Step 2's toll, and the copy to take away ────────────────────────────────
  //
  // Most people arrive from the home page, which already took their email and
  // remembered it for the tab. This handles the other way in — a shared link, a
  // bookmark, a direct visit — and unlocks the results once we have one.

  (function () {
    var REMEMBERED = 'savingsEmail';

    var output = el('roiOutput');
    var form = el('roiCapture');
    var field = el('roiEmail');
    var button = el('roiCaptureBtn');
    var note = el('roiCaptureNote');

    function unlock() {
      output.classList.remove('is-locked');
    }

    function netBand(net) {
      if (net < 0) return 'negative';
      if (net < 5000) return '0-5k';
      if (net < 20000) return '5-20k';
      return '20k+';
    }

    // Tell GTM the gate opened and a lead went through. Never the email.
    function track(s) {
      window.dataLayer = window.dataLayer || [];
      var page = window.location.pathname;
      window.dataLayer.push({ event: 'calculator_results_unlocked', page_path: page, docs_per_week: +inputs.docsPerWeek.value, net_monthly_band: netBand(s.net) });
      window.dataLayer.push({ event: 'lead_form_submit', form_source: 'savings-results-page', page_path: page });
    }

    // Private browsing throws on sessionStorage rather than returning null, so
    // both of these swallow it: a visitor who blocks storage sees the gate again,
    // which is annoying but correct. Nothing else breaks.
    function rememberedEmail() {
      try { return window.sessionStorage.getItem(REMEMBERED); } catch (error) { return null; }
    }

    function remember(email) {
      try { window.sessionStorage.setItem(REMEMBERED, email); } catch (error) { /* private mode */ }
    }

    function looksLikeEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function summaryLines(s) {
      return [
        'Please send me the ROI breakdown for these numbers:',
        '',
        'Delivery notes a week: ' + inputs.docsPerWeek.value,
        'Minutes per document today: ' + inputs.minsPerDoc.value,
        'Monthly cost of the person handling them: ' + rands(+inputs.salary.value),
        'Supplier price changes / line updates: ' + inputs.errorRate.value + '%',
        'Delivery shortfalls & billing errors: ' + inputs.shortRate.value + '%',
        'Monthly supplier spend: ' + rands(+inputs.spend.value),
        '',
        'Documents a month: ' + s.docs,
        'Hours saved a month: ' + Math.round(s.hoursSaved),
        'Net a month: ' + rands(s.net),
        'Pays for itself: ' + (s.paybackDays ? 'in ' + paybackWord(s.paybackDays) : 'not at this volume')
      ];
    }

    // No Worker deployed yet, so the lead goes through the visitor's own email app
    // rather than being silently dropped. Weaker than posting to HubSpot, but it
    // never loses a lead.
    function sendByEmail(email, s) {
      window.location.href = 'mailto:' + SETTINGS.contactEmail +
        '?subject=' + encodeURIComponent('ROI breakdown request') +
        '&body=' + encodeURIComponent(summaryLines(s).concat(['', 'Email: ' + email]).join('\n'));
    }

    function sendToWorker(email, s) {
      return fetch(SETTINGS.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'savings-results-page',
          variant: 'calculator_lead',
          attribution: (window.LI_TRACKING && LI_TRACKING.attribution) ? LI_TRACKING.attribution() : undefined,
          delivery_notes_per_week: +inputs.docsPerWeek.value,
          minutes_per_document: +inputs.minsPerDoc.value,
          monthly_staff_cost: +inputs.salary.value,
          error_rate_percent: +inputs.errorRate.value,
          short_delivery_percent: +inputs.shortRate.value,
          monthly_supplier_spend: +inputs.spend.value,
          documents_per_month: s.docs,
          hours_saved: Math.round(s.hoursSaved),
          monthly_net: s.net,
          break_even_month: s.breakEvenMonth
        })
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = field.value.trim();

      if (!looksLikeEmail(email)) {
        note.textContent = 'That email address does not look right. Check it and try again.';
        field.focus();
        return;
      }

      // Show the bot what a person sees and drop it, rather than telling it it failed.
      if (el('roiWebsite').value) { unlock(); return; }

      button.disabled = true;
      button.textContent = 'One moment…';
      remember(email);

      var s = sums();
      track(s);
      // They gave us the email, so they get the results either way. A Worker that
      // is down is our problem, not theirs.
      if (SETTINGS.leadEndpoint) {
        sendToWorker(email, s).catch(function () { /* nothing to tell them */ }).then(unlock);
      } else {
        unlock();
        sendByEmail(email, s);
      }
    });

    if (rememberedEmail()) unlock();
  })();

  // ── The copy to take away ───────────────────────────────────────────────────
  // The designed one-page PDF does not exist yet (HYBRIDA-992). Until it does,
  // this hands the page to the browser's own "Save as PDF" and the print rules in
  // savings.css keep the nav, the sliders and the footer out of it.

  (function () {
    var button = el('roiPdfBtn');
    if (!button) return;
    button.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'savings_pdf_downloaded' });
      // A closed <details> does not print, and the working is the part a sceptic
      // takes away. Open it first; leaving it open afterwards is the honest state.
      var working = document.querySelector('.roi-working');
      if (working) working.open = true;
      window.print();
    });
  })();
})();
