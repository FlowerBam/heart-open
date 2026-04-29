# Heart Open — 컨셉 랜딩 페이지

22~28세 여성 커플을 위한 가벼운 호환성 미니게임 20개. GitHub Pages 정적 사이트.

- 배포 도메인: https://flowerbam.github.io/heart-open/
- 부모 이슈: HEAAA-207 / 인프라 이슈: HEAAA-209
- GA4: `G-2NYTV5FKDC`

## 디렉토리

```
heart-open/
├── index.html              # 20개 컨셉 인덱스 (Phase 1만 활성)
├── assets/
│   ├── characters/         # ESARP 5종 (emotion / social / attachment / romantic / practical)
│   └── cards/              # balance_game / love_type / match
├── shared/
│   ├── tokens.css          # 디자인 시스템 (CSS 변수 + Pretendard)
│   ├── result-card.css     # 결과 카드 스타일
│   ├── result-card.js      # html2canvas 저장 + Web Share + 클립보드 폴백
│   └── analytics.js        # GA4 헬퍼 (trackGameStart / trackResultView / trackShare / trackCtaClick)
├── <slug>/                 # 각 컨셉 페이지 (자녀 이슈에서 추가)
└── README.md
```

## 컨셉 페이지 추가 방법 (자녀 이슈용)

1. 슬러그 폴더 생성: `mkdir slot-match` (`00_overview.md` §URL구조 표 따름)
2. `index.html` 파일 작성 — 아래 보일러플레이트 사용

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>슬롯 매칭 | Heart Open</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <link rel="stylesheet" href="../shared/tokens.css">
  <link rel="stylesheet" href="../shared/result-card.css">

  <!-- GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-2NYTV5FKDC"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-2NYTV5FKDC');
  </script>
  <script src="../shared/analytics.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
  <script src="../shared/result-card.js" defer></script>
</head>
<body>
  <div class="container">
    <!-- 게임 영역 -->

    <!-- 결과 화면 -->
    <div class="result-card">
      <img src="../assets/characters/romantic.png" alt="낭만형 캐릭터">
      <h2 class="result-title">설렘 가득 낭만형 💕</h2>
      <p class="result-desc">우리 커플은 작은 이벤트에 약해요.</p>
      <div class="result-actions">
        <button class="btn-share" onclick="HeartOpenResultCard.shareResult({ conceptId: '01', title: '슬롯 매칭 결과' })">💕 공유</button>
        <button class="btn-save" onclick="HeartOpenResultCard.saveResult()">저장</button>
      </div>
      <a href="https://heartopen.app" class="btn-cta"
         onclick="HeartOpenAnalytics.trackCtaClick('01', 'app_store')">
        앱에서 정밀 분석 →
      </a>
    </div>
  </div>

  <script>
    // 진입 시 GA4
    HeartOpenAnalytics.trackPageView('01', '슬롯 매칭');
    // 게임 시작 시: HeartOpenAnalytics.trackGameStart('01', '슬롯 매칭');
    // 결과 노출 시: HeartOpenAnalytics.trackResultView('01', 'R');
  </script>
</body>
</html>
```

3. 활성화: `index.html` 의 `CONCEPTS` 배열에서 해당 슬러그의 `active: true` 로 변경

## 디자인 시스템

`shared/tokens.css` 의 CSS 변수로 통일:

- 색: `--primary` (#FF6F91), `--accent` (#C3B1E1), `--bg` (#FFF9F7) 등
- ESARP 타입 색: `--type-emotion`, `--type-social`, `--type-attachment`, `--type-romantic`, `--type-practical`
- 간격: `--space-1` ~ `--space-10` (4·8·12·16·20·24·32·40)
- 라운드: `--radius-sm/md/lg/pill`
- 폰트: Pretendard, mobile-first `max-width: 480px`

톤은 `~/heart-open-concepts/shared_assets.md §톤가이드` 준수 — 친근 구어체, "당신/유저/Cosmic/Portal" 금지.

## GA4 이벤트

`shared/analytics.js` 의 `HeartOpenAnalytics` 헬퍼만 사용:

| 헬퍼 | 시점 | 파라미터 |
|---|---|---|
| `trackPageView(id, name)` | 페이지 진입 | concept_id, page_title |
| `trackGameStart(id, name)` | 게임 시작 버튼 | concept_id, concept_name |
| `trackResultView(id, type)` | 결과 카드 노출 | concept_id, result_type |
| `trackShare(id, method)` | 공유 (자동) | concept_id, method='native'\|'clipboard' |
| `trackCtaClick(id, dest)` | 앱 CTA 클릭 | concept_id, destination='app_store' |

`HeartOpenResultCard.shareResult()` 는 공유 성공 시 `trackShare` 를 자동 호출.

## 운영자용 — 배포 절차

> ⚠️ 자동 배포 금지. 보드 검토 후 운영자가 직접 트리거.

### 최초 1회 — 리모트 연결

```bash
cd ~/projects/heart-open
git init
git add .
git commit -m "chore: initial repo skeleton (HEAAA-209)"
git branch -M main
git remote add origin git@github.com:flowerbam/heart-open.git
# 보드 승인 후
git push -u origin main
```

### GitHub Pages 활성화

1. https://github.com/flowerbam/heart-open/settings/pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)` → Save
4. 1~2분 후 `https://flowerbam.github.io/heart-open/` 접속 확인

### 컨셉 추가 후 배포

```bash
git add slot-match/ index.html
git commit -m "feat(slot-match): 슬롯 매칭 컨셉 페이지"
# 보드/QA 검토 후
git push
```

### 자산 갱신 (앱 자산이 바뀌었을 때)

```bash
cp /Users/eocks/StudioProjects/heart_open_03/assets/characters/*.png assets/characters/
cp /Users/eocks/StudioProjects/heart_open_03/assets/cards/*.png assets/cards/
git add assets/
git commit -m "chore(assets): 캐릭터/카드 이미지 갱신"
```

> ⚠️ 원본 `/Users/eocks/StudioProjects/heart_open_03/` 은 **읽기 전용**. 복사만, 수정/삭제 X.

## 안전 가드

- 본 리포는 정적 사이트 — 사용자 데이터 수집 X (GA4 익명 이벤트만)
- 톤 금지어: "당신", "유저", "심층", "프리미엄", "Cosmic", "Portal"
- 폰트 굵기 `FontWeight.w800`/`font-weight: 800` 회피 (Apple 가이드 위반)
- 모든 페이지 모바일 우선 (`max-width: 480px`)
