/* Heart Open — prefers-reduced-motion utility (Stage 1 Should)
 * Source: stage_taxonomy.md §접근성 표준
 * Issue:  HEAAA-218
 *
 * CSS @media (prefers-reduced-motion) 와 동기화되는 JS-side 토글.
 * JS 애니메이션(타이머 카운트다운, 슬롯 회전 등)에서
 * `if (HeartOpenMotion.reduced) ...` 로 분기하여 즉시 결과를 표시한다.
 *
 * 사용:
 *   if (HeartOpenMotion.reduced) revealResultImmediately();
 *   else                          startSlotAnimation();
 *
 *   const stop = HeartOpenMotion.subscribe((reduced) => updateUi(reduced));
 *   stop(); // 구독 해제
 */

(function (global) {
  const QUERY = '(prefers-reduced-motion: reduce)';
  const supportsMatchMedia =
    typeof global.matchMedia === 'function' || typeof window !== 'undefined';

  let mql = null;
  if (supportsMatchMedia) {
    try { mql = (global.matchMedia || window.matchMedia)(QUERY); } catch (e) { mql = null; }
  }

  const listeners = new Set();

  function notify(ev) {
    const reduced = ev && typeof ev.matches === 'boolean' ? ev.matches : isReduced();
    listeners.forEach((fn) => {
      try { fn(reduced); } catch (e) { /* ignore */ }
    });
  }

  if (mql) {
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', notify);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(notify);   // Safari < 14
    }
  }

  function isReduced() {
    return !!(mql && mql.matches);
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.add(fn);
    // 즉시 1회 호출하여 현재 상태 전달
    try { fn(isReduced()); } catch (e) { /* ignore */ }
    return function unsubscribe() { listeners.delete(fn); };
  }

  /**
   * 애니메이션 길이를 reduced-motion 환경에서 0 으로 대체.
   * @param {number} normalMs
   * @returns {number}
   */
  function dur(normalMs) {
    return isReduced() ? 0 : normalMs;
  }

  global.HeartOpenMotion = {
    get reduced() { return isReduced(); },
    subscribe: subscribe,
    dur: dur,
  };
})(typeof window !== 'undefined' ? window : globalThis);
