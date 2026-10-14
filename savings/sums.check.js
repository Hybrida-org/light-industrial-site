// node savings/sums.check.js — the one check that fails if the sum breaks.
global.window = global;
require('./sums.js');
var S = window.SavingsSums;
var d = S.SETTINGS.sliders;
var r = S.calculate({ docsPerWeek: d.docsPerWeek.start, minsPerDoc: d.minsPerDoc.start, salary: d.salary.start,
  errorRate: d.errorRate.start, shortRate: d.shortRate.start, spend: d.spend.start });
var assert = require('assert');
assert.strictEqual(r.docs, 260);
assert.ok(Math.abs(r.currentHours - 13) < 1e-9);
assert.ok(Math.abs(r.hourlyCost - 93.75) < 1e-9);
assert.strictEqual(r.moneySaved, 8000);
assert.strictEqual(r.net, 6500);
assert.strictEqual(r.paybackDays, 9);
assert.strictEqual(r.roiPercent, 260);
assert.strictEqual(S.paybackWord(9), '9 days');
assert.strictEqual(S.paybackWord(20), '3 weeks');
var small = S.calculate({ docsPerWeek: 5, minsPerDoc: 1, salary: 6000, errorRate: 0, shortRate: 0, spend: 20000 });
assert.strictEqual(small.paybackDays, null);
assert.strictEqual(small.roiPercent, 0);
console.log('ok', r);
