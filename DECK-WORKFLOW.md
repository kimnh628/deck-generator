# Deck Generator Workflow

자연어 → Claude Code → JSON → Figma Plugin → 슬라이드

## Quick Start

### 1. 클로드코드에서 JSON 생성
```
이 내용으로 덱 JSON 만들어줘:
- 제목: [프로젝트명]
- 내용: [핵심 내용 붙여넣기]
- 슬라이드 수: [원하는 장수]
```

### 2. Figma에서 생성
1. Figma 열기 → Plugins → Development → Deck Generator
2. 생성된 JSON 복사 → 텍스트 영역에 붙여넣기
3. Generate Slide 클릭

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
| `lead` | custom, grid 슬라이드 | `{subtitle, body}` 우측 설명 |
| `emoji` | icon-card | 이모지 이름 (globe, rocket, sparkles 등) |

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
