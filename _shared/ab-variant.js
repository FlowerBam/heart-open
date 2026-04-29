/* Heart Open — A/B Variant 빌트인 (Stage 3 Foundation)
 * Source: stage_taxonomy.md §"Stage 3 시그니처 공통 패턴" L416-428
 * Issue:  HEAAA-224
 *
 * 책임:
 *   1. assignVariant(conceptId) — sessionStorage 'ab-variant:{conceptId}' 우선,
 *      없으면 50/50 신규 부여 후 저장 + GA4 'ab_assigned' 1회 발사.
 *   2. getVariant(conceptId)    — 저장된 값만 조회 (없으면 null).
 *   3. forceVariant(conceptId, v) — QA 강제 지정 (GA4 발사 X).
 *
 * 공유 이벤트 보강 가이드 (호출 측 패턴):
 *   const v = HeartOpenAbVariant.getVariant(conceptId);
 *   gtag('event', 'share', { concept_id: conceptId, ab_variant: v });
 *
 * 사용:
 *   <script src="../_shared/ab-variant.js"></script>
 *   <script>
 *     const variant = HeartOpenAbVariant.assignVariant('lover-roulette');
 *     if (variant === 'A') renderResultV1(); else renderResultV2();
 *   </script>
 */

(function (global) {
  'use strict';

  const KEY_PREFIX = 'ab-variant:';
  const VALID = ['A', 'B'];

  function hasSession() {
    try {
      const t = '__ho_ab_probe__';
      global.sessionStorage.setItem(t, '1');
      global.sessionStorage.removeItem(t);
      return true;
    } catch (_) {
      return false;
    }
  }
  const SESSION_OK = hasSession();

  // 동일 컨셉의 ab_assigned 이벤트가 같은 페이지 라이프사이클에서 두 번 발사되지 않도록 가드.
  const assignedFiredThisPage = new Set();

  function storageKey(conceptId) {
    return KEY_PREFIX + String(conceptId || '');
  }

  function readStored(conceptId) {
    if (!SESSION_OK) return null;
    try {
      const v = global.sessionStorage.getItem(storageKey(conceptId));
      return VALID.indexOf(v) !== -1 ? v : null;
    } catch (_) {
      return null;
    }
  }

  function writeStored(conceptId, variant) {
    if (!SESSION_OK) return;
    try {
      global.sessionStorage.setItem(storageKey(conceptId), variant);
    } catch (_) { /* no-op */ }
  }

  function fireAssigned(conceptId, variant) {
    if (assignedFiredThisPage.has(conceptId)) return;
    assignedFiredThisPage.add(conceptId);
    if (typeof global.gtag === 'function') {
      try {
        global.gtag('event', 'ab_assigned', {
          concept_id: conceptId,
          variant: variant,
        });
      } catch (_) { /* no-op */ }
    }
  }

  function assignVariant(conceptId) {
    if (!conceptId) return 'A';
    const existing = readStored(conceptId);
    if (existing) return existing;
    const v = Math.random() < 0.5 ? 'A' : 'B';
    writeStored(conceptId, v);
    fireAssigned(conceptId, v);
    return v;
  }

  function getVariant(conceptId) {
    if (!conceptId) return null;
    return readStored(conceptId);
  }

  // QA용 — 강제 지정. GA4 ab_assigned 발사하지 않음(분석 오염 방지).
  function forceVariant(conceptId, variant) {
    if (!conceptId) return null;
    const v = String(variant || '').toUpperCase();
    if (VALID.indexOf(v) === -1) return null;
    writeStored(conceptId, v);
    assignedFiredThisPage.add(conceptId);
    return v;
  }

  const api = {
    assignVariant: assignVariant,
    getVariant: getVariant,
    forceVariant: forceVariant,
    KEY_PREFIX: KEY_PREFIX,
  };

  global.HeartOpenAbVariant = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
