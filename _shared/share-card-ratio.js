/* Heart Open — share card 비율 토글 (Stage 2 Foundation)
 * Source: stage_taxonomy.md §공유 카드 viral asset (3종 비율 토글)
 * Issue:  HEAAA-222
 *
 * 3종 비율: square 1:1 (피드) / story 9:16 (스토리) / portrait 4:5 (인스타 피드)
 * html2canvas는 CDN dynamic import (skypack) — 페이지에서 사전 로드 불필요.
 *
 * 사용:
 *   <script type="module">
 *     import { SHARE_RATIOS, generateShareCard } from '../_shared/share-card-ratio.js';
 *     const dataUrl = await generateShareCard('story');   // .share-template 자동 탐색
 *   </script>
 *
 *   // 또는 globals (기존 share-card.js 와 같은 패턴):
 *   <script src="../_shared/share-card-ratio.js"></script>
 *   <script>
 *     const url = await HeartOpenShareCardRatio.generate('square');
 *   </script>
 *
 * NOTE: html2canvas CDN 의존성 — 네트워크 차단 환경에선 fallback 필요. [TODO_REVIEW]
 *       기존 `share-card.js`(UMD html2canvas 가정) 와 공존. 신규 컨셉은 본 모듈을 우선 사용.
 */

(function (global) {
  const SHARE_RATIOS = {
    square:   { w: 1080, h: 1080, label: '정사각 1:1' },
    story:    { w: 1080, h: 1920, label: '스토리 9:16' },
    portrait: { w: 1080, h: 1350, label: '인스타 4:5' },
  };

  const H2C_CDN = 'https://cdn.skypack.dev/html2canvas';
  let _h2cPromise = null;

  function loadHtml2Canvas() {
    if (typeof global.html2canvas === 'function') {
      return Promise.resolve(global.html2canvas);
    }
    if (_h2cPromise) return _h2cPromise;
    _h2cPromise = import(/* @vite-ignore */ H2C_CDN)
      .then(function (mod) {
        const fn = (mod && (mod.default || mod)) || global.html2canvas;
        if (typeof fn !== 'function') {
          throw new Error('html2canvas CDN load returned no callable export');
        }
        return fn;
      })
      .catch(function (err) {
        _h2cPromise = null;
        throw new Error('html2canvas dynamic import failed: ' + (err && err.message || err));
      });
    return _h2cPromise;
  }

  function resolveTemplate(opt) {
    if (opt && opt.element) return opt.element;
    const found = document.querySelector('.share-template');
    if (!found) {
      throw new Error('generateShareCard: .share-template DOM 노드를 찾지 못했어');
    }
    return found;
  }

  /**
   * 임시 리사이즈 → html2canvas → dataURL.
   * @param {keyof SHARE_RATIOS} ratio
   * @param {Object} [opt]
   * @param {HTMLElement} [opt.element]   기본: document.querySelector('.share-template')
   * @param {number}      [opt.scale=1]   2 = retina
   * @param {string|null} [opt.bg=null]   배경색 강제
   * @returns {Promise<string>}           data:image/png;base64,…
   */
  async function generateShareCard(ratio, opt) {
    const cfg = SHARE_RATIOS[ratio];
    if (!cfg) {
      throw new Error('generateShareCard: 알 수 없는 ratio "' + ratio +
        '" — ' + Object.keys(SHARE_RATIOS).join(' / '));
    }
    const el = resolveTemplate(opt);
    const prev = {
      width:  el.style.width,
      height: el.style.height,
      ratio:  el.getAttribute('data-ratio'),
    };
    el.style.width  = cfg.w + 'px';
    el.style.height = cfg.h + 'px';
    el.setAttribute('data-ratio', ratio);

    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(el, {
        width:  cfg.w,
        height: cfg.h,
        scale:  (opt && opt.scale) || 1,
        backgroundColor: opt && opt.bg !== undefined ? opt.bg : null,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } finally {
      el.style.width  = prev.width;
      el.style.height = prev.height;
      if (prev.ratio === null) el.removeAttribute('data-ratio');
      else                     el.setAttribute('data-ratio', prev.ratio);
    }
  }

  function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  global.HeartOpenShareCardRatio = {
    SHARE_RATIOS: SHARE_RATIOS,
    generate: generateShareCard,
    generateShareCard: generateShareCard,
    dataUrlToBlob: dataUrlToBlob,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SHARE_RATIOS: SHARE_RATIOS, generateShareCard: generateShareCard, dataUrlToBlob: dataUrlToBlob };
  }
})(typeof window !== 'undefined' ? window : globalThis);
