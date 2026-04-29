/* Heart Open — SFX (Tone.js lazy-load) 공통 헬퍼 (Stage 3 Foundation)
 * Source: stage_taxonomy.md §"Stage 3 시그니처 공통 패턴" L394-410
 * Issue:  HEAAA-224
 *
 * 사용 원칙 (안전 가드):
 *   1. 사용자 토글 OFF 가 기본값. 토글 OFF 면 playSfx 즉시 return.
 *   2. autoplay 절대 금지. 첫 사용자 액션(click/touch/keydown) 후에만 동작.
 *   3. tone.js (~150KB) 는 첫 호출 시에만 dynamic import (Stage 3 winners 5개 한정).
 *   4. 토글 상태는 localStorage 'heart-open:sfx:enabled' (값 '1' = ON).
 *
 * 사용:
 *   <script src="../_shared/sfx.js"></script>
 *   <script>
 *     // UI 토글 버튼에서:
 *     HeartOpenSfx.setEnabled(true);
 *     // 결과 reveal 시점에:
 *     HeartOpenSfx.playSfx('reveal');
 *   </script>
 *
 * 노트맵:
 *   chime  : C5 / 8n
 *   pop    : E5 / 16n
 *   reveal : G5 / 4n
 */

(function (global) {
  'use strict';

  const ENABLED_KEY = 'heart-open:sfx:enabled';
  const TONE_URL = 'https://cdn.skypack.dev/tone';

  const NOTE_MAP = {
    chime:  { note: 'C5', dur: '8n'  },
    pop:    { note: 'E5', dur: '16n' },
    reveal: { note: 'G5', dur: '4n'  },
  };

  let toneRef = null;       // dynamic import 결과 캐시
  let synthRef = null;      // 재사용 synth
  let userInteracted = false;

  function hasStorage() {
    try {
      global.localStorage.getItem(ENABLED_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }
  const STORAGE_OK = hasStorage();

  function isEnabled() {
    if (!STORAGE_OK) return false;
    try {
      return global.localStorage.getItem(ENABLED_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function setEnabled(on) {
    if (!STORAGE_OK) return;
    try {
      if (on) global.localStorage.setItem(ENABLED_KEY, '1');
      else    global.localStorage.removeItem(ENABLED_KEY);
    } catch (_) { /* no-op */ }
  }

  function markInteracted() {
    userInteracted = true;
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', markInteracted, true);
      document.removeEventListener('keydown',     markInteracted, true);
      document.removeEventListener('touchstart',  markInteracted, true);
    }
  }

  if (typeof document !== 'undefined') {
    // autoplay 방지 — 첫 사용자 액션을 한 번만 기록.
    document.addEventListener('pointerdown', markInteracted, true);
    document.addEventListener('keydown',     markInteracted, true);
    document.addEventListener('touchstart',  markInteracted, true);
  }

  async function loadTone() {
    if (toneRef) return toneRef;
    try {
      // eslint-disable-next-line no-new-func
      const mod = await new Function('u', 'return import(u)')(TONE_URL);
      toneRef = mod.default || mod;
      return toneRef;
    } catch (e) {
      toneRef = null;
      return null;
    }
  }

  async function playSfx(type) {
    // 가드 1: 토글 OFF
    if (!isEnabled()) return;
    // 가드 2: autoplay 차단
    if (!userInteracted) return;
    // 가드 3: 알 수 없는 타입
    const map = NOTE_MAP[type];
    if (!map) return;

    const Tone = await loadTone();
    if (!Tone) return;

    try {
      if (Tone.start && Tone.context && Tone.context.state !== 'running') {
        await Tone.start();
      }
      if (!synthRef) {
        synthRef = new Tone.Synth().toDestination();
      }
      synthRef.triggerAttackRelease(map.note, map.dur);
    } catch (_) {
      // 오디오 컨텍스트 차단/실패 — silently no-op
    }
  }

  const api = {
    playSfx: playSfx,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    NOTE_MAP: NOTE_MAP,
    ENABLED_KEY: ENABLED_KEY,
  };

  global.HeartOpenSfx = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
