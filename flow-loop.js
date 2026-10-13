// The order-to-stock loop: six steps down the right, the words for the step
// you are on down the left. One source for Home and the Document Intake page.
// Renders into any element carrying data-flow-loop. Steps advance on their own
// every few seconds and stop the moment somebody clicks or hovers.
(function () {
  'use strict';
  var STEPS = [
    { t: 'Raise the purchase order', s: 'Sent to the supplier from the system', icon: 'solar:document-add-linear',
      d: 'You raise the order and email it from the system. From here on we check every document the supplier sends against this order.' },
    { t: 'We read the supplier quote', s: 'Every line matched to your codes', icon: 'solar:scanner-linear', ai: true,
      d: 'The quote comes in as a PDF, an email or a photo. We read every line, price and quantity and match it to your stock codes and units.' },
    { t: 'You accept it', s: 'The quote becomes the order', icon: 'solar:check-circle-linear',
      d: 'Accept the quote and it becomes the firm order. Nothing is retyped.' },
    { t: 'Photograph the delivery note', s: 'At the gate, on a phone', icon: 'solar:camera-linear', ai: true,
      d: 'When the truck arrives, photograph the delivery note. We read it on the spot and match it to the order. We book partial deliveries as partial.' },
    { t: 'We check every line against the order', s: 'Short lines and moved prices flagged', icon: 'solar:checklist-minimalistic-linear',
      d: 'We flag a short quantity, a price that moved or a line nobody ordered for a one-tap check. We guess nothing.' },
    { t: 'Stock updates', s: 'Booked with the photo on file', icon: 'solar:box-minimalistic-linear',
      d: 'Stock on hand and cost update in the units you count in. We file the photo against the movement as proof of delivery.' }
  ];
  var MS = 4000;
  document.querySelectorAll('[data-flow-loop]').forEach(function (host) {
    host.innerHTML =
      '<div class="loop">' +
        '<div class="loop-copy"><p class="loop-copy-k">Step <span class="loop-copy-i">1</span> of ' + STEPS.length + '</p>' +
        '<h3 class="loop-copy-t"></h3><p class="loop-copy-d"></p><p class="loop-copy-n">Click a step to read it.</p></div>' +
        '<ol class="loop-steps">' + STEPS.map(function (st, i) {
          return '<li><button type="button" class="loop-step' + (st.ai ? ' is-ai' : '') + '" data-i="' + i + '">' +
            '<span class="loop-ci"><iconify-icon icon="' + st.icon + '"></iconify-icon></span>' +
            '<span><span class="loop-cl">' + st.t + (st.ai ? '<span class="loop-ai">AI</span>' : '') + '</span>' +
            '<span class="loop-cs">' + st.s + '</span></span><span class="loop-bar"></span></button></li>';
        }).join('') + '</ol>' +
      '</div>';
    var loop = host.querySelector('.loop');
    var btns = host.querySelectorAll('.loop-step');
    var tEl = host.querySelector('.loop-copy-t'), dEl = host.querySelector('.loop-copy-d'), iEl = host.querySelector('.loop-copy-i');
    var cur = 0, timer = null;
    loop.style.setProperty('--loop-ms', MS + 'ms');
    function show(i) {
      cur = i;
      btns.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
      tEl.textContent = STEPS[i].t; dEl.textContent = STEPS[i].d; iEl.textContent = i + 1;
    }
    function start() { stop(); timer = setInterval(function () { show((cur + 1) % STEPS.length); }, MS); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { stop(); loop.classList.add('is-paused'); show(+b.getAttribute('data-i')); });
    });
    loop.addEventListener('mouseenter', function () { stop(); loop.classList.add('is-paused'); });
    loop.addEventListener('mouseleave', function () { loop.classList.remove('is-paused'); start(); });
    show(0);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });
})();
