// Document intake ROI calculator — the sums behind /intake/.
//
// Everything anybody may want to argue about lives in SETTINGS below. Nothing
// numeric is written into the markup, so there is exactly one place to change a
// price, a range or a default.

(function () {
  'use strict';

  var SETTINGS = {
    // What a visitor sees before touching anything. "start" should describe a
    // real in-market buyer, not the smallest one.
    sliders: {
      docsPerWeek: { min: 5,    max: 150,   step: 5,   start: 30 },
      minsPerDoc:  { min: 3,    max: 30,    step: 1,   start: 12 },
      salary:      { min: 6000, max: 25000, step: 500, start: 11000 },
      errorRate:   { min: 0,    max: 40,    step: 1,   start: 15 },
      shortRate:   { min: 0,    max: 40,    step: 1,   start: 20 }
    },

    weeksPerMonth: 4.33,
    reviewMinutesPerDoc: 2,      // we do not remove all of it — somebody still approves
    workingHoursPerMonth: 173,   // one person's month

    // Published document-intake prices, ex VAT, by documents a month.
    tiers: [
      { upToDocs: 50,       price: 3500 },
      { upToDocs: 150,      price: 6500 },
      { upToDocs: Infinity, price: 12000 }
    ],

    // Once-off setup. Base is a straight onboarding onto our own system; the two
    // toggles add to it. Integration starts ticked because most buyers are keeping
    // an accounting or ERP system they already pay for.
    setup: {
      base: 15000,
      integration: 15000,
      migration: 5000,
      integrationStartsOn: true,
      migrationStartsOn: false
    },

    settledErrorRate: 2,    // where matching memory lands it
    decayMonths: 6,         // how long that takes
    longPaybackMonths: 24,  // past this we say so rather than let the number stand

    // Paste the deployed Worker URL here to send real leads. While it is empty the
    // form falls back to the visitor's own email app, exactly like the homepage
    // form does. It never silently swallows a lead.
    leadEndpoint: '',
    contactEmail: 'danika@lightindustrial.co.za',
    thankYouUrl: '/thank-you/'
  };

  // Grey is today, green is with us. Those are the only two colours on the page,
  // and they mean the same thing in every tile. Kept here because the line chart
  // is drawn in JavaScript and needs them too.
  var COLOURS = { today: '#9a9188', after: '#3f5d4b', grid: 'rgba(45,42,38,0.12)', ink: '#5f5850' };

  var el = function (id) { return document.getElementById(id); };

  var result = el('roiResult');
  if (!result) return;

  var inputs = {
    docsPerWeek: el('roiDocs'),
    minsPerDoc: el('roiMins'),
    salary: el('roiSalary'),
    errorRate: el('roiErrors'),
    shortRate: el('roiShort')
  };
  var integration = el('roiIntegration');
  var migration = el('roiMigration');

  // ── Formatting ──────────────────────────────────────────────────────────────

  // "-R5,100", never "R-5,100" — the minus belongs to the amount, not the currency.
  function rands(amount) {
    var rounded = Math.round(amount);
    return (rounded < 0 ? '-R' : 'R') + Math.abs(rounded).toLocaleString('en-ZA').replace(/[\s\u00a0\u202f]/g, ',');
  }

  function hoursWord(hours) {
    return hours === 1 ? '1 hour' : hours + ' hours';
  }

  // ── The sums ────────────────────────────────────────────────────────────────

  function priceFor(documentsPerMonth) {
    for (var i = 0; i < SETTINGS.tiers.length; i++) {
      if (documentsPerMonth <= SETTINGS.tiers[i].upToDocs) return SETTINGS.tiers[i].price;
    }
    return SETTINGS.tiers[SETTINGS.tiers.length - 1].price;
  }

  function setupFee() {
    return SETTINGS.setup.base +
      (integration.checked ? SETTINGS.setup.integration : 0) +
      (migration.checked ? SETTINGS.setup.migration : 0);
  }

  function sums() {
    var docs = Math.round((+inputs.docsPerWeek.value) * SETTINGS.weeksPerMonth);
    var currentHours = docs * (+inputs.minsPerDoc.value) / 60;
    var newHours = docs * SETTINGS.reviewMinutesPerDoc / 60;
    var hoursSaved = Math.max(currentHours - newHours, 0);
    var hourlyCost = (+inputs.salary.value) / SETTINGS.workingHoursPerMonth;
    var labourSaved = hoursSaved * hourlyCost;
    var price = priceFor(docs);
    var setup = setupFee();
    // Rounded to the nearest R100 — false precision reads as a made-up number.
    var net = Math.round((labourSaved - price) / 100) * 100;

    return {
      docs: docs,
      currentHours: currentHours,
      newHours: newHours,
      hoursSaved: hoursSaved,
      hourlyCost: hourlyCost,
      labourSaved: labourSaved,
      price: price,
      setup: setup,
      net: net,
      breakEvenMonth: net > 0 ? Math.ceil(setup / net) : null,
      shortCaught: Math.round(docs * (+inputs.shortRate.value) / 100)
    };
  }

  // Month one is where they are today; month six is where matching memory lands
  // them. The curve between is a smooth decay, not a straight line, because most
  // of the learning happens in the first few weeks.
  function errorCurve(startRate) {
    var settled = Math.min(SETTINGS.settledErrorRate, startRate);
    var months = [];
    for (var m = 1; m <= SETTINGS.decayMonths; m++) {
      var progress = (m - 1) / (SETTINGS.decayMonths - 1);
      months.push(settled + (startRate - settled) * Math.pow(1 - progress, 1.5));
    }
    return months;
  }

  // ── Tile 1: two bars, one measure, before and after ─────────────────────────

  function renderBars(s) {
    var longest = Math.max(s.currentHours, 1);
    el('roiBarToday').style.width = '100%';
    el('roiBarAfter').style.width = Math.max((s.newHours / longest) * 100, 2) + '%';
    el('roiBarTodayVal').textContent = hoursWord(Math.round(s.currentHours));
    el('roiBarAfterVal').textContent = hoursWord(Math.round(s.newHours));
    el('roiTimeNote').textContent = 'Win back ' + hoursWord(Math.round(s.hoursSaved)) +
      ' every single month.';
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

    if (s.net > 0) {
      result.setAttribute('data-state', 'pays');
      verdict.textContent = 'It pays for itself';
      // "Setup paid back", not "break even": net already has the subscription
      // taken off, so the thing these months are clearing is the once-off fee.
      headline.innerHTML = 'Setup paid back by <span class="roi-amount">month ' + s.breakEvenMonth + '</span>.';
      sub.innerHTML = 'From month ' + (s.breakEvenMonth + 1) + ' you keep <b>' + rands(s.net) +
        '</b> a month, and get <b>' + hoursWord(hours) + '</b> back.';

      if (flag.hidden && s.breakEvenMonth > SETTINGS.longPaybackMonths) {
        flag.hidden = false;
        flag.textContent = "That's a long wait to pay the setup back. Worth a conversation before you " +
          'commit to anything — there may be a smaller way in.';
      }
      return;
    }

    // The fallback: the rands do not carry it yet, so lead with the hours, which
    // are the thing the owner actually feels.
    result.setAttribute('data-state', 'time');

    // Below an hour a month there is no story to tell, in rands or in time. Say so
    // plainly — it costs us a lead and buys the one thing worth more.
    if (hours < 1) {
      verdict.textContent = 'Too small to bother';
      headline.innerHTML = 'Honestly? <span class="roi-amount">Not yet.</span>';
      sub.innerHTML = 'At this volume the paperwork is not costing you enough to be worth ' +
        'automating. A cheap capture tool and a spreadsheet will do the job for less than we ' +
        'charge. Come back when the deliveries start piling up.';
      return;
    }

    verdict.hidden = true;
    headline.innerHTML = 'Win back <span class="roi-amount">' + hoursWord(hours) + '</span> every month.';
    sub.innerHTML = 'The time you&rsquo;d save is worth about <b>' + rands(s.labourSaved) +
      '</b> a month. That does not cover the <b>' + rands(s.price) +
      '</b> subscription. You&rsquo;d get the hours back, but not the money.';
  }

  // ── The sum, written out ────────────────────────────────────────────────────

  function renderWorking(s) {
    var lines = [
      s.docs + ' documents a month &mdash; ' + inputs.docsPerWeek.value + ' a week &times; ' +
        SETTINGS.weeksPerMonth + ' weeks.',
      hoursWord(Math.round(s.currentHours)) + ' a month today &mdash; ' + s.docs +
        ' documents &times; ' + inputs.minsPerDoc.value + ' minutes.',
      hoursWord(Math.round(s.newHours)) + ' with intake &mdash; we still allow ' +
        SETTINGS.reviewMinutesPerDoc + ' minutes a document for somebody to check and approve it.',
      rands(s.hourlyCost) + ' an hour &mdash; ' + rands(+inputs.salary.value) + ' a month &divide; ' +
        SETTINGS.workingHoursPerMonth + ' working hours.',
      rands(s.labourSaved) + ' of labour freed a month &mdash; ' + hoursWord(Math.round(s.hoursSaved)) +
        ' &times; ' + rands(s.hourlyCost) + '.',
      'Less ' + rands(s.price) + ' a month for document intake at ' + s.docs + ' documents.',
      '<b>' + (s.net > 0 ? rands(s.net) + ' net a month' : rands(s.net) + ' a month &mdash; it does not pay yet') + '.</b>'
    ];
    if (s.net > 0) {
      lines.push('Setup of ' + rands(s.setup) + ' &divide; ' + rands(s.net) +
        ' a month = setup paid back in month ' + s.breakEvenMonth + '.');
    }
    el('roiWorking').innerHTML = lines.map(function (line) { return '<li>' + line + '</li>'; }).join('');
  }

  function tierSentence() {
    return 'Document intake is ' + rands(SETTINGS.tiers[0].price) + ' a month up to ' +
      SETTINGS.tiers[0].upToDocs + ' documents, ' + rands(SETTINGS.tiers[1].price) + ' up to ' +
      SETTINGS.tiers[1].upToDocs + ', and ' + rands(SETTINGS.tiers[2].price) +
      ' above that. Unlimited users. All prices ex VAT.';
  }

  // ── Draw everything ─────────────────────────────────────────────────────────

  function render() {
    el('roiDocsOut').textContent = inputs.docsPerWeek.value;
    el('roiMinsOut').textContent = inputs.minsPerDoc.value + ' min';
    el('roiSalaryOut').textContent = rands(+inputs.salary.value);
    el('roiErrorsOut').textContent = inputs.errorRate.value + '%';
    el('roiShortOut').textContent = inputs.shortRate.value + '%';

    var s = sums();

    el('roiSetupOut').textContent = rands(s.setup);
    renderHeadline(s);
    renderBars(s);
    renderErrorChart(+inputs.errorRate.value);

    el('roiShortFigure').textContent = s.shortCaught;
    el('roiShortNote').textContent = s.shortCaught === 0
      ? 'Nothing arrives short, on your numbers. If that changes, it gets caught.'
      : (s.shortCaught === 1 ? 'A short or mismatched delivery a month, caught'
                              : 'Short or mismatched deliveries a month, caught') +
        ' at the dock — before you approve the supplier invoice.';

    renderWorking(s);
    el('roiTerms').textContent = tierSentence();
    el('roiCtaPrice').textContent = 'From ' + rands(SETTINGS.tiers[0].price) +
      ' a month · unlimited users · once-off setup from ' + rands(SETTINGS.setup.base);
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

  Object.keys(inputs).forEach(function (name) {
    var slider = inputs[name];
    var config = SETTINGS.sliders[name];
    slider.min = config.min;
    slider.max = config.max;
    slider.step = config.step;
    slider.value = config.start;
    slider.addEventListener('input', render);
    slider.addEventListener('change', reportCompleted);
  });

  integration.checked = SETTINGS.setup.integrationStartsOn;
  migration.checked = SETTINGS.setup.migrationStartsOn;
  [integration, migration].forEach(function (box) {
    box.addEventListener('change', function () { render(); reportCompleted(); });
  });

  render();

  // ── The email box ───────────────────────────────────────────────────────────
  // The results above are never gated. This only buys the written-up version.

  (function () {
    var form = el('roiCapture');
    var field = el('roiEmail');
    var button = el('roiCaptureBtn');
    var note = el('roiCaptureNote');

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
        'Captured lines needing fixes: ' + inputs.errorRate.value + '%',
        'Deliveries arriving short or wrong: ' + inputs.shortRate.value + '%',
        'Staying on our current system: ' + (integration.checked ? 'yes' : 'no'),
        'Data migration: ' + (migration.checked ? 'yes' : 'no'),
        '',
        'Documents a month: ' + s.docs,
        'Hours saved a month: ' + Math.round(s.hoursSaved),
        'Net a month: ' + rands(s.net),
        'Setup: ' + rands(s.setup),
        'Setup paid back: ' + (s.breakEvenMonth ? 'month ' + s.breakEvenMonth : 'not at this volume')
      ];
    }

    function showSent(email) {
      form.innerHTML = '<p class="roi-capture-done"><b>On its way.</b> We&rsquo;ll email your ' +
        'breakdown to ' + email.replace(/[<>&]/g, '') + ' within 48 hours.</p>';
    }

    function sendByEmail(email, s) {
      window.location.href = 'mailto:' + SETTINGS.contactEmail +
        '?subject=' + encodeURIComponent('ROI breakdown request') +
        '&body=' + encodeURIComponent(summaryLines(s).concat(['', 'Email: ' + email]).join('\n'));
      // Deliberately not the thank-you page: nothing has reached us until they
      // press send, and only this message tells them to.
      note.textContent = 'Your email app should have opened with your numbers ready. Hit send and we\'ll pick it up.';
    }

    function sendToWorker(email, s) {
      button.disabled = true;
      button.textContent = 'Sending…';
      fetch(SETTINGS.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'intake-roi-calculator',
          variant: 'roi_breakdown',
          delivery_notes_per_week: +inputs.docsPerWeek.value,
          minutes_per_document: +inputs.minsPerDoc.value,
          monthly_staff_cost: +inputs.salary.value,
          error_rate_percent: +inputs.errorRate.value,
          short_delivery_percent: +inputs.shortRate.value,
          keeping_current_system: integration.checked,
          data_migration: migration.checked,
          documents_per_month: s.docs,
          hours_saved: Math.round(s.hoursSaved),
          monthly_net: s.net,
          setup_fee: s.setup,
          break_even_month: s.breakEvenMonth
        })
      }).then(function (response) {
        if (!response.ok) throw new Error('Worker returned ' + response.status);
        window.location.href = SETTINGS.thankYouUrl;
      }).catch(function () {
        button.disabled = false;
        button.textContent = 'Send it to me';
        note.innerHTML = 'Something went wrong on our side. Email <a href="mailto:' +
          SETTINGS.contactEmail + '">' + SETTINGS.contactEmail + '</a> and we&rsquo;ll pick it up.';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = field.value.trim();

      if (!looksLikeEmail(email)) {
        note.textContent = 'That email address does not look right — check it and try again.';
        field.focus();
        return;
      }

      // Show the normal thank-you and drop it, rather than telling the bot it failed.
      if (el('roiWebsite').value) { showSent(email); return; }

      var s = sums();
      if (SETTINGS.leadEndpoint) sendToWorker(email, s); else sendByEmail(email, s);
    });
  })();
})();
