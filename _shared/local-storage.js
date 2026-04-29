/* Heart Open — localStorage 표준 키 헬퍼 (Stage 2 Foundation)
 * Source: stage_taxonomy.md §localStorage 누적 활용
 * Issue:  HEAAA-222
 *
 * 키 컨벤션:
 *   heart-open:{conceptId}:{purpose}
 *   예) heart-open:lover-roulette:daily-count
 *       heart-open:type-collection:items
 *
 * 사용:
 *   <script src="../_shared/local-storage.js"></script>
 *   <script>
 *     const { lsKey, lsGet, lsSet, lsBump, lsAppend } = HeartOpenLS;
 *     const k = lsKey('lover-roulette', 'daily-count');     // 'heart-open:lover-roulette:daily-count'
 *     lsBump(k);                                            // 1 → 2 → 3 …
 *     lsAppend(lsKey('type-collection', 'items'), 'E');     // ['E']
 *     const list = lsGet(lsKey('type-collection','items'), []);
 *   </script>
 *
 * 모든 헬퍼는 storage 비활성(Safari Private 등) 환경에서 silently no-op + fallback 반환.
 */

(function (global) {
  const PREFIX = 'heart-open';

  function hasStorage() {
    try {
      const t = '__ho_probe__';
      global.localStorage.setItem(t, '1');
      global.localStorage.removeItem(t);
      return true;
    } catch (_) {
      return false;
    }
  }

  const STORAGE_OK = hasStorage();

  function lsKey(conceptId, purpose) {
    if (!conceptId) throw new Error('lsKey: conceptId required');
    if (!purpose)   throw new Error('lsKey: purpose required');
    return PREFIX + ':' + conceptId + ':' + purpose;
  }

  function lsGet(key, fallback) {
    if (!STORAGE_OK) return (fallback !== undefined ? fallback : null);
    try {
      const raw = global.localStorage.getItem(key);
      if (raw === null) return (fallback !== undefined ? fallback : null);
      try { return JSON.parse(raw); } catch (_) { return raw; }
    } catch (_) {
      return (fallback !== undefined ? fallback : null);
    }
  }

  function lsSet(key, value) {
    if (!STORAGE_OK) return false;
    try {
      const raw = (typeof value === 'string') ? value : JSON.stringify(value);
      global.localStorage.setItem(key, raw);
      return true;
    } catch (_) {
      return false;
    }
  }

  function lsRemove(key) {
    if (!STORAGE_OK) return false;
    try { global.localStorage.removeItem(key); return true; } catch (_) { return false; }
  }

  /**
   * 정수 카운터 +delta (default 1). 반환: 새 값.
   */
  function lsBump(key, delta) {
    const inc = (typeof delta === 'number') ? delta : 1;
    const cur = lsGet(key, 0);
    const n = (typeof cur === 'number' && Number.isFinite(cur)) ? cur : Number(cur) || 0;
    const next = n + inc;
    lsSet(key, next);
    return next;
  }

  /**
   * 배열에 push (없으면 새 배열). 반환: 새 배열.
   * @param {boolean} [opt.unique]  true 면 이미 있는 값 스킵.
   * @param {number}  [opt.cap]     배열 최대 길이 (앞에서 shift).
   */
  function lsAppend(key, value, opt) {
    const o = opt || {};
    const cur = lsGet(key, []);
    const arr = Array.isArray(cur) ? cur.slice() : [];
    if (o.unique && arr.indexOf(value) !== -1) {
      return arr;
    }
    arr.push(value);
    if (typeof o.cap === 'number' && o.cap > 0) {
      while (arr.length > o.cap) arr.shift();
    }
    lsSet(key, arr);
    return arr;
  }

  /**
   * 일일 카운터: 오늘 날짜(YYYY-MM-DD) 가 바뀌면 0 으로 리셋한 뒤 +1.
   * 반환: { count, date, isFirstToday }.
   */
  function lsDailyBump(conceptId, purpose) {
    const k = lsKey(conceptId, purpose);
    const today = new Date().toISOString().slice(0, 10);
    const cur = lsGet(k, { date: null, count: 0 });
    const isNewDay = !cur || cur.date !== today;
    const next = {
      date: today,
      count: (isNewDay ? 0 : (cur.count || 0)) + 1,
    };
    lsSet(k, next);
    return { count: next.count, date: today, isFirstToday: isNewDay };
  }

  global.HeartOpenLS = {
    PREFIX: PREFIX,
    available: STORAGE_OK,
    lsKey: lsKey,
    lsGet: lsGet,
    lsSet: lsSet,
    lsRemove: lsRemove,
    lsBump: lsBump,
    lsAppend: lsAppend,
    lsDailyBump: lsDailyBump,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.HeartOpenLS;
  }
})(typeof window !== 'undefined' ? window : globalThis);
