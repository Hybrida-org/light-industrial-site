// The "i" bubbles beside the calculator's slider labels.
//
// Kept out of calculator.js on purpose: that file is the arithmetic, this is
// presentation, and the two change for different reasons.
//
// Hover alone would strand phone users, so the "i" is a real button — hover
// opens it on a mouse, tap opens it on a touch screen, and keyboard focus is
// handled in CSS (:focus-visible) so it cannot fight the click handler here.

(function () {
  'use strict';

  var wraps = [].slice.call(document.querySelectorAll('.roi-info-wrap'));
  if (!wraps.length) return;

  var openWrap = null;

  function open(wrap) {
    if (openWrap && openWrap !== wrap) close(openWrap);
    wrap.classList.add('is-open');
    wrap.querySelector('.roi-info').setAttribute('aria-expanded', 'true');
    openWrap = wrap;
    keepOnScreen(wrap);
  }

  function close(wrap) {
    wrap.classList.remove('is-open');
    wrap.querySelector('.roi-info').setAttribute('aria-expanded', 'false');
    if (openWrap === wrap) openWrap = null;
  }

  // A centred bubble runs past the edge of the panel on the narrow layout, so
  // measure it once per open and pin it to that side when it would.
  //
  // Measured against the nearest ancestor that clips rather than the viewport:
  // the outer .roi-frame still hides its overflow, and it is the thing that
  // would actually cut the bubble off. Falls back to the viewport if no such
  // ancestor exists.
  function clipBounds(el) {
    for (var n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (getComputedStyle(n).overflow !== 'visible') return n.getBoundingClientRect();
    }
    return { left: 0, right: window.innerWidth };
  }

  function keepOnScreen(wrap) {
    wrap.classList.remove('tip-left');
    var tip = wrap.querySelector('.roi-tip');
    var box = tip.getBoundingClientRect();
    var limit = clipBounds(tip);
    if (box.right > limit.right - 8 || box.left < limit.left + 8) wrap.classList.add('tip-left');
  }

  var canHover = window.matchMedia('(hover: hover)').matches;

  wraps.forEach(function (wrap) {
    wrap.querySelector('.roi-info').addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) close(wrap); else open(wrap);
    });

    if (canHover) {
      wrap.addEventListener('mouseenter', function () { open(wrap); });
      wrap.addEventListener('mouseleave', function () { close(wrap); });
    }
  });

  document.addEventListener('click', function () { if (openWrap) close(openWrap); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openWrap) close(openWrap);
  });
})();
