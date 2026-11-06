---
spec: SPEC-032
repo: frontend
updated: 2026-11-07
---

# Tasks: SPEC-032 플레이어 오버레이·클릭 조회·객체 질문·위험구역 편집 화면 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `A` = `src/features/analysis`, `P` = `src/features/player`

선행: SPEC-031 T001(계약 lock 4.0.0과 생성 코드), T002·T014(플레이어 이동·자체 컨트롤), T004·T005(알림 연결과 버퍼), T009(영상 상세 조립)

## Phase 1: 준비

- [x] T001 오버레이·조회·트랙·질문·구역 응답 Zod 스키마(`attributes`·`answer`는 events JSON Schema를 옮긴 2차 스키마), query key, API 함수, 계약 예시 픽스처 — 테스트 `A/model/schemas.test.ts`(계약 예시 파싱), 구현 `A/model/{schemas,queryKeys}.ts`, `A/api/analysisApi.ts`, `mocks/analysis.ts`

## Phase 2: US-1 화면 속 객체 확인 (P1)

- [x] T002 [R-14] 레터박스를 뺀 표시 영역 계산과 좌표 변환, 창 크기가 바뀌면 다시 계산 — 테스트 `P/model/contentRect.test.ts`, `P/hooks/useVideoContentRect.test.tsx`, 구현 `P/model/contentRect.ts`, `P/hooks/useVideoContentRect.ts`, `P/components/VideoPlayer.tsx`(층 자리)
- [x] T003 [R-3] 일시정지한 영상을 누르면 정규화 좌표와 현재 시각으로 클릭 조회, 재생 중·표시 영역 밖은 요청 없음 — 테스트 `P/components/InspectLayer.test.tsx`, 구현 `P/components/InspectLayer.tsx`, `A/api/useInspectPoint.ts`, `P/index.ts`
- [x] T004 [R-4] 조회 결과 박스 강조와 트랙 패널(클래스·등장 구간), 속성 상태 `READY`·`REQUESTED`·`FAILED` 표시 — 테스트 `A/components/TrackPanel.test.tsx`, 구현 `A/components/TrackPanel.tsx`, `src/shared/lib/messages.ts`, `src/pages/VideoDetailPage.tsx`
- [ ] T005 [R-6] `hit: false`면 "이 위치에서 찾은 객체가 없음"과 패널 닫기 — 테스트 `A/components/InspectResults.test.tsx`, 구현 `A/components/InspectResults.tsx`
- [ ] T006 [R-5] 열린 패널의 trackId로 `track.analyzed`(click·event)가 오면 트랙을 다시 불러와 속성 갱신. 알림이 응답보다 먼저 와도 반영 — 테스트 `TrackPanel.test.tsx`, 구현 `A/hooks/useTrackLiveRefresh.ts`, `A/api/useTrack.ts`

## Phase 3: US-3 위험구역 정의 (P1)

- [ ] T007 [R-10] 구역 편집을 열면 영상을 멈추고 저장된 구역을 종류별 색·이름으로 그림 — 테스트 `A/components/ZoneEditor.test.tsx`, 구현 `A/components/ZoneEditor.tsx`, `A/api/useSourceZones.ts`
- [ ] T008 [P] [R-11] 저장 조건 검사: 꼭짓점 3~32개, 자기 교차 없음, 이름 1~100자·중복 없음, 구역 20개 이하와 위반 이유 — 테스트 `A/model/zoneRules.test.ts`, 구현 `A/model/zoneRules.ts`
- [ ] T009 [R-11] 편집 조작: 클릭으로 꼭짓점 추가, 끌기로 옮기기, 꼭짓점·구역 지우기, 이름·종류 입력, 키보드 이동, 위반이면 저장 막고 이유 표시 — 테스트 `ZoneEditor.test.tsx`, 구현 `ZoneEditor.tsx`, `A/components/ZoneForm.tsx`
- [ ] T010 [R-12] 저장하면 목록 전체를 보내고 "다음 분석부터 반영됨(재분석 필요)", 400은 서버 이유, 403은 권한 없음 — 테스트 `ZoneEditor.test.tsx`, 구현 `A/api/usePutSourceZones.ts`, `ZoneEditor.tsx`, `messages.ts`
- [ ] T011 [R-13] 구역 조회 결과 `reanalysisNeeded: true`면 요약 패널에 재분석 필요 안내 — 테스트 `A/components/SummaryPanel.test.tsx`, 구현 `A/components/SummaryPanel.tsx`

## Phase 4: US-2 객체에 질문 (P2)

- [ ] T012 [R-7] 1~200자 질문을 현재 시각과 함께 보내고 "답을 기다리는 중"으로 이력에 추가 — 테스트 `A/components/TrackQuestions.test.tsx`, 구현 `A/components/TrackQuestions.tsx`, `A/api/useAskTrack.ts`, `A/model/schemas.ts`(질문 폼)
- [ ] T013 [R-8] 그 requestId로 `track.analyzed`(question)가 오면 결과를 불러와 답·판정 상태, `answerable: false`면 "화면만으로는 답할 수 없음", 실패면 실패 안내 — 테스트 `TrackQuestions.test.tsx`, 구현 `A/api/useTrackQuestion.ts`, `TrackQuestions.tsx`
- [ ] T014 [R-9] 429면 이력에 넣지 않고 잠시 뒤 다시 하라는 안내 — 테스트 `TrackQuestions.test.tsx`, 구현 `TrackQuestions.tsx`, `messages.ts`

## Phase 5: US-4 오버레이 (P2)

- [ ] T015 [R-1] 오버레이를 켜면 현재·다음 10초 구간을 미리 받고 가장 가까운 탐지 시각의 박스와 클래스를 그림 — 테스트 `P/model/overlayFrame.test.ts`, `P/components/OverlayLayer.test.tsx`, 구현 `P/model/overlayFrame.ts`, `P/components/OverlayLayer.tsx`, `A/api/useSourceOverlay.ts`
- [ ] T016 [R-2] `hasEvent` 트랙 강조, 켜고 끄기는 기본 꺼짐이고 영상을 바꾸면 다시 꺼짐 — 테스트 `OverlayLayer.test.tsx`, 구현 `P/components/{OverlayLayer,OverlayToggle}.tsx`

## Phase 6: 마무리

- [ ] T017 [NFR-1] [NFR-2] E2E: 클릭 조회 → 속성 분석 중 → 알림 → 속성, 질문 → 답, 구역 그리기 → 저장, 박스 50개 그리기 16ms 이하, 클릭 응답 뒤 패널 100ms 이하 — 테스트 `tests/e2e/inspect-zones.spec.ts`, 가짜 API `tests/e2e/fakeAnalysis.ts`
- [ ] T018 키보드 대안(일시정지 시 트랙 목록 버튼으로 조회)과 구역 편집 키보드 조작 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T019 계약과 구현 일치 확인(생성 타입 diff 없음, 픽스처 typecheck), README, mock 모드 시연으로 성공 지표 확인

## Phase 7: v5.1 추가(계약 묶음 4.0.0)

- [ ] T020 [R-15] `ppeStatus`(확정 `ppe_missing` 우선, 없으면 속성 값)와 트랙 패널 표시 — 테스트 `ppeStatus.test.ts`, `TrackPanel.test.tsx`, 구현 `A/model/ppeStatus.ts`, `A/components/TrackPanel.tsx`
- [ ] T021 [R-16] `ZoneEditor` props 분리, `CameraZoneEditor`와 카메라 구역 훅, 저장 뒤 안내 — 테스트 `ZoneEditor.test.tsx`, `CameraZoneEditor.test.tsx`, 구현 `A/components/ZoneEditor.tsx`, `S/components/CameraZoneEditor.tsx`, `S/api/useCameraZones.ts`, `S/api/usePutCameraZones.ts`, `mocks/stream.ts`

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
