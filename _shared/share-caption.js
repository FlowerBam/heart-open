/* Heart Open — caption + 해시태그 공유 헬퍼 (Stage 2 Foundation)
 * Source: stage_taxonomy.md §캡션/해시태그 자동 복사
 * Issue:  HEAAA-222
 *
 * navigator.share 우선 → clipboard.writeText fallback.
 * GA4 share 이벤트 (method: native|clipboard, ratio) 자동 발사.
 *
 * 사용:
 *   <script src="../_shared/share-caption.js"></script>
 *   <script>
 *     await HeartOpenShareCaption.shareWithCaption({
 *       caption:  '오늘 내 마음 한 줄: 바람 같은 하루였어 🌿',
 *       url:      'https://heart-open.app/lover-roulette',
 *       hashtags: ['하트오픈', '마음일기'],
 *       ratio:    'square',
 *       conceptId:'lover-roulette',
 *     });
 *   </script>
 *
 * 카피 가드:
 *   "최고/1위/독보적" 같은 광고 클리셰 단어가 caption 에 들어 있으면 console.warn + GA4 미발사.
 */

(function (global) {
  // ─── 광고 클리셰 lint ────────────────────────────────────
  const AD_CLICHES = [
    /최고/g,
    /1\s*위/g,
    /독보적/g,
    /국내\s*유일/g,
    /완벽/g,
  ];

  function findCliches(caption) {
    const hits = [];
    for (const re of AD_CLICHES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(caption || '')) !== null) hits.push(m[0]);
    }
    return hits;
  }

  // ─── caption 합성 ────────────────────────────────────────
  function joinHashtags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return tags.map(function (t) {
      const clean = String(t || '').trim().replace(/^#/, '');
      return clean ? '#' + clean : '';
    }).filter(Boolean).join(' ');
  }

  function composeBody(caption, url, hashtags) {
    const tagLine = joinHashtags(hashtags);
    return [caption, url, tagLine].filter(Boolean).join('\n\n');
  }

  // ─── toast ───────────────────────────────────────────────
  function showToast(msg, ms) {
    if (typeof document === 'undefined') return;
    const id = 'heart-open-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed', left: '50%', bottom: '24px',
        transform: 'translateX(-50%)',
        background: 'rgba(20,20,30,0.92)', color: '#fff',
        padding: '10px 16px', borderRadius: '999px',
        font: '14px/1.4 -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif',
        zIndex: '9999', opacity: '0',
        transition: 'opacity 200ms ease',
        pointerEvents: 'none',
        maxWidth: '90vw', textAlign: 'center',
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.style.opacity = '0'; }, ms || 1800);
  }

  // ─── GA4 ─────────────────────────────────────────────────
  function emitShareEvent(method, ratio, conceptId, extra) {
    const payload = Object.assign({
      method:     method,
      ratio:      ratio || 'square',
      concept_id: conceptId || 'unknown',
    }, extra || {});
    if (typeof global.gtag === 'function') {
      global.gtag('event', 'share', payload);
    } else if (global.HeartOpenFunnel && typeof global.HeartOpenFunnel.create === 'function' && conceptId) {
      // fallback: funnel helper 가 있으면 그쪽으로
      try { global.HeartOpenFunnel.create(conceptId).share(method, ratio, extra || {}); } catch (_) {}
    } else if (global.__HEART_OPEN_SHARE_DEBUG__) {
      // eslint-disable-next-line no-console
      console.debug('[share-caption]', 'share', payload);
    }
  }

  // ─── 본 함수 ─────────────────────────────────────────────
  /**
   * @param {Object|string} arg  객체 형태 권장. (caption, url, hashtags, ratio, conceptId, files?)
   *                             문자열이면 caption 으로 간주, 2/3번째 인자 url/hashtags.
   * @param {string} [url]
   * @param {string[]} [hashtags]
   */
  async function shareWithCaption(arg, url, hashtags) {
    const opts = (typeof arg === 'string')
      ? { caption: arg, url: url, hashtags: hashtags }
      : (arg || {});

    const caption   = String(opts.caption || '').trim();
    const link      = String(opts.url || '').trim();
    const tags      = opts.hashtags || [];
    const ratio     = opts.ratio || 'square';
    const conceptId = opts.conceptId || null;
    const files     = opts.files || null;

    const cliches = findCliches(caption);
    if (cliches.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('[share-caption] 광고 클리셰 차단:', cliches.join(', '),
        '— caption 을 수정한 뒤 다시 호출해.');
      showToast('카피를 다듬어볼까');
      return { ok: false, reason: 'ad-cliche', cliches: cliches };
    }

    const body = composeBody(caption, link, tags);

    // 1) navigator.share
    const sharePayload = { text: body };
    if (link) sharePayload.url = link;
    if (files && Array.isArray(files) && files.length > 0) sharePayload.files = files;

    const canNativeShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (!files || (typeof navigator.canShare === 'function' && navigator.canShare({ files: files })));

    if (canNativeShare) {
      try {
        await navigator.share(sharePayload);
        emitShareEvent('native', ratio, conceptId);
        return { ok: true, method: 'native' };
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { ok: false, method: 'native', reason: 'aborted' };
        }
        // fallthrough → clipboard
      }
    }

    // 2) clipboard fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(body);
      } else {
        // 구형 브라우저
        const ta = document.createElement('textarea');
        ta.value = body;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('복사했어 — 붙여넣어 공유해봐');
      emitShareEvent('clipboard', ratio, conceptId);
      return { ok: true, method: 'clipboard' };
    } catch (err) {
      showToast('복사 실패 — 길게 눌러 직접 복사해줘');
      return { ok: false, method: 'clipboard', reason: 'error', error: err };
    }
  }

  global.HeartOpenShareCaption = {
    shareWithCaption: shareWithCaption,
    composeBody: composeBody,
    joinHashtags: joinHashtags,
    showToast: showToast,
    findCliches: findCliches,
    AD_CLICHES: AD_CLICHES,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.HeartOpenShareCaption;
  }
})(typeof window !== 'undefined' ? window : globalThis);
