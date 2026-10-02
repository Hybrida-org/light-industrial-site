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
      salary:      { min: 6000, max: 25000, step: 500, start: 11000 },
      errorRate:   { min: 0,    max: 40,    step: 1,   start: 15 },
      shortRate:   { min: 0,    max: 40,    step: 1,   start: 20 }
    },

    weeksPerMonth: 4.33,
    reviewMinutesPerDoc: 2,      // we do not remove all of it — somebody still approves
    workingHoursPerMonth: 173,   // one person's month

    // Published document-intake prices, ex VAT, by documents a month. Three bands,
    // as before; the base came down to R2,500 with HYBRIDA-896, which also moved
    // what the base means — it buys the module and the first 50 documents, not a
    // document allowance on its own.
    tiers: [
      { upToDocs: 50,       price: 2500 },
      { upToDocs: 150,      price: 6500 },
      { upToDocs: Infinity, price: 12000 }
    ],

    settledErrorRate: 2,    // where matching memory lands it
    decayMonths: 6,         // how long that takes
    longPaybackMonths: 24,  // past this we say so rather than let the number stand

    // Paste the deployed Worker URL here to send real leads. While it is empty the
    // forms fall back to the visitor's own email app, exactly like the homepage
    // form does. It never silently swallows a lead.
    leadEndpoint: '',
    contactEmail: 'danika@lightindustrial.co.za',
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

  // The teaser on the home page hands its five slider values and two toggles to
  // the results page in the address bar, so the results somebody lands on are the
  // ones they just set. Both ends read these key names from here, so a link can
  // never be built with a name the other side does not recognise.
  var QUERY_KEYS = {
    docsPerWeek: 'notes',
    minsPerDoc: 'mins',
    salary: 'salary',
    errorRate: 'errors',
    shortRate: 'short',
    keepingOwnSystem: 'own',
    dataMigration: 'migrate'
  };

  // Builds the results-page link for a set of inputs. Booleans go over as 1 and 0
  // because a query string has no other honest way to say true and false.
  function resultsLinkFor(input) {
    var query = new URLSearchParams();
    Object.keys(QUERY_KEYS).forEach(function (name) {
      var value = input[name];
      query.set(QUERY_KEYS[name], typeof value === 'boolean' ? (value ? '1' : '0') : value);
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

  function setupFeeFor(choices) {
    return SETTINGS.setup.base +
      (choices.keepingOwnSystem ? SETTINGS.setup.integration : 0) +
      (choices.dataMigration ? SETTINGS.setup.migration : 0);
  }

  // `input` carries the five slider values and the two setup toggles. Every
  // number the two pages show comes out of here, so neither of them does
  // arithmetic of its own.
  function calculate(input) {
    var docs = Math.round(input.docsPerWeek * SETTINGS.weeksPerMonth);
    var currentHours = docs * input.minsPerDoc / 60;
    var newHours = docs * SETTINGS.reviewMinutesPerDoc / 60;
    var hoursSaved = Math.max(currentHours - newHours, 0);
    var hourlyCost = input.salary / SETTINGS.workingHoursPerMonth;
    var labourSaved = hoursSaved * hourlyCost;
    var price = priceFor(docs);
    var setup = setupFeeFor(input);
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
      // Null, never a negative and never Infinity: when the sum does not pay yet
      // there is no payback month to show, and both pages fall back to hours.
      breakEvenMonth: net > 0 ? Math.ceil(setup / net) : null,
      shortCaught: Math.round(docs * input.shortRate / 100)
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

  global.SavingsSums = {
    SETTINGS: SETTINGS,
    COLOURS: COLOURS,
    QUERY_KEYS: QUERY_KEYS,
    resultsLinkFor: resultsLinkFor,
    calculate: calculate,
    errorCurve: errorCurve,
    priceFor: priceFor,
    rands: rands,
    hoursWord: hoursWord
  };
})(window);
