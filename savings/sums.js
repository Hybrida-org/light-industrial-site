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
      docsPerWeek: { min: 5,     max: 300,     step: 5,     start: 60 },
      minsPerDoc:  { min: 1,     max: 15,      step: 1,     start: 3 },
      salary:      { min: 6000,  max: 40000,   step: 500,   start: 15000 },
      errorRate:   { min: 0,     max: 20,      step: 1,     start: 5 },
      shortRate:   { min: 0,     max: 20,      step: 1,     start: 3 },
      spend:       { min: 20000, max: 1000000, step: 10000, start: 100000 }
    },

    weeksPerYear: 52,
    monthsPerYear: 12,
    // Somebody still glances at each document and approves it. Set to 0 to claim
    // every typing minute back.
    reviewShare: 0.15,
    workingHoursPerMonth: 160,   // one person's month
    daysPerMonth: 30,            // for "pays for itself in N days"

    // Document Intake is R2,500 a month with 50 documents included. Above that the
    // price is quoted, not published, so the sum measures against the base price at
    // any volume and the working-out says so. ponytail: single band, add a ladder
    // here when one is published.
    tiers: [
      { upToDocs: 50,       price: 2500 },
      { upToDocs: Infinity, price: 2500 }
    ],

    // The "mistakes, month by month" tile only.
    settledErrorRate: 2,    // where matching memory lands it
    decayMonths: 6,         // how long that takes

    // Where leads go is set once in tracking.js (hubspotFormGuid). While it is
    // empty the forms fall back to the visitor's own email app.
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
    spend: 'spend'
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
  // once-off figure: the sum pays back inside the month or not at all. Every
  // number the two pages show comes out of here, so neither of them does
  // arithmetic of its own.
  //
  //   documents a month   = notes a week x 52 / 12
  //   admin hours         = documents x minutes / 60
  //   hourly rate         = monthly cost / 160
  //   labour saved        = admin hours x (1 - reviewShare) x hourly rate
  //   leakage saved       = monthly spend x (short% + price creep%)
  //   net                 = labour + leakage - price, to the nearest R100
  function calculate(input) {
    var docs = Math.round(input.docsPerWeek * SETTINGS.weeksPerYear / SETTINGS.monthsPerYear);
    var currentHours = docs * input.minsPerDoc / 60;
    var newHours = currentHours * SETTINGS.reviewShare;
    var hoursSaved = currentHours - newHours;
    var hourlyCost = input.salary / SETTINGS.workingHoursPerMonth;
    var labourSaved = hoursSaved * hourlyCost;
    var moneyShort = input.spend * input.shortRate / 100;
    var moneyOverpay = input.spend * input.errorRate / 100;
    var moneySaved = moneyShort + moneyOverpay;
    var totalSaved = labourSaved + moneySaved;
    var price = priceFor(docs);
    // Rounded to the nearest R100 — false precision reads as a made-up number.
    var net = Math.round((totalSaved - price) / 100) * 100;
    // Days of saving it takes to cover the month's price. Null when it does not
    // inside the month: never a negative and never Infinity on the page.
    var paybackDays = net > 0 ? Math.ceil(price / (totalSaved / SETTINGS.daysPerMonth)) : null;

    return {
      docs: docs,
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
      paybackDays: paybackDays,
      breakEvenMonth: net > 0 ? 1 : null,
      roiPercent: net > 0 ? Math.round(net / price * 100) : 0,
      shortCaught: Math.round(docs * input.shortRate / 100)
    };
  }

  // "9 days", "3 weeks". Only called when paybackDays is a number.
  function paybackWord(days) {
    if (days <= 14) return days === 1 ? '1 day' : days + ' days';
    var weeks = Math.ceil(days / 7);
    return weeks === 1 ? '1 week' : weeks + ' weeks';
  }

  // The documents-a-week at which the sum turns positive, holding the other
  // inputs. Null when it does not within the slider range.
  function breakEvenDocsPerWeek(input) {
    var sl = SETTINGS.sliders.docsPerWeek;
    for (var d = input.docsPerWeek; d <= sl.max; d += sl.step) {
      var r = calculate({ docsPerWeek: d, minsPerDoc: input.minsPerDoc, salary: input.salary, errorRate: input.errorRate, shortRate: input.shortRate, spend: input.spend });
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
    hoursWord: hoursWord,
    paybackWord: paybackWord
  };
})(window);
