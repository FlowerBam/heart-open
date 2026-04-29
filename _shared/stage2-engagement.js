/* Heart Open — Stage 2 Engagement 통합 헬퍼
 * Source: HEAAA-223 Bulk 20 컨셉 적용
 * Depends on: share-card-ratio.js · share-caption.js · revisit-hook.js · local-storage.js
 *
 * 자동 동작 (DOMContentLoaded):
 *   1. <body data-concept-id="…" data-concept-name="…"> 또는 #stage2-engagement 메타 태그를 읽어 컨텍스트 결정.
 *   2. .result-card (또는 [data-share-template]) 요소가 있으면:
 *        - .share-template 클래스 보장 (share-card-ratio 가 querySelector('.share-template') 으로 찾음).
 *        - 결과 영역 안에 비율 토글 UI 자동 마운트 (없으면 생성).
 *        - data-revisit-hooks="tomorrow,partner" 형태로 hook 자동 마운트.
 *        - #btn-share 클릭을 가로채 shareWithCaption + generate 로 교체.
 *
 * 페이지에서 비활성:
 *   <body data-stage2-disable="1"> 또는 명시적으로 호출 금지하려면 data-stage2-engagement="manual".
 *
 * 수동 호출:
 *   HeartOpenStage2.mount({ conceptId, conceptName, hooks, captionFn, hashtags, … })
 */
(function (global) {
  'use strict';
  if (global.HeartOpenStage2 && global.HeartOpenStage2.__mounted) return;

  const RATIO_LABELS = {
    square: '정사각',
    story:  '스토리',
    portrait: '인스타',
  };
  const DEFAULT_RATIOS = ['square', 'story', 'portrait'];

  function ensureShareTemplate(card) {
    if (!card) return;
    if (!card.classList.contains('share-template')) {
      card.classList.add('share-template');
    }
  }

  function injectStyles() {
    if (document.getElementById('stage2-engagement-style')) return;
    const css = `
      .stage2-ratio-toggle {
        display: flex; gap: 8px; justify-content: center;
        margin: 12px auto 8px; flex-wrap: wrap;
      }
      .stage2-ratio-toggle button {
        background: rgba(255,255,255,0.6);
        border: 1px solid rgba(0,0,0,0.08);
        padding: 6px 12px;
        font-size: 12px; font-weight: 600;
        border-radius: 999px;
        color: #1a1a1a;
        transition: background 160ms ease, transform 120ms ease;
      }
      .stage2-ratio-toggle button[aria-pressed="true"] {
        background: #1a1a1a; color: #fff;
      }
      .stage2-ratio-toggle button:active { transform: scale(0.96); }
      .stage2-revisit-hooks {
        display: flex; gap: 8px; justify-content: center;
        margin: 14px auto 4px; flex-wrap: wrap;
      }
      .stage2-revisit-hooks .revisit-hook {
        background: transparent;
        border: 1px solid rgba(0,0,0,0.18);
        padding: 8px 14px;
        font-size: 13px; font-weight: 600;
        border-radius: 999px;
        color: #1a1a1a;
      }
      .stage2-revisit-hooks .revisit-hook:active { transform: scale(0.97); }
      @media (prefers-color-scheme: dark) {
        .stage2-ratio-toggle button { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.18); }
        .stage2-ratio-toggle button[aria-pressed="true"] { background: #fff; color: #1a1a1a; }
        .stage2-revisit-hooks .revisit-hook { color: #fff; border-color: rgba(255,255,255,0.32); }
      }
    `;
    const tag = document.createElement('style');
    tag.id = 'stage2-engagement-style';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function buildRatioToggle(state) {
    const wrap = document.createElement('div');
    wrap.className = 'stage2-ratio-toggle';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', '공유 카드 비율 선택');
    state.ratios.forEach(function (r) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-pressed', r === state.ratio ? 'true' : 'false');
      b.dataset.ratio = r;
      b.textContent = RATIO_LABELS[r] || r;
      b.addEventListener('click', function () {
        state.ratio = r;
        wrap.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('aria-pressed', x.dataset.ratio === r ? 'true' : 'false');
        });
        if (typeof global.gtag === 'function' && state.conceptId) {
          global.gtag('event', 'share_ratio_select', {
            concept_id: state.conceptId, ratio: r,
          });
        }
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function buildHooksContainer() {
    const wrap = document.createElement('div');
    wrap.className = 'stage2-revisit-hooks';
    return wrap;
  }

  function parseHookList(value) {
    if (!value) return [];
    return String(value).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function readDataset() {
    const body = document.body;
    const conceptId = body.dataset.conceptId || (document.querySelector('meta[name="concept-id"]') || {}).content || '';
    const conceptName = body.dataset.conceptName || (document.querySelector('meta[name="concept-name"]') || {}).content || conceptId;
    const hooks = parseHookList(body.dataset.revisitHooks);
    const hashtags = parseHookList(body.dataset.shareHashtags);
    const ratiosRaw = parseHookList(body.dataset.shareRatios);
    return {
      conceptId: conceptId,
      conceptName: conceptName,
      hooks: hooks,
      hashtags: hashtags.length ? hashtags : ['하트오픈', conceptId ? conceptId.replace(/[^a-zA-Z0-9가-힣]/g, '') : ''].filter(Boolean),
      ratios: ratiosRaw.length ? ratiosRaw : DEFAULT_RATIOS,
    };
  }

  function defaultCaption(ctx) {
    const title = (document.getElementById('result-title') || {}).textContent || '';
    const desc  = (document.getElementById('result-desc')  || {}).textContent || '';
    const lines = [];
    if (title) lines.push(title.trim());
    if (desc)  lines.push(desc.trim().slice(0, 60));
    if (lines.length === 0 && ctx.conceptName) lines.push(ctx.conceptName + ' 결과');
    return lines.join(' — ');
  }

  function pickHook(key) {
    if (!global.HeartOpenRevisit || !global.HeartOpenRevisit.REVISIT_HOOKS[key]) return null;
    const pool = global.HeartOpenRevisit.REVISIT_HOOKS[key];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function mount(opts) {
    opts = opts || {};
    const ctx = Object.assign(readDataset(), opts);

    if (document.body.dataset.stage2Disable === '1') return;

    const card = opts.card || document.querySelector('[data-share-template]') || document.getElementById('result-card') || document.querySelector('.result-card');
    if (!card) return;

    ensureShareTemplate(card);
    injectStyles();

    // Mount ratio toggle inside the result section (after .result-actions if present)
    const resultRoot = card.parentElement || card;
    const state = {
      ratio: 'square',
      ratios: ctx.ratios || DEFAULT_RATIOS,
      conceptId: ctx.conceptId,
    };

    let toggle = resultRoot.querySelector('.stage2-ratio-toggle');
    if (!toggle) {
      toggle = buildRatioToggle(state);
      const actions = card.querySelector('.result-actions') || card.querySelector('[data-result-actions]');
      if (actions && actions.parentElement) {
        actions.parentElement.insertBefore(toggle, actions.nextSibling);
      } else {
        card.appendChild(toggle);
      }
    }

    // Mount revisit hooks
    if (ctx.hooks && ctx.hooks.length && global.HeartOpenRevisit) {
      let hookEl = resultRoot.querySelector('.stage2-revisit-hooks');
      if (!hookEl) {
        hookEl = buildHooksContainer();
        if (toggle && toggle.parentElement) {
          toggle.parentElement.insertBefore(hookEl, toggle.nextSibling);
        } else {
          card.appendChild(hookEl);
        }
      }
      try {
        global.HeartOpenRevisit.render({
          container: hookEl,
          hooks: ctx.hooks.filter(function (k) { return !!global.HeartOpenRevisit.REVISIT_HOOKS[k]; }),
          conceptId: ctx.conceptId,
          onClick: function (key) {
            if (typeof opts.onHook === 'function') opts.onHook(key);
            if (typeof global.HeartOpenStage2.onHook === 'function') global.HeartOpenStage2.onHook(key, ctx);
          },
        });
      } catch (e) {
        // hook copy 비어있거나 키 잘못된 경우 silently
      }
    }

    // Re-wire share button
    const btnShare = document.getElementById('btn-share');
    if (btnShare && global.HeartOpenShareCaption) {
      const newBtn = btnShare.cloneNode(true);
      btnShare.parentNode.replaceChild(newBtn, btnShare);
      newBtn.addEventListener('click', async function (ev) {
        ev.preventDefault();
        const caption = (typeof opts.captionFn === 'function')
          ? opts.captionFn(state, ctx)
          : defaultCaption(ctx);
        let files = null;
        try {
          if (global.HeartOpenShareCardRatio) {
            const dataUrl = await global.HeartOpenShareCardRatio.generate(state.ratio, { element: card, scale: 1 });
            const blob = global.HeartOpenShareCardRatio.dataUrlToBlob(dataUrl);
            files = [new File([blob], 'heart-open-' + (ctx.conceptId || 'share') + '.png', { type: 'image/png' })];
          }
        } catch (e) {
          // 이미지 합성 실패 → caption only fallback
        }
        await global.HeartOpenShareCaption.shareWithCaption({
          caption: caption,
          url: location.href,
          hashtags: ctx.hashtags,
          ratio: state.ratio,
          conceptId: ctx.conceptId,
          files: files,
        });
      });
    }

    // Re-wire save button to use the chosen ratio
    const btnSave = document.getElementById('btn-save');
    if (btnSave && global.HeartOpenShareCardRatio) {
      const newSave = btnSave.cloneNode(true);
      btnSave.parentNode.replaceChild(newSave, btnSave);
      newSave.addEventListener('click', async function (ev) {
        ev.preventDefault();
        try {
          const dataUrl = await global.HeartOpenShareCardRatio.generate(state.ratio, { element: card, scale: 2 });
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'heart-open-' + (ctx.conceptId || 'result') + '-' + state.ratio + '.png';
          a.click();
          if (typeof global.gtag === 'function' && ctx.conceptId) {
            global.gtag('event', 'share_card_save', {
              concept_id: ctx.conceptId, ratio: state.ratio,
            });
          }
        } catch (e) {
          // fallback 기존 saveResult
          if (global.HeartOpenResultCard && typeof global.HeartOpenResultCard.saveResult === 'function') {
            try { await global.HeartOpenResultCard.saveResult('#' + card.id); } catch (_) {}
          }
        }
      });
    }

    global.HeartOpenStage2.__mounted = true;
    global.HeartOpenStage2.state = state;
    global.HeartOpenStage2.ctx = ctx;
  }

  function autoMount() {
    if (document.body && document.body.dataset.stage2Engagement === 'manual') return;
    mount();
  }

  global.HeartOpenStage2 = {
    mount: mount,
    pickHook: pickHook,
    DEFAULT_RATIOS: DEFAULT_RATIOS,
    __mounted: false,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.HeartOpenStage2;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount);
    } else {
      autoMount();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
