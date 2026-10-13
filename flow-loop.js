// The order-to-stock loop: six steps, a detail panel, and dots that run along the
// connectors. One source for Home and the Document Intake page. Renders into any
// element carrying data-flow-loop.
(function () {
  'use strict';
  var STEPS = [
    { t: 'Raise the order', s: 'Send the PO to your supplier', icon: 'solar:document-add-linear', tone: 'bronze',
      d: 'Raise a purchase order and email it from the system. What you asked for is now the thing every later document is checked against.' },
    { t: 'Quotes come back', s: 'We read them line by line', icon: 'solar:scanner-linear', tone: 'brick', ai: true,
      d: 'Quotes arrive as PDFs, emails or photos. Every line, price and quantity is read and matched to your stock codes, so three suppliers line up side by side in your words, not theirs.' },
    { t: 'Accept one', s: 'It becomes the order', icon: 'solar:check-circle-linear', tone: 'sage',
      d: 'Pick the quote that works and it becomes the firm order. Nothing is retyped.' },
    { t: 'Photograph the delivery', s: 'At the gate, on a phone', icon: 'solar:camera-linear', tone: 'brick', ai: true,
      d: 'When the truck arrives, photograph the delivery note. It is read on the spot and matched to the order, partial deliveries included.' },
    { t: 'Checked against the order', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear', tone: 'ink',
      d: 'Each line is matched to the order. A short quantity, a price that moved or a line nobody ordered is flagged for a one-tap check. Nothing is guessed.' },
    { t: 'Stock updates', s: 'Booked, with the photo on file', icon: 'solar:box-minimalistic-linear', tone: 'bronze',
      d: 'Stock on hand and cost update in the units you count in. The photo is filed against the movement, so proof of delivery is always one click away.' }
  ];
  function card(i) {
    var st = STEPS[i];
    return '<button type="button" class="flow-c' + (st.ai ? ' flow-c--ai' : '') + '" data-flow="' + i + '" aria-label="' + st.t + '">' +
      (st.ai ? '<span class="flow-tag">AI reads it</span>' : '') +
      '<span class="flow-ci flow-ci--' + st.tone + '"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
      '<span class="flow-cl">' + st.t + '</span><span class="flow-cs">' + st.s + '</span></button>';
  }
  function conn(cls) { return '<div class="flow-cn ' + cls + '"><div class="flow-cn-l"></div><div class="flow-cn-d"></div></div>'; }
  var html =
    '<div class="flow-wr"><div class="flow-ws">' +
      '<div class="flow-row">' + card(0) + conn('flow-r1c1') + card(1) + conn('flow-r1c2') + card(2) + '</div>' +
      '<div class="flow-turn"><div class="flow-turn-line"><div class="flow-turn-dot"></div></div></div>' +
      '<div class="flow-row flow-row-rev">' + card(3) + conn('flow-r2c1') + card(4) + conn('flow-r2c2') + card(5) + '</div>' +
    '</div>' +
    '<div class="flow-det" aria-live="polite"><p class="flow-det-t">The whole loop, on the paperwork you already get</p>' +
    '<p class="flow-det-d">From the purchase order to the stock on the shelf. Tap a step to see what happens.</p></div></div>';
  document.querySelectorAll('[data-flow-loop]').forEach(function (host) {
    host.innerHTML = html;
    var t = host.querySelector('.flow-det-t'), d = host.querySelector('.flow-det-d');
    var cards = host.querySelectorAll('.flow-c');
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        var st = STEPS[+c.getAttribute('data-flow')];
        t.textContent = st.t; d.textContent = st.d;
        cards.forEach(function (x) { x.classList.remove('is-active'); });
        c.classList.add('is-active');
      });
    });
  });
})();
