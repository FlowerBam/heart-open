/* Heart Open — GA4 helpers
 * GA4 ID: G-2NYTV5FKDC
 * Load gtag.js in the page <head>; this file only wraps event helpers.
 *
 * 2026-04-30 (HEAAA-221): trackPageView/Start/Result/Share/CtaClick now
 * also delegate to HeartOpenFunnel (../_shared/ga4-funnel.js) so the
 * standard intro_view → game_start → mid_step → result_view → share/cta_click
 * funnel + drop_off are emitted automatically. Existing per-concept call
 * sites do not need to change.
 */

(function (global) {
  function send(event, params) {
    if (typeof global.gtag === 'function') {
      global.gtag('event', event, params || {});
    }
  }

  const funnels = Object.create(null);
  function getFunnel(conceptId, conceptName) {
    if (!conceptId || !global.HeartOpenFunnel) return null;
    if (!funnels[conceptId]) {
      try {
        funnels[conceptId] = global.HeartOpenFunnel.create(conceptId, conceptName);
      } catch (e) { return null; }
    }
    return funnels[conceptId];
  }

  function trackPageView(conceptId, conceptName) {
    send('page_view', {
      page_title: conceptName,
      page_location: location.href,
      concept_id: conceptId,
    });
    const f = getFunnel(conceptId, conceptName);
    if (f) f.intro();
  }

  function trackGameStart(conceptId, conceptName) {
    send('game_start', { concept_id: conceptId, concept_name: conceptName });
    const f = getFunnel(conceptId, conceptName);
    if (f) f.start();
  }

  function trackStep(conceptId, stepName, extra) {
    const f = getFunnel(conceptId);
    if (f) f.step(stepName, extra);
    else send('mid_step', Object.assign({ concept_id: conceptId, step: stepName }, extra || {}));
  }

  function trackResultView(conceptId, resultType, timeMs) {
    send('result_view', { concept_id: conceptId, result_type: resultType });
    const f = getFunnel(conceptId);
    if (f) f.result(resultType, timeMs);
  }

  function trackShare(conceptId, method, ratio) {
    send('share', { concept_id: conceptId, method: method, ratio: ratio });
    const f = getFunnel(conceptId);
    if (f) f.share(method, ratio);
  }

  function trackCtaClick(conceptId, destination) {
    const dest = destination || 'app_store';
    send('cta_click', { concept_id: conceptId, destination: dest });
    const f = getFunnel(conceptId);
    if (f) f.cta(dest);
  }

  function trackRetry(conceptId, attempt) {
    const f = getFunnel(conceptId);
    if (f) f.retry(attempt);
    else send('retry', { concept_id: conceptId, attempt: attempt || 1 });
  }

  const STORE_IOS     = 'https://apps.apple.com/kr/app/%ED%95%98%ED%8A%B8%EC%98%A4%ED%94%88-%EC%BB%A4%ED%94%8C-%EA%B6%81%ED%95%A9-mbti-%EC%97%B0%EC%95%A0%ED%85%8C%EC%8A%A4%ED%8A%B8/id6762368731';
  const STORE_ANDROID = 'https://play.google.com/store/apps/details?id=com.heartopen';

  function getStoreUrl() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return STORE_ANDROID;
    return STORE_IOS; // iOS + desktop → App Store
  }

  // DOMContentLoaded 후 모든 .btn-cta의 href를 스토어 링크로 교체
  document.addEventListener('DOMContentLoaded', function () {
    const url = getStoreUrl();
    document.querySelectorAll('a.btn-cta, .btn-cta[href]').forEach(function (el) {
      el.href = url;
    });
  });

  global.HeartOpenAnalytics = {
    trackPageView,
    trackGameStart,
    trackStep,
    trackResultView,
    trackShare,
    trackCtaClick,
    trackRetry,
    getStoreUrl,
  };
})(window);
