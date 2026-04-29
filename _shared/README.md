# `_shared/` — Stage 1 Foundation

Heart Open Stage 1 wave가 공통으로 사용하는 디자인 토큰·V2 톤 lint·GA4 funnel 헬퍼. 각 컨셉(`slot-match/`, `card-memory/` 등)에서 임포트해 일관성 확보.

> 출처: [HEAAA-213 stage_taxonomy.md](../../heart-open-concepts/evolution/stage_taxonomy.md) · 이슈: HEAAA-218

## 파일 구성

| 파일 | 역할 |
|---|---|
| `tokens.css` | 브랜드/스페이싱 + ESARP 그라디언트·글로우, 트랜지션 곡선, **타이포 위계 토큰 + `.ho-h1/.ho-h2/.ho-sub/.ho-body/.ho-caption` 유틸**, focus/active 표준, prefers-reduced-motion fallback, 캐릭터 큐 fade-in |
| `haptic.js` | `HeartOpenHaptic.{light,medium,success,reveal,error}` — navigator.vibrate 래퍼 |
| `ga4-funnel.js` | `HeartOpenFunnel.create(conceptId)` — intro_view→game_start→mid_step→result_view→share/cta_click + drop_off 자동 |
| `motion.js` | `HeartOpenMotion.reduced` / `subscribe()` — JS 애니메이션 분기 |
| `share-card.js` | `HeartOpenShareCard.render({element, ratio})` — square/story/portrait 비율 토글 (html2canvas 필요) |
| `share-card-ratio.js` *(Stage 2)* | `HeartOpenShareCardRatio.generate(ratio)` — `.share-template` 자동 탐색 + html2canvas **CDN dynamic import** |
| `share-caption.js` *(Stage 2)* | `HeartOpenShareCaption.shareWithCaption({caption,url,hashtags,ratio,conceptId})` — navigator.share + clipboard fallback + GA4 `share` 이벤트 + toast + 광고 클리셰 가드 |
| `revisit-hook.js` *(Stage 2)* | `HeartOpenRevisit.pick(key)` / `.render({container, hooks, conceptId, onClick})` — 5종 훅 (`tomorrow`·`partner`·`alt-ending`·`friend`·`collection`), V2 톤 15자 |
| `local-storage.js` *(Stage 2)* | `HeartOpenLS.{lsKey, lsGet, lsSet, lsBump, lsAppend, lsDailyBump}` — 표준 키 `heart-open:{conceptId}:{purpose}` |
| `result-esarp.js` | `.result-card` 안의 `<img src=".../{emotion\|social\|attachment\|romantic\|practical}.png">` 를 감지해 자동으로 `data-esarp=E/S/A/R/P` 부여 → tokens.css의 그라디언트 발동 |
| `v2-tone-lint.js` | V2 톤 금지어·길이·명령형 lint (Node CLI). 프로젝트 루트 `README.md`/`CLAUDE.md` 는 자동 ignore (도큐멘트가 금지어를 *룰로 인용*하므로) |

## 컨셉에서 임포트하는 표준 패턴

Stage 1 wave (HEAAA-220) 후로 20개 컨셉 모두 다음 두 줄을 head에 포함:

```html
<link rel="stylesheet" href="../_shared/tokens.css">
<script src="../_shared/result-esarp.js" defer></script>
```

추가로 햅틱·모션·funnel 헬퍼가 필요한 경우:

```html
<script src="../_shared/haptic.js"></script>
<script src="../_shared/motion.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2NYTV5FKDC"></script>
<script src="../_shared/ga4-funnel.js"></script>
```

### 타이포 위계 클래스 적용 (Stage 1 폴리시)

기존 인라인 `<style>`의 `font-size: 22px / 14px` 등을 토큰 클래스로 교체:

```html
<h1 class="ho-h1">화해 메시지 만들기 💌</h1>
<p class="ho-sub">지금 내 마음을 고르면 메시지를 만들어줄게</p>
<p class="ho-body">바로 보내지 말고 한 번만 다시 읽어봐.</p>
```

토큰: `--font-h1-size 24px / --font-h2-size 18px / --font-sub-size 14px / --font-body-size 15px / --font-caption-size 12px`.

```js
// 컨셉 entry script
const funnel = HeartOpenFunnel.create('slot-match', '연인 슬롯');
funnel.intro();

document.querySelector('#start').addEventListener('click', () => {
  funnel.start();
  HeartOpenHaptic.light();
  if (HeartOpenMotion.reduced) revealResultImmediately();
  else                          startSlotAnimation();
});
```

## Stage 2 Engagement 모듈 — 임포트 패턴

```html
<!-- 결과 화면 공유/재방문/누적 묶음 -->
<script src="../_shared/share-card-ratio.js"></script>
<script src="../_shared/share-caption.js"></script>
<script src="../_shared/revisit-hook.js"></script>
<script src="../_shared/local-storage.js"></script>

<div class="share-template"><!-- 공유 카드 DOM --></div>
<div class="revisit-hooks"></div>

<script>
  // 1) 비율별 공유 이미지 생성
  const dataUrl = await HeartOpenShareCardRatio.generate('story');

  // 2) 캡션 + 해시태그로 공유
  await HeartOpenShareCaption.shareWithCaption({
    caption:   '오늘 한 줄: 바람 같은 하루였어 🌿',
    url:       location.href,
    hashtags:  ['하트오픈', '마음일기'],
    ratio:     'story',
    conceptId: 'lover-roulette',
  });

  // 3) 결과 화면 끝에 재방문 훅 2개 노출
  HeartOpenRevisit.render({
    container: document.querySelector('.revisit-hooks'),
    hooks:     ['tomorrow', 'friend'],
    conceptId: 'lover-roulette',
    onClick:   (key) => location.reload(),
  });

  // 4) 일일 카운터 (룰렛 등 일일 제한)
  const { count, isFirstToday } = HeartOpenLS.lsDailyBump('lover-roulette', 'spin');
  if (count > 3) showSoftLimit();
</script>
```

> 의존성 노트: `share-card-ratio.js` 는 `https://cdn.skypack.dev/html2canvas` 를 dynamic import.
> 네트워크 차단 환경에서는 페이지에 html2canvas UMD 를 미리 로드하면 그 인스턴스를 재사용. **[TODO_REVIEW]**

## V2 톤 lint 실행

```bash
# 전체 컨셉 디렉토리 스캔
node _shared/v2-tone-lint.js

# 단일 컨셉
node _shared/v2-tone-lint.js slot-match

# CI exit code: 0=pass / 1=warn / 2=error
```

검사 항목:

1. 금지어 — 당신, 유저, 심층, 심리분석, 진단, 프리미엄, Cosmic, Portal, Aura
2. 명령형 어미 — `~하세요`, `~해라` (제안형 권장)
3. `<p class="result-sub">` 길이 — 권장 15자 / 최대 20자
4. `<button>` 텍스트 길이 — 권장 8자 / 최대 12자

## ESARP 컬러·이모지 매핑

| ESARP | 그라디언트 토큰 | 글로우 | 큐 이모지 |
|---|---|---|---|
| E (감정형)     | `--grad-E` | `--glow-E` | 💕 |
| S (사교형)     | `--grad-S` | `--glow-S` | ✨ |
| A (애착형)     | `--grad-A` | `--glow-A` | 🌙 |
| R (로맨스)     | `--grad-R` | `--glow-R` | 🌸 |
| P (실용형)     | `--grad-P` | `--glow-P` | 🌱 |

`<div class="result-card" data-esarp="E">` 로 직접 마킹하거나, `<img src=".../emotion.png">` 만 세팅하면 `result-esarp.js` 가 `MutationObserver` 로 자동 마킹.

캐릭터 큐 fade-in 사용:

```html
<span class="char-cue">
  <img src="../assets/characters/emotion.png" alt="">
  <span class="cue-emoji">💕</span>
</span>
```

`cue-emoji` 는 200ms cubic-bezier fade-in 후 1.6s 펄스 무한 반복 (prefers-reduced-motion 시 정적).
