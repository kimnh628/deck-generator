# Project: Deck Generator (Figma Plugin)

## Overview
design.md v2.4 디자인 시스템 기반 프레젠테이션 슬라이드 자동 생성 Figma 플러그인.
자연어 → JSON → Figma 노드 파이프라인.

## 입력 방식 (v2.5+)
- **Markdown**: 플러그인 textarea 에 MD 직접 입력 (자동 감지). 스키마는 `DECK-WORKFLOW.md § Markdown Input`
- **JSON**: `{` 로 시작하면 JSON 모드. 복잡한 케이스(gantt, growth-stat 등)에 사용

## Deck JSON 생성 가이드

사용자가 덱/슬라이드 내용을 설명하면:

1. `DECK-WORKFLOW.md`의 JSON 스키마 + Design Rules 참조
2. 내용을 적절한 slide type과 primitive로 변환
3. 아래 규칙 준수:
   - 카드 내 설명(sub) 최소화 → 슬라이드 lead에 배치
   - DarkBanner 셀 최대 4개, 5+ 수치 비교는 stat-row 사용
   - BulletCard 항목 3+개면 자동 2단 전환됨
   - StatHeroCard/StatRowCard는 하단 앵커링 (패딩 자동)
   - IconCard에 dark/stat 옵션 활용 (레퍼런스 카드 스타일)
   - 원본에 없는 데이터/수치 절대 추가 금지
   - 설명은 짧게 줄이지 말고 원본 분량만큼 충분히 넣기

4. 생성된 JSON을 코드블록으로 출력
5. "이 JSON을 Figma 플러그인에 붙여넣고 Generate 클릭하세요"

## Key Files
- `code.ts` — 플러그인 로직 (TypeScript)
- `code.js` — 컴파일된 실행 파일 (`npx tsc`)
- `ui.html` — 플러그인 UI + 프리셋 데이터
- `manifest.json` — Figma 플러그인 설정
- `DECK-WORKFLOW.md` — JSON 스키마 + 예시 레퍼런스

## Dev Commands
```bash
npx tsc          # TypeScript → JavaScript 빌드
npm install      # 최초 의존성 설치
```

## Design Tokens (v2.4)
- Canvas: 1920x1080
- Card padding: 40px, Card gap: 20px, Card radius: 40px
- Accent: #FE45A1 (텍스트만)
- Font: Pretendard
- Shadow: 0 0 30px rgba(0,0,0,0.10)
