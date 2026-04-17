# Deck Generator — Figma Plugin

design.md v2.4 디자인 시스템 기반 프레젠테이션 슬라이드 자동 생성 플러그인.

## 추천 워크플로우: Claude Code → Figma

1. **Claude Code에서 덱 JSON 생성**
   ```
   이 내용으로 5장짜리 피치덱 JSON 만들어줘:
   [내용 붙여넣기]
   ```
2. **JSON 복사 → Figma 플러그인에 붙여넣기 → Generate Slide**
3. **Figma에서 미세 조정** (텍스트 수정, 이미지 교체 등)

> JSON 스키마 상세는 `DECK-WORKFLOW.md` 참조

## 설치

### 1. 파일 받기
이 폴더 전체를 로컬에 다운로드:
```
figma-deck-plugin/
├── manifest.json
├── code.js          ← 플러그인 실행 파일
├── ui.html          ← 플러그인 UI
├── code.ts          ← 소스 (수정 시 사용)
├── package.json
└── tsconfig.json
```

### 2. Figma 데스크톱 앱에서 임포트
1. Figma 데스크톱 앱 실행 (웹 버전 안 됨)
2. 아무 Figma 파일 열기
3. 상단 메뉴: `Plugins` → `Development` → `Import plugin from manifest...`
4. 이 폴더의 `manifest.json` 선택
5. 완료

### 3. 실행
`Plugins` → `Development` → `Deck Generator`

## 사용법

### Preset 으로 빠르게 생성
1. 드롭다운에서 Preset 선택 (예: "Splash Cover")
2. JSON 이 자동 채워짐
3. 내용 수정 가능 (텍스트, 카드 수 등)
4. `Generate Slide` 클릭

### 사용 가능한 Preset

| Preset | 설명 |
|---|---|
| Full Deck — Lumi (7장) | EdTech 풀 덱 예시 |
| Full Deck — Medira (7장) | 헬스케어 풀 덱 예시 |
| Full Deck — Kakao×GoodGang (4장) | IP × AI 덱 예시 |
| Splash Cover | 커버 슬라이드 |
| Splash Closing | 클로징 / CTA |
| IconCard Grid | 아이콘 카드 그리드 |
| StatCard Grid + DarkBanner | 수치 카드 + 결론 배너 |
| StatCard + FooterBar | 수치 카드 + 다크 푸터바 |
| CompareTable | 비교 표 |
| Business Model | 아이콘카드 + 매출목표 카드 |
| Problem | GrowthStatCard + DarkBanner |
| Solution | BulletCard + PersonCard |
| Traction Mixed | 2×2 혼합 그리드 |
| How It Works | 스텝 플로우 + DarkBanner |
| Custom Dense | 커스텀 고밀도 (5종 primitive 혼합) |
| Custom 3행 | 커스텀 3행 (IconCard + StatHero + DarkBanner) |

### Custom 슬라이드 (자유 조합)

`type: "custom"` 으로 primitive 를 자유롭게 조합:

```json
{
  "type": "custom",
  "eyebrow": "Overview",
  "headline": "제목",
  "accentWord": "강조 단어",
  "lead": { "subtitle": "서브", "body": "본문" },
  "rows": [
    {
      "cards": [
        { "primitive": "icon-card", "emoji": "rocket", "title": "제목", "body": "설명" },
        { "primitive": "stat-hero", "title": "지표명", "stat": "82%", "sub": "부연" }
      ]
    },
    {
      "cards": [
        { "primitive": "bullet", "title": "목록", "items": ["항목1", "항목2", "항목3"] },
        { "primitive": "labeled-list", "title": "파트너", "groups": [{"label": "그룹명", "items": "A · B · C"}] }
      ]
    }
  ],
  "footer": { "primitive": "dark-banner", "text": "결론 문장", "accentPart": "강조 부분" }
}
```

### 지원 Primitive (rows 안에서 자유 혼합)

| primitive | 필수 필드 | 설명 |
|---|---|---|
| `icon-card` | title, body | 이모지 + 제목 + 설명 |
| `stat-card` | title, sub, label, stat | 수치 카드 (4슬롯) |
| `stat-hero` | title, stat, sub | 큰 수치 강조 |
| `person` | name, role, highlights | 프로필 카드 |
| `bullet` | title, items[] | 불릿 리스트 |
| `labeled-list` | title, groups[{label, items}] | 그룹별 리스트 |
| `growth-stat` | title, before, after, labels[] | before→after 막대 차트 |

### 지원 Footer

| primitive | 필수 필드 | 설명 |
|---|---|---|
| `dark-banner` | text, accentPart | 다크 결론 배너 |
| `footer-bar` | cells[{label, value}] | 다크 푸터바 (KPI) |
| `footer-card` | title, blocks[{stat, sub}] | 흰색 수치 카드 |

### 이모지

카드에 `"emoji": "이름"` 추가하면 Fluent Emoji 3D 아이콘 자동 삽입:

`globe`, `sparkles`, `rocket`, `puzzle`, `handshake`, `megaphone`, `fire`, `robot`, `target`, `gem`, `people`, `tv`, `speech`, `clock`, `hospital`, `mobile_phone`, `chart_increasing`, `money_wings`, `broken_heart`, `sleeping`, `link`, `movie`, `joystick`, `waving_hand`, `game_die`, `glowing_star`, `growing_heart`

### Full Deck (여러 장 한꺼번에)

```json
{
  "type": "full-deck",
  "name": "프로젝트명",
  "slides": [
    { "type": "splash", ... },
    { "type": "custom", ... },
    { "type": "stat-card-grid", ... }
  ]
}
```

→ 모든 슬라이드가 가로로 나란히 생성.

## 수정 / 빌드

소스 수정 후 재빌드:
```bash
cd figma-deck-plugin
npm install          # 최초 1회
npx tsc              # TypeScript → JavaScript 컴파일
```

Figma 에서 `Hot reload plugin` 이 켜져 있으면 code.js 변경 자동 반영.
ui.html 변경은 플러그인 창 닫고 다시 열어야 반영.

## 디자인 토큰

모든 색상/폰트/간격은 design.md v2.3 기준:
- Canvas: 1920×1080
- Accent: #FF006A (텍스트 강조만, 배경 금지)
- Card gap: 20px 고정
- Card radius: 40px
- Card shadow: 0 0 30px rgba(0,0,0,0.10)
- Font: Pretendard (설치 필요)

## 알려진 제한

- 콘텐츠가 많으면 카드 밖으로 텍스트 잘림 (밀도 제어 미구현)
- CompareTable, GrowthStatCard 는 custom type 에서 아직 미지원
- 이미지/캐릭터는 placeholder 만 생성 (실제 에셋은 수동 교체 필요)
