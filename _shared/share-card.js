/* Heart Open — html2canvas 비율 토글 헬퍼 (Stage 1 Should)
 * Source: stage_taxonomy.md §공유 카드 비율 토글
 * Issue:  HEAAA-218
 *
 * 3종 비율: square (1:1), story (9:16), portrait (4:5)
 * html2canvas는 페이지에서 별도로 로드해야 한다 (UMD 또는 dynamic import).
 *
 * 사용:
 *   <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
 *   <script src="../_shared/share-card.js"></script>
 *   <script>
 *     const dataUrl = await HeartOpenShareCard.render({
 *       element: document.querySelector('.share-template'),
 *       ratio:   'story',
 *     });
 *   </script>
 */

(function (global) {
  const RATIOS = {
    square:   { w: 1080, h: 1080, label: '정사각 (피드)' },
    story:    { w: 1080, h: 1920, label: '스토리 (9:16)' },
    portrait: { w: 1080, h: 1350, label: '인스타 피드 (4:5)' },
  };

  function resolveH2C() {
    if (typeof global.html2canvas === 'function') return global.html2canvas;
    throw new Error(
      'html2canvas not loaded. Add <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>'
    );
  }

  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.element  공유 카드 루트 (display된 상태)
   * @param {keyof RATIOS} [opts.ratio='square']
   * @param {number}  [opts.scale=1]    Retina 결과 원하면 2
   * @param {string}  [opts.bg=null]    background-color override
   * @returns {Promise<string>}         data:image/png;base64,…
   */
  async function render(opts) {
    const ratio = (opts && opts.ratio) || 'square';
    const config = RATIOS[ratio];
    if (!config) throw new Error(`Unknown ratio: ${ratio}. Use one of ${Object.keys(RATIOS).join(', ')}`);
    if (!opts || !opts.element) throw new Error('render: element required');

    const el = opts.element;
    const prev = {
      width:  el.style.width,
      height: el.style.height,
      dataRatio: el.getAttribute('data-ratio'),
    };
    el.style.width  = config.w + 'px';
    el.style.height = config.h + 'px';
    el.setAttribute('data-ratio', ratio);

    try {
      const html2canvas = resolveH2C();
      const canvas = await html2canvas(el, {
        width: config.w,
        height: config.h,
        scale: opts.scale || 1,
        backgroundColor: opts.bg !== undefined ? opts.bg : null,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } finally {
      el.style.width  = prev.width;
      el.style.height = prev.height;
      if (prev.dataRatio === null) el.removeAttribute('data-ratio');
      else                          el.setAttribute('data-ratio', prev.dataRatio);
    }
  }

  /**
   * data URL → Blob (Web Share API file 첨부용).
   */
  function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  global.HeartOpenShareCard = {
    RATIOS: RATIOS,
    render: render,
    dataUrlToBlob: dataUrlToBlob,
  };
})(typeof window !== 'undefined' ? window : globalThis);
