/* Heart Open — Haptic palette (Stage 1 공통)
 * Source: stage_taxonomy.md §모바일 햅틱 팔레트
 * Issue:  HEAAA-218
 *
 * navigator.vibrate 미지원 환경(iOS Safari 등)에서는 no-op.
 * 사용 가이드:
 *   - 답변 선택 → light
 *   - 정답/매칭 성공 → success
 *   - 결과 공개 (퍼센트/캐릭터 등장) → reveal
 *   - 타이머 마지막 2초 → light × 2
 *   - 오답/실수 → error
 */

(function (global) {
  function vib(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  }

  global.HeartOpenHaptic = {
    light:   function () { vib(40); },
    medium:  function () { vib(100); },
    success: function () { vib([60, 40, 60]); },
    reveal:  function () { vib(200); },
    error:   function () { vib([30, 30, 30]); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
