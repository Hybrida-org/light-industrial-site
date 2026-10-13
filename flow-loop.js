// The order-to-stock loop. Six cards in a snake, three across and two down. A
// brick line traces the border of the card you are on, then runs along the
// connector to the next card. The words for that card sit on the left. One
// source for Home and the Document Intake page: renders into [data-flow-loop].
(function () {
  'use strict';
  var STEPS = [
    { t: 'Raise the purchase order', s: 'Sent from the system', icon: 'solar:document-add-linear',
      d: 'You raise the order and email it from the system. From here on we check every document the supplier sends against this order.' },
    { t: 'We read the supplier quote', s: 'Every line in your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.' },
    { t: 'You accept it', s: 'It becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.' },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear', ai: true,
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.' },
    { t: 'We check every line', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear',
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.' },
    { t: 'Stock updates', s: 'Photo on file', icon: 'solar:box-minimalistic-linear',
      d: 'Stock on hand and cost update in the units you count in. We file the photo against the movement as proof of delivery.' }
  ];
  var RING_MS = 2600, CONN_MS = 700;
  // Where each card and connector sits in the 5x3 grid (columns 1,3,5 are cards).
  var CARD_POS = [[1, 1], [1, 3], [1, 5], [3, 5], [3, 3], [3, 1]];
  var CONN_POS = [[1, 2, 'h'], [1, 4, 'h'], [2, 5, 'v'], [3, 4, 'h'], [3, 2, 'h']];

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
        '<div class="loop-copy"><p class="loop-copy-k">Step <span class="loop-copy-i">1</span> of ' + STEPS.length + '</p>' +
        '<h3 class="loop-copy-t"></h3><p class="loop-copy-d"></p><p class="loop-copy-n">Click a step to read it.</p></div>' +
        '<div class="loop-grid">' + STEPS.map(cardHtml).join('') + CONN_POS.map(connHtml).join('') + '</div>' +
      '</div>';
    var loop = host.querySelector('.loop');
    var cards = host.querySelectorAll('.loop-card');
    var conns = host.querySelectorAll('.loop-conn');
    var tEl = host.querySelector('.loop-copy-t'), dEl = host.querySelector('.loop-copy-d'), iEl = host.querySelector('.loop-copy-i');
    var cur = 0, timers = [], running = false;
    loop.style.setProperty('--ring-ms', RING_MS + 'ms');
    loop.style.setProperty('--conn-ms', CONN_MS + 'ms');

    // The ring is an SVG rect sized to the card, so the stroke follows the real
    // rounded border instead of a stretched viewBox.
    function sizeRings() {
      cards.forEach(function (c) {
        var r = c.querySelector('rect'), w = c.offsetWidth, h = c.offsetHeight;
        r.setAttribute('x', 1); r.setAttribute('y', 1);
        r.setAttribute('width', Math.max(w - 2, 0)); r.setAttribute('height', Math.max(h - 2, 0));
        r.setAttribute('rx', 15);
      });
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function words(i) { tEl.textContent = STEPS[i].t; dEl.textContent = STEPS[i].d; iEl.textContent = i + 1; }
    function reset() {
      cards.forEach(function (c) { c.classList.remove('is-active', 'is-drawing', 'is-done'); });
      conns.forEach(function (c) { c.classList.remove('is-drawing', 'is-done'); });
    }
    // Step i: draw the ring, then the connector after it, then move on.
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
          timers.push(setTimeout(function () { play(0); }, 900));
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
