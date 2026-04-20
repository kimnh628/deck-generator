# Deck Generator Workflow

자연어 → (Markdown | Claude Code JSON) → Figma Plugin → 슬라이드

## Quick Start

### 입력 방식 (v2.5+: 자동 감지)
- `{` 또는 `[` 로 시작 → JSON 모드
- 그 외 → Markdown 모드

### A. Markdown 직접 입력 (추천)
1. Figma 열기 → Plugins → Development → Deck Generator
2. 아래 Markdown 스키마에 맞춰 입력
3. Generate Slide 클릭

### B. 클로드코드로 JSON 생성
```
이 내용으로 덱 JSON 만들어줘:
- 제목: [프로젝트명]
- 내용: [핵심 내용 붙여넣기]
- 슬라이드 수: [원하는 장수]
```
그 다음 JSON 붙여넣고 Generate Slide 클릭.

---

## Markdown Input 스키마

### 전체 구조
```md
# [Deck Name]  ← full-deck 이름 (생략 시 단일 슬라이드)

---
## splash: [variant]
...

---
## [eyebrow] :: [headline]
...
```

`---` 은 슬라이드 구분자. 한 슬라이드만 있으면 `full-deck` 대신 단일 객체로 출력.

### Splash 슬라이드
```md
## splash: cover          ← name_top (cover 별칭)
## splash: closing        ← email_top (closing 별칭)
## splash: name_top       ← 원본 variant 그대로
title: 1번째 줄
title: 2번째 줄
subtitle: 서브타이틀
presenter: 이름 | 역할
email: contact@company.com
titleColor: accent         ← 선택
```

### Content 슬라이드 (custom / grid)
```md
## [eyebrow] :: [headline]
accent: [헤드라인 내 핑크 강조 단어]
type: [custom|icon-card-grid|stat-card-grid|data-table|step-flow|...]
lead: [리드 본문]
lead-subtitle: [리드 소제목]
lead-position: [right|left|bottom]
```

`type` 생략 시 `custom`. `icon-card-grid`/`stat-card-grid` 이면 rows 가 cards 로 평탄화됨.

### Primitive 블록 (`### primitive-name` + 리스트)
각 primitive 는 `### name` 헤딩으로 시작하고 하위 `- ...` 리스트가 카드가 됨.

| Primitive | 리스트 형식 | 생성 JSON |
|-----------|-------------|-----------|
| `### stat-hero` | `- 제목 \| 수치 \| 부연` | `{primitive:'stat-hero', title, stat, sub}` |
| `### stat-row` | `- 수치 \| 라벨 \| accent?` | 단일 `stat-row` 카드에 values 누적 |
| `### stat-card` | `- 제목 \| 부연 \| 라벨 \| 수치` | `{primitive:'stat-card', title, sub, label, stat}` |
| `### bullet` | `- 항목` | 단일 `bullet` 카드에 items 누적 |
| `### person` | `- 이름 \| 역할 \| 하이라이트,,,` | `{primitive:'person', name, role, highlights[]}` |
| `### labeled-list` | `- 라벨 \| 항목,,,` | 단일 `labeled-list` 카드에 groups 누적 |
| (기본, 헤딩 없음) | `- :emoji: 제목 \| 설명` 또는 `- 제목 \| 설명` | `{emoji?, title, body}` (icon-card) |

### Footer
슬라이드 바디 어디에서든 `banner:` 줄을 쓰면 dark-banner footer 가 추가됨.
```md
banner: 본문에 **강조부** 포함
banner-accent: 강조부  ← 선택 (생략 시 ** 로 자동 추출)
```

`**text**` 마커는 자동으로 `accentPart` 추출 후 제거.

### 예시
```md
# AI Avatar Platform

---
## splash: cover
title: Invisible AI,
title: made visible and lovable.
subtitle: Web-based Real-time Voice 3D AI Avatars
presenter: 안두경 | Co-founder & CEO
email: dookyung@goodganglabs.com

---
## Problem :: 크리에이터의 물리적 한계
accent: 물리적 한계
lead: 콘텐츠 제작 시간이 부족하다

### stat-hero
- 콘텐츠 제작 시간 | 72h | 영상 1건 소요
- 팬 응답률 | 0.3% | DM 응답 한계
- 번아웃 | 67% | 1년 내 중단

banner: 크리에이터의 시간은 유한하지만 **팬의 기대는 무한**하다

---
## Solution :: AI 아바타가 당신을 대신합니다
accent: 대신합니다
type: icon-card-grid

- :robot: 24/7 소통 | AI 아바타가 실시간 대화
- :sparkles: 자동 콘텐츠 | 크리에이터 스타일 학습
- :globe: 다국어 지원 | 10개 언어 실시간 번역
```

### 제한사항 (MVP v1)
- `gantt`, `growth-stat`, `image`, `compare-table` 은 JSON 으로만 지원
- `footer-bar`/`footer-card` 는 JSON 으로만 지원 (MD 는 `banner` 만)
- 복잡한 `rows` 조합(혼합 카드 1줄 등)은 JSON 권장

복잡한 케이스는 JSON 모드를 쓰거나 MD 로 뼈대만 만든 후 미세조정.

> **주의: 한글 복사 시 "Bad control character" 에러**
> 터미널/Claude 출력에서 한글 JSON을 복사하면 보이지 않는 제어문자가 포함될 수 있음.
> 해결법: JSON을 파일로 저장 후 열어서 복사하거나, ui.html에 프리셋으로 직접 추가 (한글은 `\uXXXX` 이스케이프 사용)

---

## JSON 스키마 레퍼런스

### Full Deck (여러 장)
```json
{
  "type": "full-deck",
  "name": "프로젝트명",
  "slides": [ ... ]
}
```

### Slide Types

| type | 용도 | 필수 필드 |
|------|------|-----------|
| `splash` | 커버/클로징 | variant, title[], subtitle, presenter |
| `icon-card-grid` | 아이콘 카드 그리드 | eyebrow, headline, cards[] |
| `stat-card-grid` | 수치 카드 그리드 | eyebrow, headline, cards[] |
| `custom` | 자유 조합 | eyebrow, headline, rows[], footer? |
| `data-table` | 데이터 표 | eyebrow, headline, headers[], rows[][] |
| `compare-table` | 비교 표 | eyebrow, headline, headers[], rows[][] |
| `step-flow` | 단계 플로우 | eyebrow, headline, steps[] |
| `problem` | 문제 제기 | eyebrow, headline, cards[] |
| `solution` | 솔루션 | eyebrow, headline, bulletCards[], personCards[] |
| `biz-model` | 비즈니스 모델 | eyebrow, headline, cards[], footerBlocks[] |
| `mixed-grid` | 혼합 2x2 | eyebrow, headline, cells[] |

### Custom Slide Primitives (rows 안에서 자유 조합)

| primitive | 필수 필드 | 설명 |
|-----------|-----------|------|
| `icon-card` | title, body | 이모지 + 제목 + 설명 |
| `stat-card` | title, sub, label, stat | 수치 카드 (4슬롯) |
| `stat-hero` | title, stat, sub | 큰 수치 강조 (하단 앵커링) |
| `stat-row` | title, values[{stat,label,accent?}] | 수치 타임라인 가로 배열 (하단 앵커링) |
| `bullet` | title, items[] | 불릿 리스트 (3+ 항목 시 자동 2단) |
| `labeled-list` | title, groups[{label,items}] | 그룹별 리스트 |
| `person` | name, role, highlights | 프로필 카드 |
| `growth-stat` | title, before, after, labels[] | before→after 막대 차트 |
| `image` | label | 이미지 플레이스홀더 |
| `gantt` | title, periods[], items[{label,spans[]}] | 간트 차트 (로드맵/일정표) |

### Footer Primitives

| primitive | 필수 필드 | 설명 |
|-----------|-----------|------|
| `dark-banner` | text, accentPart | 다크 결론 배너 (18% 높이) |
| `footer-bar` | cells[{label,value}] | 다크 KPI 바 (최대 4셀) |
| `footer-card` | title, blocks[{stat,sub}] | 흰색 수치 카드 |

### 공통 옵션

| 필드 | 적용 대상 | 설명 |
|------|-----------|------|
| `eyebrow` | 모든 슬라이드 | 좌상단 소제목 |
| `headline` | 모든 슬라이드 | 메인 제목 |
| `accentWord` | 모든 슬라이드 | headline 내 핑크 강조 단어 |
| `lead` | custom, grid 슬라이드 | `{subtitle, body, position?}` 설명 배치 |
| `lead.position` | custom 슬라이드 | `right`(기본), `left`, `bottom` |
| `span` | custom row 내 카드 | 카드가 차지하는 칸 수 (기본 1, 2면 2배 폭) |
| `emoji` | icon-card | 이모지 이름 (globe, rocket, sparkles 등) |
| `dark` | icon-card | `true`면 g800 배경 + white 텍스트 |
| `stat` / `statSub` | icon-card | 하단 accent 수치 + 부연 (이모지 우상단 87x87) |

---

## Design Rules (v2.4)

### 레이아웃 기본값
- 캔버스: 1920x1080
- 슬라이드 마진: 80px (상하좌우)
- 카드 패딩: 40px 고정 (밀도 무관, 절대 변경 금지)
- 카드 간격: 20px 고정 (가로/세로 동일)
- 카드 라디우스: 40px
- 카드 그림자: 0 0 30px rgba(0,0,0,0.10)
- 콘텐츠 시작 Y: 340px (eyebrow + headline 아래)

### 색상 토큰
- 액센트: #FE45A1 (텍스트 강조만, 카드 배경 금지)
- 블랙: #131313 / g800: #2B292E / g500: #808080 / g100: #F7F7F7
- 카드 배경: white (기본), g800 (dark 모드)

### 타이포 토큰
| 용도 | 사이즈 | 굵기 | 최소값 |
|------|--------|------|--------|
| splash-title | 120/96 | 800 | - |
| headline | 48 | 700 | - |
| card-title | 36 | 700 | 28 |
| body | 28 | 500 | 24 |
| card-sub | 24 | 500 | 20 |
| stat | 58 | 700 | 42 |
| table-cell | 22~28 | 500 | - |

### 카드 규칙
- **IconCard dark 모드**: `dark: true` → g800 배경, white 텍스트, 그림자 없음
- **IconCard stat 모드**: `stat` 필드 → 이모지 우상단 87x87 (radius 16), 제목+캡션 좌측, stat 하단 앵커링
- **StatHeroCard/StatRowCard**: stat+sub를 하단 패딩 40px 기준 바텀 앵커링. title↔stat 갭은 유동적
- **BulletCard**: 1단 높이 > 가용공간이고 items > 2이면 자동 2단 (좌 ceil(n/2), 우 나머지)
- **카드 내 설명(sub) 지양** → 슬라이드 lead에 배치
- **StatRowCard 사용 기준**: DarkBanner/FooterBar 셀 최대 4개, 5+ 수치 비교 시 사용

### Lead Position 규칙
- **right** (기본): headline 좌측 (headlineWidth || 840), lead 우상단 (x:970)
- **left**: headline 폭 396px, lead 좌하단 (하단 마진 80px 기준 배치), 카드는 우측으로 밀림 (396 + 20px gap)
- **bottom**: headline 전체 폭, lead 슬라이드 하단, 카드 영역 축소

### Card Span 규칙
- `span: 2` → 같은 row에서 다른 카드의 2배 폭 차지
- row 내 총 span 기준으로 폭 균등 분배

### Footer 규칙
- DarkBanner: custom 슬라이드에서 콘텐츠 영역의 18%
- FooterBar: 고정 210px, 최대 4셀

### DataTable 규칙
- 모든 행(헤더/데이터/합계) 균등 높이
- 헤더: g100 배경 + g500 텍스트 (700)
- 1열: g100 배경 + black 텍스트 (700), 좌측 패딩 40px
- 데이터 셀: white 배경 + black 텍스트 (500)
- 합계 행: g800 배경 + white/accent 텍스트
- 폰트: 행 높이 80px+ → body(28px), 미만 → table-cell(22px)

### CompareTable 규칙
- Winner 열 헤더: g800 배경 (강조 유지)
- Winner 열 데이터: accent 텍스트 + bold
- 나머지 헤더: g100, 1열: g100

### GanttCard 규칙
- 1열(라벨): 가장 긴 라벨 기준 폭 자동 계산 (글자 × 24px + 패딩, 최소 240px), g100 배경
- 나머지 열(periods): 남은 공간 균등 분배
- 색상: 2열마다 진해짐 — #FFE5F0 → #FFBFDA → #FF75AE
- FF75AE 이상 → 흰색 텍스트
- 행 높이: 가용 공간 균등 분배 (헤더 포함)
- 바: 행 높이 채움 (세로 여백 2px만), 가로 여백 0
- 내부 라운딩 20px (radiusInner), 개별 셀 라운딩 없음
- spans: `[start, end]` 쌍으로 기간 표시 (0-indexed). 불연속 구간 가능 `[0, 2, 4, 5]`

### 텍스트 처리
- 한글 word-break 방지: Word Joiner (U+2060) 자동 삽입
- JSON 복붙 시 제어문자 자동 제거 (sanitizer)

---

## 예시: 자연어 → JSON

**입력:**
> "AI 아바타 서비스 피치덱 만들어줘. 커버, 문제점, 솔루션, 트랙션, 클로징 5장으로."

**출력:**
```json
{
  "type": "full-deck",
  "name": "AI Avatar",
  "slides": [
    {
      "type": "splash",
      "variant": "name_top",
      "title": ["AI Avatar Platform"],
      "subtitle": "누구나 자신만의 AI 아바타를 만들고 소통하는 시대",
      "presenter": { "name": "Company Name", "email": "2026.04" }
    },
    {
      "type": "custom",
      "eyebrow": "Problem",
      "headline": "크리에이터의 물리적 한계",
      "accentWord": "물리적 한계",
      "rows": [{
        "cards": [
          { "primitive": "stat-hero", "title": "콘텐츠 제작 시간", "stat": "72h", "sub": "영상 1건 평균 소요" },
          { "primitive": "stat-hero", "title": "팬 응답률", "stat": "0.3%", "sub": "DM/댓글 응답 한계" },
          { "primitive": "stat-hero", "title": "번아웃", "stat": "67%", "sub": "1년 내 활동 중단" }
        ]
      }],
      "footer": { "primitive": "dark-banner", "text": "크리에이터의 시간은 유한하지만 팬의 기대는 무한하다", "accentPart": "팬의 기대는 무한" }
    },
    {
      "type": "icon-card-grid",
      "eyebrow": "Solution",
      "headline": "AI 아바타가 당신을 대신합니다",
      "accentWord": "대신합니다",
      "cards": [
        { "emoji": "robot", "title": "24/7 소통", "body": "AI 아바타가 팬과 실시간 대화" },
        { "emoji": "sparkles", "title": "자동 콘텐츠", "body": "크리에이터 스타일 학습 후 자동 생성" },
        { "emoji": "globe", "title": "다국어 지원", "body": "10개 언어 실시간 번역 소통" }
      ]
    },
    {
      "type": "custom",
      "eyebrow": "Traction",
      "headline": "빠르게 성장하는 지표",
      "accentWord": "빠르게 성장",
      "lead": { "subtitle": "2025 Q1 기준", "body": "런칭 6개월 만에 주요 지표 달성" },
      "rows": [
        { "cards": [{ "primitive": "stat-row", "title": "월간 매출 추이", "values": [{"stat": "₩0.2B", "label": "Oct"}, {"stat": "₩0.5B", "label": "Nov"}, {"stat": "₩0.8B", "label": "Dec"}, {"stat": "₩1.5B", "label": "Jan"}, {"stat": "₩2.8B", "label": "Feb", "accent": true}] }] },
        { "cards": [
          { "primitive": "stat-hero", "title": "MAU", "stat": "45K", "sub": "전월 대비 +62%" },
          { "primitive": "stat-hero", "title": "크리에이터", "stat": "1,200", "sub": "파트너 등록" },
          { "primitive": "stat-hero", "title": "NPS", "stat": "+68", "sub": "업계 평균 +22" }
        ] }
      ],
      "footer": { "primitive": "dark-banner", "text": "6개월 만에 MAU 45K, 월 매출 ₩2.8B 돌파", "accentPart": "₩2.8B" }
    },
    {
      "type": "splash",
      "variant": "email_top",
      "title": ["Thank You"],
      "titleColor": "accent",
      "subtitle": "AI Avatar Platform — 크리에이터의 새로운 가능성",
      "presenter": { "name": "Company Name", "email": "contact@company.com" }
    }
  ]
}
```
