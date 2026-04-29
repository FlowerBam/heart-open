/* Heart Open — GA4 funnel helper (Stage 1 공통)
 * Source: stage_taxonomy.md §GA4 funnel 표준
 * Issue:  HEAAA-218
 *
 * 표준 funnel:
 *   intro_view → game_start → mid_step → result_view → share|cta_click
 * + retry / drop_off (visibilitychange 자동)
 *
 * 사용:
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-2NYTV5FKDC"></script>
 *   <script src="../_shared/ga4-funnel.js"></script>
 *   <script>
 *     const funnel = HeartOpenFunnel.create('slot-match', '연인 슬롯');
 *     funnel.intro();
 *     funnel.start();
 *     funnel.step('q1');
 *     funnel.result('emotion', 12_400);
 *     funnel.share('native', 'square');
 *     funnel.cta('app');
 *   </script>
 *
 * gtag()이 없는 환경(개발/프리뷰)에서는 console.debug로 mirror.
 */

(function (global) {
  function send(event, params) {
    const payload = params || {};
    if (typeof global.gtag === 'function') {
      global.gtag('event', event, payload);
    } else if (global.__HEART_OPEN_FUNNEL_DEBUG__) {
      // eslint-disable-next-line no-console
      console.debug('[ga4-funnel]', event, payload);
    }
  }

  function create(conceptId, conceptName) {
    if (!conceptId) throw new Error('HeartOpenFunnel.create: conceptId required');

    const state = {
      conceptId: conceptId,
      conceptName: conceptName || conceptId,
      lastStep: null,
      reachedResult: false,
      startedAt: 0,
      visListenerBound: false,
    };

    function mark(step) {
      state.lastStep = step;
    }

    function bindDropOff() {
      if (state.visListenerBound || typeof document === 'undefined') return;
      state.visListenerBound = true;
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden' && !state.reachedResult && state.lastStep) {
          send('drop_off', { concept_id: state.conceptId, last_step: state.lastStep });
        }
      });
    }

    return {
      intro: function (extra) {
        mark('intro_view');
        bindDropOff();
        send('intro_view', Object.assign({
          concept_id: state.conceptId,
          concept_name: state.conceptName,
        }, extra || {}));
      },
      start: function (extra) {
        mark('game_start');
        state.startedAt = Date.now();
        send('game_start', Object.assign({
          concept_id: state.conceptId,
        }, extra || {}));
      },
      step: function (stepName, extra) {
        mark('mid_step:' + stepName);
        send('mid_step', Object.assign({
          concept_id: state.conceptId,
          step: stepName,
        }, extra || {}));
      },
      result: function (resultType, timeMs, extra) {
        mark('result_view');
        state.reachedResult = true;
        const elapsed = typeof timeMs === 'number'
          ? timeMs
          : (state.startedAt ? Date.now() - state.startedAt : undefined);
        send('result_view', Object.assign({
          concept_id: state.conceptId,
          result_type: resultType,
          time_ms: elapsed,
        }, extra || {}));
      },
      share: function (method, ratio, extra) {
        send('share', Object.assign({
          concept_id: state.conceptId,
          method: method || 'unknown',
          ratio: ratio || 'square',
        }, extra || {}));
      },
      cta: function (destination, extra) {
        send('cta_click', Object.assign({
          concept_id: state.conceptId,
          destination: destination || 'app',
        }, extra || {}));
      },
      retry: function (attempt, extra) {
        send('retry', Object.assign({
          concept_id: state.conceptId,
          attempt: attempt || 1,
        }, extra || {}));
      },
      // Custom event passthrough (e.g. ab_assigned)
      custom: function (event, params) {
        send(event, Object.assign({ concept_id: state.conceptId }, params || {}));
      },
    };
  }

  global.HeartOpenFunnel = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
