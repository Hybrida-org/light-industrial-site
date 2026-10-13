// Savings calculator — the numbers and the arithmetic, and nothing else.
//
// Two pages use this: the teaser on the home page and the full results at
// /savings/. Neither of them owns a number. Everything anybody may want to argue
// about lives in SETTINGS below, so there is exactly one place to change a price,
// a range or a default.
//
// Nothing here touches the page. These are plain functions: same inputs, same
// answer, no side effects. The drawing lives in the two scripts that call them.

(function (global) {
  'use strict';

  var SETTINGS = {
    // What a visitor sees before touching anything. "start" should describe a
    // real in-market buyer, not the smallest one.
    sliders: {
      docsPerWeek: { min: 5,    max: 150,   step: 5,   start: 30 },
      minsPerDoc:  { min: 3,    max: 30,    step: 1,   start: 12 },
      salary:      { min: 6000, max: 40000, step: 500, start: 18000 },
      errorRate:   { min: 0,    max: 40,    step: 1,   start: 15 },
      shortRate:   { min: 0,    max: 40,    step: 1,   start: 20 },
      deliveryValue: { min: 1000, max: 60000, step: 500, start: 6000 }
    },

    weeksPerMonth: 4.33,
    // Today's paperwork time is typing plus the chasing it causes. With intake the
    // typing becomes a glance, errors settle to the matching-memory floor, and a
    // short delivery is confirmed at the door instead of chased at month end.
    reviewShare: 0.15,           // share of today's typing time that remains as checking
    fixMinutesPerError: 20,      // find it, correct the stock, call the supplier
    chaseMinutesPerShort: 15,    // reconcile a short delivery against the invoice later
    confirmMinutesPerShort: 3,   // confirm it at the door with the photo in hand
    // The money side. A short delivery you paid for in full, and a price that
    // crept up without anyone noticing, are rands as well as hours. Each is a
    // slice of a typical delivery's value.
    shortSlice: 0.04,            // share of a short delivery's value paid for but not received
    overpaySlice: 0.02,          // share of a delivery's value lost to a moved price or an extra line
    workingHoursPerMonth: 173,   // one person's month

    // Document Intake is R2,500 a month with 50 documents included. Above that the
    // price is quoted, not published, so the sum measures against the base price at
    // any volume and the working-out says so. ponytail: single band, add a ladder
    // here when one is published.
    tiers: [
      { upToDocs: 50,       price: 2500 },
      { upToDocs: Infinity, price: 2500 }
    ],

    settledErrorRate: 2,    // where matching memory lands it
    decayMonths: 6,         // how long that takes
    longPaybackMonths: 24,  // past this we say so rather than let the number stand

    // Paste the deployed Worker URL here to send real leads. While it is empty the
    // forms fall back to the visitor's own email app, exactly like the homepage
    // form does. It never silently swallows a lead.
    leadEndpoint: '',
    contactEmail: 'donovan@lightindustrial.co.za',
    thankYouUrl: '/thank-you/',
    resultsUrl: '/savings/'
  };

  // Grey is today, green is with us. Those are the only two colours in the
  // charts, and they mean the same thing in every tile. Kept here because the
  // line chart is drawn in JavaScript and needs them too.
  var COLOURS = {
    today: '#9a9188',
    after: '#3f5d4b',
    grid: 'rgba(45,42,38,0.12)',
    ink: '#5f5850'
  };

  // The teaser on the home page hands its five slider values to
  // the results page in the address bar, so the results somebody lands on are the
  // ones they just set. Both ends read these key names from here, so a link can
  // never be built with a name the other side does not recognise.
  var QUERY_KEYS = {
    docsPerWeek: 'notes',
    minsPerDoc: 'mins',
    salary: 'salary',
    errorRate: 'errors',
    shortRate: 'short',
    deliveryValue: 'value'
  };

  // Builds the results-page link for a set of inputs.
  function resultsLinkFor(input) {
    var query = new URLSearchParams();
    Object.keys(QUERY_KEYS).forEach(function (name) {
      query.set(QUERY_KEYS[name], input[name]);
    });
    return SETTINGS.resultsUrl + '?' + query.toString();
  }

  // ── Formatting ──────────────────────────────────────────────────────────────

  // "-R5,100", never "R-5,100" — the minus belongs to the amount, not the currency.
  function rands(amount) {
    var rounded = Math.round(amount);
    return (rounded < 0 ? '-R' : 'R') +
      Math.abs(rounded).toLocaleString('en-ZA').replace(/[\s\u00a0\u202f]/g, ',');
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

  // `input` carries the slider values. There is no set-up fee, so there is no
  // once-off figure: the sum pays back from month 1 or not at all. Every
  // number the two pages show comes out of here, so neither of them does
  // arithmetic of its own.
  function calculate(input) {
    var docs = Math.round(input.docsPerWeek * SETTINGS.weeksPerMonth);
    var errorDocs = docs * input.errorRate / 100;
    var shortDocs = docs * input.shortRate / 100;

    var typingHours = docs * input.minsPerDoc / 60;
    var errorHours = errorDocs * SETTINGS.fixMinutesPerError / 60;
    var shortHours = shortDocs * SETTINGS.chaseMinutesPerShort / 60;
    var currentHours = typingHours + errorHours + shortHours;

    var settledErrorDocs = docs * Math.min(SETTINGS.settledErrorRate, input.errorRate) / 100;
    var newTypingHours = typingHours * SETTINGS.reviewShare;
    var newErrorHours = settledErrorDocs * SETTINGS.fixMinutesPerError / 60;
    var newShortHours = shortDocs * SETTINGS.confirmMinutesPerShort / 60;
    var newHours = newTypingHours + newErrorHours + newShortHours;
    var hoursSaved = Math.max(currentHours - newHours, 0);
    var hourlyCost = input.salary / SETTINGS.workingHoursPerMonth;
    var labourSaved = hoursSaved * hourlyCost;
    var moneyShort = shortDocs * input.deliveryValue * SETTINGS.shortSlice;
    var moneyOverpay = Math.max(errorDocs - settledErrorDocs, 0) * input.deliveryValue * SETTINGS.overpaySlice;
    var moneySaved = moneyShort + moneyOverpay;
    var totalSaved = labourSaved + moneySaved;
    var price = priceFor(docs);
    // Rounded to the nearest R100 — false precision reads as a made-up number.
    var net = Math.round((totalSaved - price) / 100) * 100;

    return {
      docs: docs,
      typingHours: typingHours,
      errorHours: errorHours,
      shortHours: shortHours,
      newTypingHours: newTypingHours,
      newErrorHours: newErrorHours,
      newShortHours: newShortHours,
      currentHours: currentHours,
      newHours: newHours,
      hoursSaved: hoursSaved,
      hourlyCost: hourlyCost,
      labourSaved: labourSaved,
      moneyShort: moneyShort,
      moneyOverpay: moneyOverpay,
      moneySaved: moneySaved,
      totalSaved: totalSaved,
      price: price,
      net: net,
      // Null, never a negative and never Infinity: when the sum does not pay yet
      // there is no payback month to show, and both pages fall back to hours.
      breakEvenMonth: net > 0 ? 1 : null,
      shortCaught: Math.round(docs * input.shortRate / 100)
    };
  }

  // The documents-a-week at which the sum turns positive, holding the other
  // inputs. Null when it does not within the slider range.
  function breakEvenDocsPerWeek(input) {
    var sl = SETTINGS.sliders.docsPerWeek;
    for (var d = input.docsPerWeek; d <= sl.max; d += sl.step) {
      var r = calculate({ docsPerWeek: d, minsPerDoc: input.minsPerDoc, salary: input.salary, errorRate: input.errorRate, shortRate: input.shortRate, deliveryValue: input.deliveryValue });
      if (r.net > 0) return d;
    }
    return null;
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

  global.SavingsSums = {
    SETTINGS: SETTINGS,
    COLOURS: COLOURS,
    QUERY_KEYS: QUERY_KEYS,
    resultsLinkFor: resultsLinkFor,
    calculate: calculate,
    breakEvenDocsPerWeek: breakEvenDocsPerWeek,
    errorCurve: errorCurve,
    priceFor: priceFor,
    rands: rands,
    hoursWord: hoursWord
  };
})(window);
