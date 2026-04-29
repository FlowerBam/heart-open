/* Heart Open — 재방문 훅 5종 (Stage 2 Foundation)
 * Source: stage_taxonomy.md §재방문 훅 — V2 톤
 * Issue:  HEAAA-222
 *
 * 카피 규칙:
 *   - 15자 이내 (`_shared/v2-tone-lint.js` 의 result-sub 권장 길이와 동일)
 *   - V2 톤: 제안형 어미 (`~해볼까?` / `~해봐`), 명령형(`하세요`·`해라`) 금지
 *   - 광고 클리셰(`최고`·`1위`·`독보적`) 금지
 *   - 가짜 통계 금지
 *
 * 5종 패턴:
 *   tomorrow    — 내일 다시 (일일 누적/리마인드)
 *   partner     — 그 사람도 한번 (커플 리트라이)
 *   alt-ending  — 다른 결말 (재플레이 분기)
 *   friend      — 친구한테 (소셜 확산)
 *   collection  — 모으기 (컬렉션 누적)
 *
 * 사용:
 *   <script src="../_shared/revisit-hook.js"></script>
 *   <script>
 *     const hook = HeartOpenRevisit.pick('tomorrow');     // 1개 랜덤
 *     const both = HeartOpenRevisit.pick('partner', 2);   // 최대 2개
 *     HeartOpenRevisit.render({
 *       container: document.querySelector('.revisit-hooks'),
 *       hooks: ['tomorrow', 'friend'],
 *       conceptId: 'lover-roulette',
 *       onClick: (key) => goToReplay(key),
 *     });
 *   </script>
 */

(function (global) {
  // 각 키마다 1~2개 카피 (모두 15자 이내, 제안형)
  const REVISIT_HOOKS = {
    tomorrow: [
      '내일 또 해볼까?',
      '내일 다시 들러봐',
    ],
    partner: [
      '그 사람도 해볼까?',
      '둘이 같이 해봐',
    ],
    'alt-ending': [
      '다른 결말도 있어',
      '한 번 더 돌려볼까?',
    ],
    friend: [
      '친구한테 보내볼까?',
      '친구랑 같이 해봐',
    ],
    collection: [
      '다 모아볼까?',
      '오늘 한 칸 채워봐',
    ],
  };

  function _validKey(key) {
    if (!REVISIT_HOOKS[key]) {
      throw new Error('HeartOpenRevisit: 알 수 없는 hook key "' + key +
        '" — ' + Object.keys(REVISIT_HOOKS).join(' / '));
    }
  }

  /**
   * 카피 1~N개 픽 (랜덤). 중복 없이 반환.
   * @param {string} key
   * @param {number} [count=1]
   * @returns {string|string[]}  count===1 이면 string, 그 외 배열.
   */
  function pick(key, count) {
    _validKey(key);
    const pool = REVISIT_HOOKS[key].slice();
    const n = Math.max(1, Math.min(count || 1, pool.length));
    const out = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return (count && count > 1) ? out : out[0];
  }

  function emitHookView(key, conceptId) {
    if (!conceptId) return;
    if (typeof global.gtag === 'function') {
      global.gtag('event', 'revisit_hook_view', {
        concept_id: conceptId, hook: key,
      });
    }
  }

  function emitHookClick(key, conceptId) {
    if (!conceptId) return;
    if (typeof global.gtag === 'function') {
      global.gtag('event', 'revisit_hook_click', {
        concept_id: conceptId, hook: key,
      });
    }
  }

  /**
   * 결과 화면에 hook 버튼들을 렌더링.
   * @param {Object} opt
   * @param {HTMLElement} opt.container   비울 컨테이너
   * @param {string[]}    opt.hooks       표시할 hook key 배열 (순서대로)
   * @param {string}      [opt.conceptId] GA4 라벨용
   * @param {(key:string)=>void} [opt.onClick]
   * @param {string}      [opt.className='revisit-hook']
   */
  function render(opt) {
    if (!opt || !opt.container) throw new Error('HeartOpenRevisit.render: container required');
    if (!Array.isArray(opt.hooks) || opt.hooks.length === 0) {
      throw new Error('HeartOpenRevisit.render: hooks 배열이 비어있어');
    }
    const cn = opt.className || 'revisit-hook';
    opt.container.innerHTML = '';
    for (const key of opt.hooks) {
      _validKey(key);
      const copy = pick(key);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = cn;
      btn.dataset.hook = key;
      btn.textContent = copy;
      btn.addEventListener('click', function () {
        emitHookClick(key, opt.conceptId);
        if (typeof opt.onClick === 'function') opt.onClick(key, copy);
      });
      opt.container.appendChild(btn);
      emitHookView(key, opt.conceptId);
    }
  }

  global.HeartOpenRevisit = {
    REVISIT_HOOKS: REVISIT_HOOKS,
    pick: pick,
    render: render,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.HeartOpenRevisit;
  }
})(typeof window !== 'undefined' ? window : globalThis);
