/* Heart Open — GA4 helpers
 * GA4 ID: G-2NYTV5FKDC
 * Load gtag.js in the page <head>; this file only wraps event helpers.
 */

(function (global) {
  function send(event, params) {
    if (typeof global.gtag === 'function') {
      global.gtag('event', event, params || {});
    }
  }

  function trackPageView(conceptId, conceptName) {
    send('page_view', {
      page_title: conceptName,
      page_location: location.href,
      concept_id: conceptId,
    });
  }

  function trackGameStart(conceptId, conceptName) {
    send('game_start', { concept_id: conceptId, concept_name: conceptName });
  }

  function trackResultView(conceptId, resultType) {
    send('result_view', { concept_id: conceptId, result_type: resultType });
  }

  function trackShare(conceptId, method) {
    send('share', { concept_id: conceptId, method: method });
  }

  function trackCtaClick(conceptId, destination) {
    send('cta_click', { concept_id: conceptId, destination: destination || 'app_store' });
  }

  global.HeartOpenAnalytics = {
    trackPageView,
    trackGameStart,
    trackResultView,
    trackShare,
    trackCtaClick,
  };
})(window);
