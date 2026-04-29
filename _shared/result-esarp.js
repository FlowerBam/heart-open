/* Heart Open — Auto-tag .result-card[data-esarp] from character image src
 * Source: stage_taxonomy.md §결과 카드 ESARP 그라디언트
 * Issue:  HEAAA-220
 *
 * 사용:
 *   <script src="../_shared/result-esarp.js" defer></script>
 *
 *   각 컨셉이 .result-card 안의 <img>의 src를
 *   /assets/characters/{emotion|social|attachment|romantic|practical}.png 로 세팅하면
 *   이 helper가 자동으로 data-esarp=E/S/A/R/P 를 붙여서 tokens.css의
 *   .result-card[data-esarp="E"] 그라디언트가 적용된다.
 *
 *   수동 컨트롤이 필요하면 직접 setAttribute('data-esarp', 'X') 해도 됨.
 *   기존 data-esarp가 있으면 helper는 덮어쓰지 않는다 (manual 우선).
 */
(function () {
  'use strict';

  var FILE_MAP = {
    emotion:    'E',
    social:     'S',
    attachment: 'A',
    romantic:   'R',
    practical:  'P'
  };

  function inferEsarp(src) {
    if (!src) return null;
    for (var key in FILE_MAP) {
      if (src.indexOf(key) !== -1) return FILE_MAP[key];
    }
    return null;
  }

  function tagFromImg(card) {
    if (card.getAttribute('data-esarp')) return; // manual override
    var img = card.querySelector('img');
    if (!img) return;
    var letter = inferEsarp(img.getAttribute('src'));
    if (letter) card.setAttribute('data-esarp', letter);
  }

  function clearIfImageReset(card) {
    var img = card.querySelector('img');
    if (!img || !img.getAttribute('src')) {
      if (card.dataset.esarpAuto === 'true') card.removeAttribute('data-esarp');
    }
  }

  function attach(card) {
    tagFromImg(card);
    var img = card.querySelector('img');
    if (!img || !window.MutationObserver) return;
    var obs = new MutationObserver(function () {
      var prior = card.getAttribute('data-esarp');
      // Only refresh if we set it (auto), not if user-set
      if (prior && card.dataset.esarpAuto !== 'true') return;
      var letter = inferEsarp(img.getAttribute('src'));
      if (letter) {
        card.setAttribute('data-esarp', letter);
        card.dataset.esarpAuto = 'true';
      }
    });
    obs.observe(img, { attributes: true, attributeFilter: ['src'] });
  }

  function init() {
    var cards = document.querySelectorAll('.result-card');
    for (var i = 0; i < cards.length; i++) attach(cards[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HeartOpenResultESARP = {
    tag: tagFromImg,
    infer: inferEsarp
  };
})();
