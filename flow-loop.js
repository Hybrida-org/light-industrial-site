// The order-to-payment loop. Eight cards in a snake, four across and two down,
// with dots running along the connectors and a glow on the card you are on. One source for Home and the Document Intake page: renders into
// any element carrying data-flow-loop.
(function () {
  'use strict';
    var STEPS = [
    { t: 'Raise the purchase order', s: 'Sent from the system', icon: 'solar:document-add-linear',
      d: 'You raise the order and email it from the system. From here on we check every document the supplier sends against this order.' },
    { t: 'We read the supplier quote', s: 'Every line in your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.' },
    { t: 'You accept it', s: 'It becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.' },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear',
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.' },
    { t: 'We check every line', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear', ai: true,
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.' },
    { t: 'Stock updates', s: 'Short balance stays open', icon: 'solar:box-minimalistic-linear', ai: true,
      d: 'Stock on hand and cost update in the units you count in. The two discs still owed stay open on the order. We file the photo against the movement.' },
    { t: 'We read the invoice', s: 'Matched to quote, order and delivery', icon: 'solar:bill-list-linear', ai: true,
      d: 'The invoice arrives by email. We read it and reconcile it line by line against the quote, the order and what the delivery note says arrived.' },
    { t: 'You pay for what arrived', s: 'Short lines and moved prices held back', icon: 'solar:wallet-money-linear',
      d: 'The invoice goes to your accountant with the short lines and the moved price marked. You pay for what arrived at the price you were quoted, and the balance stays on record until it does.' }
  ];
  var RING_MS = 2600, CONN_MS = 600;
  var CARD_POS = [[1, 1], [1, 3], [1, 5], [1, 7], [3, 7], [3, 5], [3, 3], [3, 1]];
  var CONN_POS = [[1, 2, 'h'], [1, 4, 'h'], [1, 6, 'h'], [2, 7, 'v'], [3, 6, 'r'], [3, 4, 'r'], [3, 2, 'r']];

  function cardHtml(st, i) {
    return '<button type="button" class="loop-card' + (st.ai ? ' is-ai' : ' is-you') + '" data-i="' + i +
      '" style="grid-row:' + CARD_POS[i][0] + ';grid-column:' + CARD_POS[i][1] + '">' +
      '<span class="loop-ci"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
      '<span class="loop-cl">' + st.t + '</span>' +
      '<span class="loop-who">' + (st.ai ? 'AI' : 'You') + '</span></button>';
  }
  function connHtml(c, i) {
    var v = c[2] === 'v', r = c[2] === 'r';
    var x1 = v ? '50%' : (r ? '100%' : '0'), x2 = v ? '50%' : (r ? '0' : '100%');
    return '<div class="loop-conn' + (v ? ' is-v' : (r ? ' is-r' : '')) + '" data-c="' + i + '" aria-hidden="true" style="grid-row:' + c[0] + ';grid-column:' + c[1] + '"><span class="loop-dot"></span></div>';
  }

  document.querySelectorAll('[data-flow-loop]').forEach(function (host) {
    host.innerHTML =
      '<div class="loop">' +
        '<div class="loop-right"><div class="loop-grid">' + STEPS.map(cardHtml).join('') + CONN_POS.map(connHtml).join('') + '</div>' +
        '</div>' +
      '</div>';
    var loop = host.querySelector('.loop');
    var cards = host.querySelectorAll('.loop-card');
    var conns = host.querySelectorAll('.loop-conn');
    var cur = 0, timers = [], running = false;
    loop.style.setProperty('--ring-ms', RING_MS + 'ms');
    loop.style.setProperty('--conn-ms', CONN_MS + 'ms');

    function sizeRings() {}
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function words(i) {}
    function reset() {
      cards.forEach(function (c) { c.classList.remove('is-active', 'is-drawing', 'is-done'); });
      conns.forEach(function (c) { c.classList.remove('is-drawing', 'is-done'); });
    }
    function play(i) {
      sizeRings();
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeRings);
    if (window.ResizeObserver) { var ro = new ResizeObserver(sizeRings); cards.forEach(function (c) { ro.observe(c); }); }
    words(0); cards[0].classList.add('is-active');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });
})();
