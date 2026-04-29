# Heart Open Landing Pages

GitHub Pages: https://flowerbam.github.io/heart-open/

## Pages

| Segment | URL | 타겟 |
|---|---|---|
| Honeymoon | `/honeymoon/` | 100일 전후 신규 커플 |
| Stable | `/stable/` | 1~2년차 안정 커플 |
| Crisis | `/crisis/` | 갈등/회복 고민 커플 |

## 배포

GitHub Pages가 `main` 브랜치 루트를 자동 서빙합니다. 푸시만 하면 배포됩니다.

```bash
git add honeymoon stable crisis README.md
git commit -m "feat: 3개 세그먼트 랜딩 페이지"
git push origin main
```

배포 반영까지 1~2분 소요. https://flowerbam.github.io/heart-open/honeymoon/ 등으로 확인.

## [TODO_OPERATOR] — 운영자가 출시 전 교체

각 `index.html` 안의 placeholder를 실제 값으로 교체:

1. **GA4 측정 ID** — `G-XXXXXXXXXX` (3개 파일 모두)
2. **App Store ID** — `[APP_ID]` (3개 파일 모두, `apps.apple.com/app/[APP_ID]` 부분)
3. **브랜드 컬러** — `#FF6B9D` (CSS `--brand` / `meta theme-color` 동시 교체)
4. **OG 이미지 3장** — `assets/og-honeymoon.png`, `assets/og-stable.png`, `assets/og-crisis.png` 추가 (1200×630 권장)

```bash
# 일괄 치환 예시 (GA4)
sed -i '' 's/G-XXXXXXXXXX/G-XXXXX1234/g' honeymoon/index.html stable/index.html crisis/index.html
```

## 구조

```
heart-open/
├── index.html           # 메인 (기존)
├── honeymoon/index.html # self-contained (인라인 CSS/JS)
├── stable/index.html
├── crisis/index.html
└── assets/              # OG 이미지 (운영자 추가)
```

각 페이지는 self-contained: 외부 의존성은 Pretendard CDN과 GA4 스크립트뿐.

## CTA 동작

1. 클릭 시 `cta_click` GA4 이벤트 전송 (`segment`, `destination` 파라미터)
2. UA 기반 iOS/Android 감지
3. UTM 파라미터(`utm_source=threads&utm_medium=landing&utm_campaign=segment_test_v1&utm_content=<segment>`) 부착
4. 100ms 지연 후 스토어 이동 (이벤트 전송 보장)

## 로컬 미리보기

```bash
python3 -m http.server 8000
# http://localhost:8000/honeymoon/
```
