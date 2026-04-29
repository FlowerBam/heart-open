# Heart Open Landing Pages

GitHub Pages: https://flowerbam.github.io/heart-open/

## Pages

| Segment | URL | 타겟 |
|---|---|---|
| Honeymoon | [/honeymoon/](https://flowerbam.github.io/heart-open/honeymoon/) | 100일 전후 신규 커플 |
| Stable | [/stable/](https://flowerbam.github.io/heart-open/stable/) | 1~2년차 안정 커플 |
| Crisis | [/crisis/](https://flowerbam.github.io/heart-open/crisis/) | 갈등/회복 고민 커플 |

## 구조

```
heart-open/
├── honeymoon/index.html    # self-contained (인라인 CSS/JS)
├── stable/index.html
├── crisis/index.html
├── assets/                 # OG 이미지 (운영자 추가)
└── README.md
```

각 페이지는 self-contained: 외부 의존성은 Pretendard CDN과 GA4(`G-2NYTV5FKDC`)뿐.

## 디자인 시스템

```
Primary       #FF6F91
Primary Light #FFB3C6
Primary Dark  #D94F78
Accent        #C3B1E1
Bg            #FFF9F7
Surface Warm  #FFF0EC
Text Primary  #1A1A1A
Text Secondary #6B6B6B
Success       #82C09A
Font          Pretendard
```

## 배포

GitHub Pages가 `main` 브랜치 루트를 자동 서빙합니다. 푸시만 하면 배포됩니다.

```bash
git add honeymoon stable crisis assets README.md
git commit -m "feat: 3개 세그먼트 랜딩 페이지 (FINAL)"
git push origin main
```

배포 반영까지 1~2분 소요.

## CTA 동작

1. 클릭 시 `cta_click` GA4 이벤트 전송 (`segment`, `destination` 파라미터)
2. UA 기반 iOS/Android 감지
3. UTM 파라미터(`utm_source=threads&utm_medium=landing&utm_campaign=segment_test_v1&utm_content=landing_<segment>`) 부착
4. 100ms 지연 후 스토어 이동 (이벤트 전송 보장)

## [TODO_OPERATOR] — 운영자가 출시 전 교체

각 `index.html` 안의 placeholder를 실제 값으로 교체:

1. **App Store ID** — `[APP_STORE_ID]` (3개 파일, `apps.apple.com/app/id[APP_STORE_ID]` 부분)
   ```bash
   sed -i '' 's/\[APP_STORE_ID\]/1234567890/g' honeymoon/index.html stable/index.html crisis/index.html
   ```
2. **OG 이미지 3장** — `assets/og-honeymoon.png`, `assets/og-stable.png`, `assets/og-crisis.png` (1200×630)
   - 가이드: `assets/README.md`
3. **이메일** — `contact@heartopen.app` (3개 파일 모두)
4. **Privacy 페이지** — `/heart-open/privacy/index.html` 별도 작성 또는 기존 정책 URL로 링크 변경

## 로컬 미리보기

```bash
python3 -m http.server 8000
# http://localhost:8000/honeymoon/
```

## 브랜드 톤 (반드시 준수)

- 여성 1인칭 또는 중성 친근어 ("나/우리/남친")
- 감정 훅 우선, 기능 설명 X
- 명령형 회피 ("하세요" → "~해볼까요?")
- 이모지 절제 (화면당 1-2개): 💕 ✨ 🌱 🎉

### 금지

- "당신", "심층", "프리미엄", "유저", "파트너"
- "Cosmic", "Portal" 같은 영문 추상어
- "심리학 기반", "전문가 분석" 같은 학술 톤
- "지금 다운로드!", "한정 특가!" 광고 클리셰
- 다크 네온 사이버펑크, 초다크 배경, 과도한 glow shadow
- Primary `#FF6F91` 외 다른 메인 컬러
