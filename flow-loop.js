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
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="60" y="22" width="56" height="70" rx="6" fill="#fbfaf7"/><line x1="72" y1="40" x2="108" y2="40" stroke="#a9b1ac"/><line x1="72" y1="50" x2="108" y2="50" stroke="#a9b1ac"/><line x1="72" y1="60" x2="108" y2="60" stroke="#a9b1ac"/><line x1="72" y1="70" x2="100" y2="70" stroke="#a9b1ac"/><text x="72" y="34" font-family="Poppins,sans-serif" font-size="9" font-weight="600" fill="#2d2a26" stroke="none">PO-0612</text><path d="M128 57h40" stroke="#a88a6d"/><path d="M160 49l10 8-10 8" stroke="#a88a6d"/><rect x="176" y="40" width="34" height="26" rx="4" fill="#fbfaf7" stroke="#a88a6d"/><path d="M176 44l17 12 17-12" stroke="#a88a6d"/></svg>' },
    { t: 'We read the supplier quote', s: 'Every line in your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="40" y="22" width="56" height="70" rx="6" fill="#fbfaf7"/><line x1="52" y1="40" x2="88" y2="40" stroke="#a9b1ac"/><line x1="52" y1="50" x2="88" y2="50" stroke="#a9b1ac"/><line x1="52" y1="60" x2="88" y2="60" stroke="#a9b1ac"/><line x1="52" y1="70" x2="80" y2="70" stroke="#a9b1ac"/><rect x="36" y="56" width="64" height="2" fill="#8ea596" stroke="none"/><rect x="36" y="18" width="64" height="78" rx="8" stroke="#8ea596" stroke-dasharray="4 4"/><path d="M112 57h28" stroke="#8ea596"/><path d="M132 51l8 6-8 6" stroke="#8ea596"/><rect x="150" y="28" width="56" height="14" rx="3" fill="#e8ede9" stroke="#8ea596"/><text x="156" y="38" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#2d2a26" stroke="none">BLT-M12-40</text><rect x="150" y="48" width="56" height="14" rx="3" fill="#e8ede9" stroke="#8ea596"/><text x="156" y="58" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#2d2a26" stroke="none">ANG-50-5</text><rect x="150" y="68" width="56" height="14" rx="3" fill="#e8ede9" stroke="#8ea596"/><text x="156" y="78" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#2d2a26" stroke="none">DSC-115</text><rect x="150" y="88" width="56" height="14" rx="3" fill="#e8ede9" stroke="#8ea596"/><text x="156" y="98" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="#2d2a26" stroke="none">WIR-09</text></svg>' },
    { t: 'You accept it', s: 'It becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="44" y="22" width="56" height="70" rx="6" fill="#fbfaf7"/><line x1="56" y1="40" x2="92" y2="40" stroke="#a9b1ac"/><line x1="56" y1="50" x2="92" y2="50" stroke="#a9b1ac"/><line x1="56" y1="60" x2="92" y2="60" stroke="#a9b1ac"/><line x1="56" y1="70" x2="84" y2="70" stroke="#a9b1ac"/><rect x="120" y="30" width="44" height="54" rx="6" fill="#fbfaf7"/><line x1="128" y1="44" x2="154" y2="44" stroke="#a9b1ac"/><line x1="128" y1="54" x2="154" y2="54" stroke="#a9b1ac"/><line x1="128" y1="64" x2="146" y2="64" stroke="#a9b1ac"/><circle cx="92" cy="90" r="16" fill="#8ea596" stroke="none"/><path d="M84 90l6 6 11-12" stroke="#fbfaf7" stroke-width="3"/><text x="44" y="112" font-family="Poppins,sans-serif" font-size="9" font-weight="600" fill="#3f5d4b" stroke="none">Accepted</text><text x="120" y="112" font-family="Poppins,sans-serif" font-size="9" fill="#7f8782" stroke="none">Other quotes</text></svg>' },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear',
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="92" y="10" width="56" height="100" rx="10" fill="#2d2a26" stroke="none"/><rect x="98" y="20" width="44" height="76" rx="4" fill="#fbfaf7" stroke="none"/><rect x="106" y="32" width="28" height="40" rx="6" fill="#fbfaf7"/><line x1="111" y1="42" x2="129" y2="42" stroke="#a9b1ac"/><line x1="111" y1="52" x2="129" y2="52" stroke="#a9b1ac"/><line x1="111" y1="62" x2="121" y2="62" stroke="#a9b1ac"/><path d="M102 26h8M102 26v8M138 26h-8M138 26v8M102 90h8M102 90v-8M138 90h-8M138 90v-8" stroke="#a88a6d"/><circle cx="120" cy="104" r="3" fill="#fbfaf7" stroke="none"/><path d="M40 60h40" stroke="#a9b1ac" stroke-dasharray="3 4"/><path d="M160 60h40" stroke="#a9b1ac" stroke-dasharray="3 4"/></svg>' },
    { t: 'We check every line', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear', ai: true,
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="70" y="16" width="100" height="88" rx="6" fill="#fbfaf7"/><line x1="98" y1="34" x2="140" y2="34" stroke="#a9b1ac"/><line x1="98" y1="52" x2="140" y2="52" stroke="#a9b1ac"/><line x1="98" y1="70" x2="140" y2="70" stroke="#a9b1ac"/><line x1="98" y1="88" x2="140" y2="88" stroke="#a9b1ac"/><circle cx="86" cy="34" r="5" fill="#8ea596" stroke="none"/><path d="M83 34l2 2 4-4" stroke="#fbfaf7" stroke-width="1.5"/><circle cx="86" cy="52" r="5" fill="#8ea596" stroke="none"/><path d="M83 52l2 2 4-4" stroke="#fbfaf7" stroke-width="1.5"/><circle cx="86" cy="70" r="5" fill="#9b3b2d" stroke="none"/><text x="84" y="73" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#fbfaf7" stroke="none">!</text><circle cx="86" cy="88" r="5" fill="#a88a6d" stroke="none"/><text x="84.5" y="91" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#fbfaf7" stroke="none">R</text><text x="150" y="73" font-family="Poppins,sans-serif" font-size="8" fill="#9b3b2d" stroke="none">short</text><text x="150" y="91" font-family="Poppins,sans-serif" font-size="8" fill="#6d5641" stroke="none">price</text></svg>' },
    { t: 'Stock updates', s: 'Short balance stays open', icon: 'solar:box-minimalistic-linear', ai: true,
      d: 'Stock on hand and cost update in the units you count in. The two discs still owed stay open on the order. We file the photo against the movement.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="60" y="80" width="30" height="24" rx="3" fill="#fbfaf7"/><rect x="94" y="80" width="30" height="24" rx="3" fill="#fbfaf7"/><rect x="77" y="54" width="30" height="24" rx="3" fill="#fbfaf7"/><rect x="128" y="80" width="30" height="24" rx="3" fill="#e8ede9" stroke="#8ea596"/><rect x="162" y="80" width="30" height="24" rx="3" fill="#e8ede9" stroke="#8ea596"/><rect x="145" y="54" width="30" height="24" rx="3" fill="#e8ede9" stroke="#8ea596"/><rect x="128" y="28" width="30" height="24" rx="3" fill="#e8ede9" stroke="#8ea596"/><path d="M196 30v-16M188 22l8-8 8 8" stroke="#3f5d4b" stroke-width="2.5"/><text x="60" y="114" font-family="Poppins,sans-serif" font-size="9" fill="#7f8782" stroke="none">On hand 340</text><text x="128" y="114" font-family="Poppins,sans-serif" font-size="9" font-weight="600" fill="#3f5d4b" stroke="none">540</text></svg>' },
    { t: 'We read the invoice', s: 'Matched to quote, order and delivery', icon: 'solar:bill-list-linear', ai: true,
      d: 'The invoice arrives by email. We read it and reconcile it line by line against the quote, the order and what the delivery note says arrived.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="20" y="14" width="36" height="44" rx="6" fill="#fbfaf7"/><line x1="27" y1="26" x2="49" y2="26" stroke="#a9b1ac"/><line x1="27" y1="36" x2="49" y2="36" stroke="#a9b1ac"/><line x1="27" y1="46" x2="41" y2="46" stroke="#a9b1ac"/><rect x="20" y="66" width="36" height="44" rx="6" fill="#fbfaf7"/><line x1="27" y1="78" x2="49" y2="78" stroke="#a9b1ac"/><line x1="27" y1="88" x2="49" y2="88" stroke="#a9b1ac"/><line x1="27" y1="98" x2="41" y2="98" stroke="#a9b1ac"/><rect x="66" y="40" width="36" height="44" rx="6" fill="#fbfaf7"/><line x1="73" y1="52" x2="95" y2="52" stroke="#a9b1ac"/><line x1="73" y1="62" x2="95" y2="62" stroke="#a9b1ac"/><line x1="73" y1="72" x2="87" y2="72" stroke="#a9b1ac"/><text x="24" y="10" font-family="Poppins,sans-serif" font-size="7" fill="#7f8782" stroke="none">Quote</text><text x="24" y="62" font-family="Poppins,sans-serif" font-size="7" fill="#7f8782" stroke="none">Delivery</text><text x="70" y="36" font-family="Poppins,sans-serif" font-size="7" fill="#7f8782" stroke="none">Order</text><path d="M56 36l10 10M56 88l10-10M102 62h26" stroke="#8ea596"/><rect x="128" y="22" width="60" height="78" rx="6" fill="#e8ede9" stroke="#8ea596"/><line x1="138" y1="40" x2="178" y2="40" stroke="#a9b1ac"/><line x1="138" y1="50" x2="178" y2="50" stroke="#a9b1ac"/><line x1="138" y1="60" x2="178" y2="60" stroke="#a9b1ac"/><line x1="138" y1="70" x2="170" y2="70" stroke="#a9b1ac"/><text x="138" y="32" font-family="Poppins,sans-serif" font-size="9" font-weight="600" fill="#2d2a26" stroke="none">INV 1187</text><circle cx="196" cy="92" r="12" fill="#8ea596" stroke="none"/><path d="M190 92l4 4 8-9" stroke="#fbfaf7" stroke-width="2.5"/></svg>' },
    { t: 'You pay for what arrived', s: 'Short lines and moved prices held back', icon: 'solar:wallet-money-linear',
      d: 'The invoice goes to your accountant with the short lines and the moved price marked. You pay for what arrived at the price you were quoted, and the balance stays on record until it does.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="56" y="16" width="88" height="88" rx="6" fill="#fbfaf7"/><text x="66" y="32" font-family="Poppins,sans-serif" font-size="9" font-weight="600" fill="#2d2a26" stroke="none">INV 1187</text><line x1="66" y1="46" x2="120" y2="46" stroke="#a9b1ac"/><line x1="66" y1="60" x2="120" y2="60" stroke="#a9b1ac"/><line x1="66" y1="74" x2="120" y2="74" stroke="#9b3b2d"/><line x1="62" y1="74" x2="124" y2="74" stroke="#9b3b2d" stroke-width="1"/><text x="126" y="77" font-family="Poppins,sans-serif" font-size="7" fill="#9b3b2d" stroke="none">held</text><line x1="66" y1="92" x2="100" y2="92" stroke="#2d2a26" stroke-width="2.5"/><text x="104" y="95" font-family="Poppins,sans-serif" font-size="8" font-weight="600" fill="#3f5d4b" stroke="none">R18,230</text><circle cx="178" cy="60" r="18" fill="#a88a6d" stroke="none"/><text x="172" y="65" font-family="Poppins,sans-serif" font-size="14" font-weight="700" fill="#fbfaf7" stroke="none">R</text><path d="M160 96h36" stroke="#a88a6d"/></svg>' }
  ];
  var RING_MS = 2600, CONN_MS = 600;
  var CARD_POS = [[1, 1], [1, 3], [1, 5], [1, 7], [3, 7], [3, 5], [3, 3], [3, 1]];
  var CONN_POS = [[1, 2, 'h'], [1, 4, 'h'], [1, 6, 'h'], [2, 7, 'v'], [3, 6, 'r'], [3, 4, 'r'], [3, 2, 'r']];

  function cardHtml(st, i) {
    return '<button type="button" class="loop-card' + (st.ai ? ' is-ai' : ' is-you') + '" data-i="' + i +
      '" style="grid-row:' + CARD_POS[i][0] + ';grid-column:' + CARD_POS[i][1] + '">' +
      '<svg class="loop-ring" aria-hidden="true"><rect pathLength="1"/></svg>' +
      '<span class="loop-ci"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
      '<span class="loop-cl">' + st.t + '</span><span class="loop-cs">' + st.s + '</span>' +
      '<span class="loop-who">' + (st.ai ? 'AI' : 'You') + '</span></button>';
  }
  function connHtml(c, i) {
    var v = c[2] === 'v', r = c[2] === 'r';
    var x1 = v ? '50%' : (r ? '100%' : '0'), x2 = v ? '50%' : (r ? '0' : '100%');
    return '<svg class="loop-conn' + (v ? ' is-v' : '') + '" data-c="' + i + '" aria-hidden="true" style="grid-row:' + c[0] + ';grid-column:' + c[1] + '">' +
      '<line pathLength="1" x1="' + x1 + '" y1="' + (v ? '0' : '50%') + '" x2="' + x2 + '" y2="' + (v ? '100%' : '50%') + '"/></svg>';
  }

  document.querySelectorAll('[data-flow-loop]').forEach(function (host) {
    host.innerHTML =
      '<div class="loop">' +
        '<div class="loop-copy"><div class="loop-shot"></div><p class="loop-copy-k">Step <span class="loop-copy-i">1</span> of ' + STEPS.length + ' <span class="loop-copy-who"></span></p>' +
        '<h3 class="loop-copy-t"></h3><p class="loop-copy-d"></p></div>' +
        '<div class="loop-right"><div class="loop-grid">' + STEPS.map(cardHtml).join('') + CONN_POS.map(connHtml).join('') + '</div>' +
        '<p class="loop-legend"><span class="is-ai">AI</span><span class="is-you">You</span> Four of the eight steps are yours. Each one takes a minute. The AI steps are Document Intake, the rest is Core ERP.</p></div>' +
      '</div>';
    var loop = host.querySelector('.loop');
    var cards = host.querySelectorAll('.loop-card');
    var conns = host.querySelectorAll('.loop-conn');
    var kEl = host.querySelector('.loop-copy-who'), tEl = host.querySelector('.loop-copy-t'), dEl = host.querySelector('.loop-copy-d'), iEl = host.querySelector('.loop-copy-i'), shotEl = host.querySelector('.loop-shot');
    var cur = 0, timers = [], running = false;
    loop.style.setProperty('--ring-ms', RING_MS + 'ms');
    loop.style.setProperty('--conn-ms', CONN_MS + 'ms');

    function sizeRings() {
      cards.forEach(function (c) {
        var r = c.querySelector('rect'), w = c.offsetWidth, h = c.offsetHeight;
        r.setAttribute('x', 0.5); r.setAttribute('y', 0.5);
        r.setAttribute('width', Math.max(w - 1, 0)); r.setAttribute('height', Math.max(h - 1, 0));
        r.setAttribute('rx', 15.5);
      });
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function words(i) {
      tEl.textContent = STEPS[i].t; dEl.textContent = STEPS[i].d; iEl.textContent = i + 1;
      kEl.textContent = STEPS[i].ai ? 'AI' : 'You'; host.querySelector('.loop-copy').classList.toggle('is-ai', !!STEPS[i].ai);
      shotEl.innerHTML = STEPS[i].shot; shotEl.classList.remove('is-in'); void shotEl.offsetWidth; shotEl.classList.add('is-in');
    }
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
