/* Heart Open — Stage 3 Signature 통합 로더 (Stage 3 Foundation)
 * Source: stage_taxonomy.md §"Stage 3 시그니처 공통 패턴"
 * Issue:  HEAAA-224
 *
 * Stage 3 winner 컨셉 페이지에서 한 줄로 3개 헬퍼를 모두 적재:
 *   <script src="../_shared/stage3-signature.js"></script>
 *
 * 노출 글로벌:
 *   - HeartOpenEsarpVoice  (esarp-voice.js)
 *   - HeartOpenSfx         (sfx.js)
 *   - HeartOpenAbVariant   (ab-variant.js)
 *   - HeartOpenStage3      (이 파일 — 묶음 export aggregate)
 *
 * Stage 2 의 stage2-engagement.js 와 같이, 각 컨셉에서 사용 시점에 호출.
 * 안전 가드:
 *   - sfx 토글은 기본 OFF — winner 페이지 UI 에서 토글 노출 후에만 ON.
 *   - tone.js (~150KB) 는 sfx 첫 호출 시에만 lazy-load.
 */

(function (global, doc) {
  'use strict';

  // 이미 모두 로드되어 있으면 aggregate 만 재선언하고 종료.
  function loadOnce(src, globalName) {
    if (!doc) return Promise.resolve(global[globalName]);
    if (global[globalName]) return Promise.resolve(global[globalName]);

    // 같은 src 가 이미 <script> 태그로 들어가 있으면 그 로드를 기다림.
    const existing = doc.querySelector('script[data-stage3-load="' + globalName + '"]');
    if (existing) {
      return new Promise(function (resolve) {
        if (global[globalName]) return resolve(global[globalName]);
        existing.addEventListener('load', function () { resolve(global[globalName]); });
        existing.addEventListener('error', function () { resolve(null); });
      });
    }

    return new Promise(function (resolve) {
      const s = doc.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.stage3Load = globalName;
      s.addEventListener('load', function () { resolve(global[globalName]); });
      s.addEventListener('error', function () { resolve(null); });
      doc.head.appendChild(s);
    });
  }

  // 이 파일 자체가 위치한 디렉토리를 기준으로 상대 src 결정.
  function selfDir() {
    if (!doc || !doc.currentScript || !doc.currentScript.src) {
      return '/_shared/';
    }
    const src = doc.currentScript.src;
    return src.replace(/[^/]+$/, '');
  }

  const base = selfDir();

  const ready = Promise.all([
    loadOnce(base + 'esarp-voice.js', 'HeartOpenEsarpVoice'),
    loadOnce(base + 'sfx.js',         'HeartOpenSfx'),
    loadOnce(base + 'ab-variant.js',  'HeartOpenAbVariant'),
  ]).then(function () {
    return {
      esarpVoice:  global.HeartOpenEsarpVoice  || null,
      sfx:         global.HeartOpenSfx         || null,
      abVariant:   global.HeartOpenAbVariant   || null,
    };
  });

  const api = {
    ready: ready,
    // 동기 접근 헬퍼들 — 로드 완료 후에만 유효.
    get esarpVoice() { return global.HeartOpenEsarpVoice || null; },
    get sfx()        { return global.HeartOpenSfx        || null; },
    get abVariant()  { return global.HeartOpenAbVariant  || null; },
  };

  global.HeartOpenStage3 = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
