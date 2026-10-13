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
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 14h54l12 12v74a6 6 0 0 1-6 6h-60a6 6 0 0 1-6-6v-80a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M86 14v12h12" stroke="#2d2a26" fill="none"/><text x="36" y="33" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">PO-0612</text><line x1="36" y1="44" x2="88" y2="44" stroke="#b3b8b3" stroke-width="1.5"/><line x1="36" y1="53" x2="88" y2="53" stroke="#b3b8b3" stroke-width="1.5"/><line x1="36" y1="62" x2="78" y2="62" stroke="#b3b8b3" stroke-width="1.5"/><path d="M108 60h26" stroke="#a88a6d"/><path d="M128 54l6 6-6 6" stroke="#a88a6d"/><rect x="146" y="40" width="66" height="44" rx="7" fill="#fbfaf7"/><path d="M146 48l33 22 33-22" /><circle cx="212" cy="40" r="8" fill="#8ea596" stroke="none"/><path d="M208.4 40l2.4 2.4 4.4 -4.8" stroke="#fbfaf7" stroke-width="2.2"/><text x="179" y="104" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#6d5641" text-anchor="middle" stroke="none">Sent to Steelmart</text></svg>' },
    { t: 'We read the supplier quote', s: 'Every line in your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 14h54l12 12v74a6 6 0 0 1-6 6h-60a6 6 0 0 1-6-6v-80a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M86 14v12h12" stroke="#2d2a26" fill="none"/><text x="36" y="33" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">Q-2290</text><line x1="36" y1="44" x2="88" y2="44" stroke="#b3b8b3" stroke-width="1.5"/><line x1="36" y1="53" x2="88" y2="53" stroke="#b3b8b3" stroke-width="1.5"/><line x1="36" y1="62" x2="78" y2="62" stroke="#b3b8b3" stroke-width="1.5"/><rect x="18" y="8" width="88" height="104" rx="10" stroke="#8ea596" stroke-dasharray="4 4" stroke-width="1.25"/><line x1="20" y1="66" x2="104" y2="66" stroke="#8ea596" stroke-width="2"/><path d="M114 60h24" stroke="#8ea596"/><path d="M132 54l6 6-6 6" stroke="#8ea596"/><rect x="148" y="26" width="70" height="14" rx="4" fill="#e9eeea" stroke="#8ea596" stroke-width="1"/><text x="183.0" y="35.5" font-family="ui-monospace,Menlo,monospace" font-size="7.5" font-weight="600" fill="#3f5d4b" text-anchor="middle" stroke="none">BLT-M12-40</text><rect x="148" y="53" width="70" height="14" rx="4" fill="#e9eeea" stroke="#8ea596" stroke-width="1"/><text x="183.0" y="62.5" font-family="ui-monospace,Menlo,monospace" font-size="7.5" font-weight="600" fill="#3f5d4b" text-anchor="middle" stroke="none">ANG-50-5</text><rect x="148" y="80" width="70" height="14" rx="4" fill="#e9eeea" stroke="#8ea596" stroke-width="1"/><text x="183.0" y="89.5" font-family="ui-monospace,Menlo,monospace" font-size="7.5" font-weight="600" fill="#3f5d4b" text-anchor="middle" stroke="none">DSC-115</text></svg>' },
    { t: 'You accept it', s: 'It becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 30h38l12 12v54a6 6 0 0 1-6 6h-44a6 6 0 0 1-6-6v-60a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M60 30v12h12" stroke="#2d2a26" fill="none"/><rect x="26" y="42" width="23.52" height="3" rx="1.5" fill="#2d2a26" stroke="none"/><line x1="26" y1="56" x2="62" y2="56" stroke="#b3b8b3" stroke-width="1.5"/><line x1="26" y1="65" x2="52" y2="65" stroke="#b3b8b3" stroke-width="1.5"/><path d="M174 30h38l12 12v54a6 6 0 0 1-6 6h-44a6 6 0 0 1-6-6v-60a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M212 30v12h12" stroke="#2d2a26" fill="none"/><rect x="178" y="42" width="23.52" height="3" rx="1.5" fill="#2d2a26" stroke="none"/><line x1="178" y1="56" x2="214" y2="56" stroke="#b3b8b3" stroke-width="1.5"/><line x1="178" y1="65" x2="204" y2="65" stroke="#b3b8b3" stroke-width="1.5"/><path d="M92 16h50l12 12v68a6 6 0 0 1-6 6h-56a6 6 0 0 1-6-6v-74a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M142 16v12h12" stroke="#2d2a26" fill="none"/><rect x="96" y="28" width="28.56" height="3" rx="1.5" fill="#2d2a26" stroke="none"/><line x1="96" y1="42" x2="144" y2="42" stroke="#b3b8b3" stroke-width="1.5"/><line x1="96" y1="51" x2="144" y2="51" stroke="#b3b8b3" stroke-width="1.5"/><line x1="96" y1="60" x2="134" y2="60" stroke="#b3b8b3" stroke-width="1.5"/><circle cx="154" cy="20" r="11" fill="#8ea596" stroke="none"/><path d="M149.05 20l3.3 3.3 6.050000000000001 -6.6" stroke="#fbfaf7" stroke-width="2.2"/><text x="120" y="114" font-family="Poppins,sans-serif" font-size="8" font-weight="600" fill="#3f5d4b" text-anchor="middle" stroke="none">Accepted</text><text x="44" y="114" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#b3b8b3" text-anchor="middle" stroke="none">R19,100</text><text x="196" y="114" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#b3b8b3" text-anchor="middle" stroke="none">R18,900</text></svg>' },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear',
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="88" y="4" width="64" height="112" rx="12" fill="#2d2a26"/><rect x="94" y="14" width="52" height="84" rx="5" fill="#fbfaf7" stroke="none"/><path d="M110 26h14l12 12v34a6 6 0 0 1-6 6h-20a6 6 0 0 1-6-6v-40a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M124 26v12h12" stroke="#2d2a26" fill="none"/><rect x="114" y="38" width="13.44" height="3" rx="1.5" fill="#2d2a26" stroke="none"/><line x1="114" y1="52" x2="126" y2="52" stroke="#b3b8b3" stroke-width="1.5"/><line x1="114" y1="61" x2="116" y2="61" stroke="#b3b8b3" stroke-width="1.5"/><path d="M100 22h8M100 22v8M140 22h-8M140 22v8M100 90h8M100 90v-8M140 90h-8M140 90v-8" stroke="#a88a6d" stroke-width="2"/><circle cx="120" cy="107" r="4" fill="#fbfaf7" stroke="none"/><path d="M30 60h40" stroke="#b3b8b3" stroke-dasharray="3 4"/><path d="M170 60h40" stroke="#b3b8b3" stroke-dasharray="3 4"/><text x="50" y="52" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#6d5641" text-anchor="middle" stroke="none">At the gate</text><text x="190" y="52" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#6d5641" text-anchor="middle" stroke="none">08:12</text></svg>' },
    { t: 'We check every line', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear', ai: true,
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M68 12h98l12 12v78a6 6 0 0 1-6 6h-104a6 6 0 0 1-6-6v-84a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M166 12v12h12" stroke="#2d2a26" fill="none"/><text x="72" y="26" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">DN 48213 vs PO-0612</text><line x1="96" y1="38" x2="142" y2="38" stroke="#b3b8b3" stroke-width="1.5"/><line x1="96" y1="56" x2="142" y2="56" stroke="#b3b8b3" stroke-width="1.5"/><line x1="96" y1="74" x2="142" y2="74" stroke="#b3b8b3" stroke-width="1.5"/><line x1="96" y1="92" x2="142" y2="92" stroke="#b3b8b3" stroke-width="1.5"/><circle cx="84" cy="38" r="6" fill="#8ea596" stroke="none"/><path d="M81.3 38l1.7999999999999998 1.7999999999999998 3.3000000000000003 -3.5999999999999996" stroke="#fbfaf7" stroke-width="2.2"/><circle cx="84" cy="56" r="6" fill="#8ea596" stroke="none"/><path d="M81.3 56l1.7999999999999998 1.7999999999999998 3.3000000000000003 -3.5999999999999996" stroke="#fbfaf7" stroke-width="2.2"/><circle cx="84" cy="74" r="6" fill="#9b3b2d" stroke="none"/><text x="84" y="76.6" font-family="Poppins,sans-serif" font-size="7.5" font-weight="700" fill="#fbfaf7" text-anchor="middle" stroke="none">!</text><circle cx="84" cy="92" r="6" fill="#a88a6d" stroke="none"/><text x="84" y="94.6" font-family="Poppins,sans-serif" font-size="7.5" font-weight="700" fill="#fbfaf7" text-anchor="middle" stroke="none">R</text><rect x="150" y="67" width="22" height="14" rx="4" fill="#f3e3df" stroke="#9b3b2d" stroke-width="1"/><text x="161.0" y="76.5" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#9b3b2d" text-anchor="middle" stroke="none">short</text><rect x="150" y="85" width="22" height="14" rx="4" fill="#efe6dc" stroke="#a88a6d" stroke-width="1"/><text x="161.0" y="94.5" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#6d5641" text-anchor="middle" stroke="none">price</text></svg>' },
    { t: 'Stock updates', s: 'Short balance stays open', icon: 'solar:box-minimalistic-linear', ai: true,
      d: 'Stock on hand and cost update in the units you count in. The two discs still owed stay open on the order. We file the photo against the movement.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="24" y1="100" x2="216" y2="100" stroke="#2d2a26" stroke-width="2.5"/><rect x="36" y="76" width="30" height="24" rx="4" fill="#fbfaf7" stroke="#2d2a26"/><rect x="70" y="76" width="30" height="24" rx="4" fill="#fbfaf7" stroke="#2d2a26"/><rect x="53" y="52" width="30" height="24" rx="4" fill="#fbfaf7" stroke="#2d2a26"/><rect x="110" y="76" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><rect x="144" y="76" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><rect x="178" y="76" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><rect x="127" y="52" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><rect x="161" y="52" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><rect x="144" y="28" width="30" height="24" rx="4" fill="#e9eeea" stroke="#8ea596"/><path d="M206 48v-26M198 30l8-8 8 8" stroke="#3f5d4b" stroke-width="2.2"/><text x="36" y="116" font-family="Poppins,sans-serif" font-size="7.5" font-weight="400" fill="#b3b8b3" text-anchor="start" stroke="none">On hand 340</text><text x="216" y="116" font-family="Poppins,sans-serif" font-size="8.5" font-weight="700" fill="#3f5d4b" text-anchor="end" stroke="none">540</text></svg>' },
    { t: 'We read the invoice', s: 'Matched to quote, order and delivery', icon: 'solar:bill-list-linear', ai: true,
      d: 'The invoice arrives by email. We read it and reconcile it line by line against the quote, the order and what the delivery note says arrived.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h34l12 12v16a6 6 0 0 1-6 6h-40a6 6 0 0 1-6-6v-22a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M50 4v12h12" stroke="#2d2a26" fill="none"/><text x="20" y="23" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">Quote</text><line x1="20" y1="31" x2="42" y2="31" stroke="#b3b8b3" stroke-width="1.5"/><path d="M16 44h34l12 12v16a6 6 0 0 1-6 6h-40a6 6 0 0 1-6-6v-22a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M50 44v12h12" stroke="#2d2a26" fill="none"/><text x="20" y="63" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">Order</text><line x1="20" y1="71" x2="42" y2="71" stroke="#b3b8b3" stroke-width="1.5"/><path d="M16 84h34l12 12v16a6 6 0 0 1-6 6h-40a6 6 0 0 1-6-6v-22a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M50 84v12h12" stroke="#2d2a26" fill="none"/><text x="20" y="103" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">Delivery</text><line x1="20" y1="111" x2="42" y2="111" stroke="#b3b8b3" stroke-width="1.5"/><path d="M64 21c20 0 22 39 42 39M64 61h42M64 101c20 0 22-39 42-39M106 60h18" stroke="#8ea596" stroke-width="1.5"/><path d="M132 14h56l12 12v74a6 6 0 0 1-6 6h-62a6 6 0 0 1-6-6v-80a6 6 0 0 1 6-6z" fill="#e9eeea" stroke="#8ea596"/><path d="M188 14v12h12" stroke="#8ea596" fill="none"/><text x="136" y="33" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">INV 1187</text><line x1="136" y1="44" x2="190" y2="44" stroke="#b3b8b3" stroke-width="1.5"/><line x1="136" y1="53" x2="190" y2="53" stroke="#b3b8b3" stroke-width="1.5"/><line x1="136" y1="62" x2="180" y2="62" stroke="#b3b8b3" stroke-width="1.5"/><circle cx="200" cy="100" r="11" fill="#8ea596" stroke="none"/><path d="M195.05 100l3.3 3.3 6.050000000000001 -6.6" stroke="#fbfaf7" stroke-width="2.2"/></svg>' },
    { t: 'You pay for what arrived', s: 'Short lines and moved prices held back', icon: 'solar:wallet-money-linear',
      d: 'The invoice goes to your accountant with the short lines and the moved price marked. You pay for what arrived at the price you were quoted, and the balance stays on record until it does.',
      shot: '<svg class="loop-art" viewBox="-10 -10 260 140" fill="none" stroke="#2d2a26" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M50 12h86l12 12v78a6 6 0 0 1-6 6h-92a6 6 0 0 1-6-6v-84a6 6 0 0 1 6-6z" fill="#fbfaf7" stroke="#2d2a26"/><path d="M136 12v12h12" stroke="#2d2a26" fill="none"/><text x="54" y="26" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#2d2a26" text-anchor="start" stroke="none">INV 1187</text><line x1="54" y1="42" x2="118" y2="42" stroke="#b3b8b3" stroke-width="1.5"/><line x1="54" y1="56" x2="118" y2="56" stroke="#b3b8b3" stroke-width="1.5"/><line x1="54" y1="70" x2="118" y2="70" stroke="#9b3b2d" stroke-width="1.5"/><line x1="50" y1="70" x2="122" y2="70" stroke="#9b3b2d" stroke-width="1"/><rect x="122" y="63" width="22" height="14" rx="4" fill="#f3e3df" stroke="#9b3b2d" stroke-width="1"/><text x="133.0" y="72.5" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#9b3b2d" text-anchor="middle" stroke="none">held</text><line x1="54" y1="90" x2="92" y2="90" stroke="#2d2a26" stroke-width="2.5"/><text x="140" y="93" font-family="Poppins,sans-serif" font-size="8.5" font-weight="700" fill="#3f5d4b" text-anchor="end" stroke="none">R18,230</text><circle cx="190" cy="56" r="20" fill="#a88a6d" stroke="none"/><circle cx="190" cy="56" r="14" stroke="#fbfaf7" stroke-width="1.25" fill="none"/><text x="190" y="61" font-family="Poppins,sans-serif" font-size="13" font-weight="700" fill="#fbfaf7" text-anchor="middle" stroke="none">R</text><text x="190" y="100" font-family="Poppins,sans-serif" font-size="7.5" font-weight="600" fill="#3f5d4b" text-anchor="middle" stroke="none">Approved</text></svg>' }
  ];
  var RING_MS = 2600, CONN_MS = 600;
  var CARD_POS = [[1, 1], [1, 3], [1, 5], [1, 7], [3, 7], [3, 5], [3, 3], [3, 1]];
  var CONN_POS = [[1, 2, 'h'], [1, 4, 'h'], [1, 6, 'h'], [2, 7, 'v'], [3, 6, 'r'], [3, 4, 'r'], [3, 2, 'r']];

  function cardHtml(st, i) {
    return '<button type="button" class="loop-card' + (st.ai ? ' is-ai' : ' is-you') + '" data-i="' + i +
      '" style="grid-row:' + CARD_POS[i][0] + ';grid-column:' + CARD_POS[i][1] + '">' +
      '<svg class="loop-ring" aria-hidden="true"><rect pathLength="1"/></svg>' +
      '<span class="loop-ci"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
      '<span class="loop-cl">' + st.t + '</span>' +
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
        '</div>' +
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
