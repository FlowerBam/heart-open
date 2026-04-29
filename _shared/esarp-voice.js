/* Heart Open — ESARP 캐릭터별 톤/색상 공통 유틸 (Stage 3 Foundation)
 * Source: stage_taxonomy.md §"Stage 3 시그니처 공통 패턴" L385-391
 * Issue:  HEAAA-224
 *
 * E/S/A/R/P 5유형 × {greeting, closing, color} 3필드.
 *
 * 사용:
 *   <script src="../_shared/esarp-voice.js"></script>
 *   <script>
 *     const { esarpVoice, pickLine, dialogLine } = HeartOpenEsarpVoice;
 *     const hello   = pickLine('E', 'greeting');             // "솔직하게 말해줘"
 *     const goodbye = pickLine('A', 'closing');              // "포근하게 안아줄게 🌙"
 *     const duet    = dialogLine('E', 'A', 50);              // 50% 비율 듀엣 카피
 *     const color   = esarpVoice.E.color;                    // '#FF6F91'
 *   </script>
 */

(function (global) {
  'use strict';

  const esarpVoice = {
    E: { greeting: '솔직하게 말해줘',     closing: '마음이 닿았어 💕',         color: '#FF6F91' },
    S: { greeting: '오늘은 어땠어?',      closing: '신나게 보내자 ✨',          color: '#FFB347' },
    A: { greeting: '괜찮아, 같이 있어',   closing: '포근하게 안아줄게 🌙',      color: '#C3B1E1' },
    R: { greeting: '특별한 날이 될 거야', closing: '설레임 가득 🌸',            color: '#FF9EC4' },
    P: { greeting: '차분히 생각해보자',   closing: '하나씩 같이 풀어가자 🌱',   color: '#82C09A' },
  };

  const VALID_TYPES = Object.keys(esarpVoice);
  const VALID_SLOTS = ['greeting', 'closing'];

  function isType(t) {
    return typeof t === 'string' && VALID_TYPES.indexOf(t.toUpperCase()) !== -1;
  }

  function pickLine(esarp, slot) {
    if (!isType(esarp)) return '';
    if (VALID_SLOTS.indexOf(slot) === -1) return '';
    return esarpVoice[esarp.toUpperCase()][slot];
  }

  // 듀엣 라인: 두 캐릭터 합성 카피 + 비율 표기.
  // pct 는 charA 의 비율(0~100). 0/100 같은 극단은 단일 보이스로 폴백.
  function dialogLine(charA, charB, pct) {
    if (!isType(charA)) return '';
    if (!isType(charB)) {
      return esarpVoice[charA.toUpperCase()].greeting;
    }
    const a = charA.toUpperCase();
    const b = charB.toUpperCase();
    const ratio = Math.max(0, Math.min(100, Number(pct) || 0));
    if (ratio >= 100) return esarpVoice[a].greeting;
    if (ratio <= 0)   return esarpVoice[b].greeting;
    if (a === b)      return esarpVoice[a].greeting;

    const lineA = esarpVoice[a].greeting;
    const lineB = esarpVoice[b].greeting;
    return lineA + ' / ' + lineB + ' · ' + a + ' ' + ratio + '% · ' + b + ' ' + (100 - ratio) + '%';
  }

  const api = {
    esarpVoice: esarpVoice,
    pickLine: pickLine,
    dialogLine: dialogLine,
    TYPES: VALID_TYPES.slice(),
  };

  global.HeartOpenEsarpVoice = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
