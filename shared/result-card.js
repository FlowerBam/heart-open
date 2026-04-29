/* Heart Open — Result Card helpers
 * Requires: html2canvas (loaded via CDN in HTML)
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
 * Pairs with shared/analytics.js for share tracking.
 */

(function (global) {
  async function saveResult(selector) {
    const card = document.querySelector(selector || '.result-card');
    if (!card || typeof html2canvas !== 'function') return;
    const canvas = await html2canvas(card, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = 'heart-open-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function shareResult(opts) {
    const conceptId = (opts && opts.conceptId) || '';
    const title = (opts && opts.title) || 'Heart Open 결과';
    const url = (opts && opts.url) || location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        if (global.HeartOpenAnalytics) {
          global.HeartOpenAnalytics.trackShare(conceptId, 'native');
        }
        return 'native';
      } catch (_) {
        // user cancelled or unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('링크 복사됨 💕');
      if (global.HeartOpenAnalytics) {
        global.HeartOpenAnalytics.trackShare(conceptId, 'clipboard');
      }
      return 'clipboard';
    } catch (_) {
      alert('공유에 실패했어요. 주소창을 복사해줘 💕');
      return 'failed';
    }
  }

  global.HeartOpenResultCard = { saveResult, shareResult };
  // Backwards-compat globals matching the boilerplate
  global.saveResult = saveResult;
  global.shareResult = function () { return shareResult({}); };
})(window);
