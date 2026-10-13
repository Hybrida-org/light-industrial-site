// The order-to-payment loop. Eight cards in a snake, four across and two down.
// A brick line traces the border of the card you are on, then runs along the
// connector to the next card. The words and a small screen for that card sit
// on the left. One source for Home and the Document Intake page: renders into
// any element carrying data-flow-loop.
(function () {
  'use strict';
  function bar(l, r) { return '<div class="loop-shot-bar"><span>' + l + '</span><span>' + r + '</span></div>'; }
  function row(l, r, cls) { return '<div class="loop-shot-row' + (cls ? ' ' + cls : '') + '"><span>' + l + '</span><span>' + r + '</span></div>'; }
  var STEPS = [
    { t: 'Raise the purchase order', s: 'Sent from the system', icon: 'solar:document-add-linear',
      d: 'You raise the order and email it from the system. From here on we check every document the supplier sends against this order.',
      shot: bar('PO-0612, Steelmart', 'Sent 2 Oct') + row('Galv bolt M12x40', '200') + row('Angle 50x50x5, 6 m', '12') + row('Cutting disc 115', '12') + row('Weld wire 0.9, 15 kg', '4') },
    { t: 'We read the supplier quote', s: 'Every line in your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.',
      shot: bar('Q-2290.pdf', 'Read, 4 lines') + row('Galv bolt M12x40 bx100', 'BLT-M12-40') + row('Angle iron 50x50x5 6m', 'ANG-50-5') + row('Cutting disc 115mm', 'DSC-115') + row('Weld wire 0.9 15kg', 'WIR-09') },
    { t: 'You accept it', s: 'It becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.',
      shot: bar('Quotes for PO-0612', '3 in') + row('Steelmart', 'R18,420, accepted', 'is-ok') + row('Metalco', 'R19,100') + row('Bolt and Nut', 'R18,900') },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear', ai: true,
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.',
      shot: '<div class="loop-shot-photo"><img src="/public/01-capture.jpg" alt="" loading="lazy"></div>' + row('DN 48213.jpg', 'Gate, 08:12') },
    { t: 'We check every line', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear',
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.',
      shot: bar('DN 48213 vs PO-0612', '4 lines') + row('BLT-M12-40', '200 of 200', 'is-ok') + row('ANG-50-5', '12 of 12', 'is-ok') + row('DSC-115', '10 of 12, short', 'is-short') + row('WIR-09', 'R412 to R450', 'is-price') },
    { t: 'Stock updates', s: 'Short balance stays open', icon: 'solar:box-minimalistic-linear',
      d: 'Stock on hand and cost update in the units you count in. The two discs still owed stay open on the order. We file the photo against the movement.',
      shot: bar('GRN 2211 booked', '09:14') + row('BLT-M12-40', '340 to 540') + row('ANG-50-5', '18 to 30') + row('DSC-115', '2 still owed', 'is-short') + row('Photo', 'Filed', 'is-ok') },
    { t: 'We read the invoice', s: 'Matched to quote, order and delivery', icon: 'solar:bill-list-linear', ai: true,
      d: 'The invoice arrives by email. We read it and reconcile it line by line against the quote, the order and what the delivery note says arrived.',
      shot: bar('INV 1187 vs PO-0612', 'Reconciled') + row('BLT-M12-40', 'Matches', 'is-ok') + row('ANG-50-5', 'Matches', 'is-ok') + row('DSC-115', 'Billed 12, got 10', 'is-short') + row('WIR-09', 'Quoted R412, billed R450', 'is-price') },
    { t: 'You pay for what arrived', s: 'Short lines and moved prices held back', icon: 'solar:wallet-money-linear',
      d: 'The invoice goes to your accountant with the short lines and the moved price marked. You pay for what arrived at the price you were quoted, and the balance stays on record until it does.',
      shot: bar('INV 1187', 'To accounts') + row('Billed', 'R18,796') + row('Short 2 x DSC-115', 'Held back', 'is-short') + row('WIR-09 price', 'Queried', 'is-price') + row('Approved to pay', 'R18,230', 'is-ok') }
  ];
  var RING_MS = 2600, CONN_MS = 600;
  var CARD_POS = [[1, 1], [1, 3], [1, 5], [1, 7], [3, 7], [3, 5], [3, 3], [3, 1]];
  var CONN_POS = [[1, 2, 'h'], [1, 4, 'h'], [1, 6, 'h'], [2, 7, 'v'], [3, 6, 'h'], [3, 4, 'h'], [3, 2, 'h']];

  function cardHtml(st, i) {
    return '<button type="button" class="loop-card' + (st.ai ? ' is-ai' : '') + '" data-i="' + i +
      '" style="grid-row:' + CARD_POS[i][0] + ';grid-column:' + CARD_POS[i][1] + '">' +
      '<svg class="loop-ring" aria-hidden="true"><rect pathLength="1"/></svg>' +
      '<span class="loop-ci"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
      '<span class="loop-cl">' + st.t + '</span><span class="loop-cs">' + st.s + '</span>' +
      (st.ai ? '<span class="loop-ai">AI</span>' : '') + '</button>';
  }
  function connHtml(c, i) {
    var v = c[2] === 'v';
    return '<svg class="loop-conn' + (v ? ' is-v' : '') + '" data-c="' + i + '" aria-hidden="true" style="grid-row:' + c[0] + ';grid-column:' + c[1] + '">' +
      '<line pathLength="1" x1="' + (v ? '50%' : '0') + '" y1="' + (v ? '0' : '50%') + '" x2="' + (v ? '50%' : '100%') + '" y2="' + (v ? '100%' : '50%') + '"/></svg>';
  }

  document.querySelectorAll('[data-flow-loop]').forEach(function (host) {
    host.innerHTML =
      '<div class="loop">' +
        '<div class="loop-copy"><div class="loop-shot"></div><p class="loop-copy-k">Step <span class="loop-copy-i">1</span> of ' + STEPS.length + '</p>' +
        '<h3 class="loop-copy-t"></h3><p class="loop-copy-d"></p></div>' +
        '<div class="loop-grid">' + STEPS.map(cardHtml).join('') + CONN_POS.map(connHtml).join('') + '</div>' +
      '</div>';
    var loop = host.querySelector('.loop');
    var cards = host.querySelectorAll('.loop-card');
    var conns = host.querySelectorAll('.loop-conn');
    var tEl = host.querySelector('.loop-copy-t'), dEl = host.querySelector('.loop-copy-d'), iEl = host.querySelector('.loop-copy-i'), shotEl = host.querySelector('.loop-shot');
    var cur = 0, timers = [], running = false;
    loop.style.setProperty('--ring-ms', RING_MS + 'ms');
    loop.style.setProperty('--conn-ms', CONN_MS + 'ms');

    function sizeRings() {
      cards.forEach(function (c) {
        var r = c.querySelector('rect'), w = c.offsetWidth, h = c.offsetHeight;
        r.setAttribute('x', 1); r.setAttribute('y', 1);
        r.setAttribute('width', Math.max(w - 2, 0)); r.setAttribute('height', Math.max(h - 2, 0));
        r.setAttribute('rx', 15);
      });
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function words(i) {
      tEl.textContent = STEPS[i].t; dEl.textContent = STEPS[i].d; iEl.textContent = i + 1;
      shotEl.innerHTML = STEPS[i].shot; shotEl.classList.remove('is-in'); void shotEl.offsetWidth; shotEl.classList.add('is-in');
    }
    function reset() {
      cards.forEach(function (c) { c.classList.remove('is-active', 'is-drawing', 'is-done'); });
      conns.forEach(function (c) { c.classList.remove('is-drawing', 'is-done'); });
    }
    function play(i) {
      if (i === 0) reset();
      cur = i; words(i);
      cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      cards[i].classList.add('is-drawing');
      timers.push(setTimeout(function () {
        cards[i].classList.remove('is-drawing'); cards[i].classList.add('is-done');
        if (i < conns.length) {
          conns[i].classList.add('is-drawing');
          timers.push(setTimeout(function () {
            conns[i].classList.remove('is-drawing'); conns[i].classList.add('is-done');
            play(i + 1);
          }, CONN_MS));
        } else {
          timers.push(setTimeout(function () { play(0); }, 1200));
        }
      }, RING_MS));
    }
    function start() { if (running) return; running = true; play(cur); }
    function stop() { running = false; clearTimers(); }
    function pick(i) {
      stop(); reset(); cur = i; words(i);
      cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); c.classList.toggle('is-done', k <= i); });
      conns.forEach(function (c, k) { c.classList.toggle('is-done', k < i); });
    }
    cards.forEach(function (c) { c.addEventListener('click', function () { pick(+c.getAttribute('data-i')); }); });
    loop.addEventListener('mouseleave', function () { if (!running) start(); });
    sizeRings(); window.addEventListener('resize', sizeRings);
    words(0); cards[0].classList.add('is-active');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });
})();
