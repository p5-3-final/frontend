---
spec: SPEC-031
repo: frontend
updated: 2026-11-07
---

# Tasks: SPEC-031 분석 결과 화면(이벤트 타임라인·위험 상태·요약)과 실시간 알림 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `A` = `src/features/analysis`, `N` = `src/features/notifications`, `P` = `src/features/player`, `U` = `src/features/upload`

T001은 SPEC-032~SPEC-035 구현의 첫 단계이기도 하다. 네 spec의 태스크는 T001 완료에 의존한다.

## Phase 1: 준비

- [x] T001 계약 lock 4.1.0과 생성 코드 다시 만들기: `scripts/fetch-service-contracts.sh --update 4.1.0`, `gen:api`에 analysis·notification·search·quality·stream 추가(T028의 생성 부분을 합침), `pnpm gen:api`. 바뀐 `VideoResponse`(`session`, `retentionConsent` 등)에 맞춰 기존 Zod 스키마·MSW 핸들러·E2E 가짜 API를 고치고 기존 테스트 전체 통과(동작 변화 없음) — `service-contracts.lock`, `package.json`, `src/api/generated/*`, `U/model/schemas.ts`, `mocks/handlers.ts`, `tests/e2e/fakeMedia.ts`
- [x] T002 플레이어를 `player` feature로 옮기기(재생·만료 재발급·재생 불가 안내 → `VideoPlayer`, `usePlayerController`). 재생 주소를 받는 `OriginalPlayer`는 upload에 얇게 남긴다. 동작을 바꾸지 않는 리팩터링이라 SPEC-006 테스트(`U/components/OriginalPlayer.test.tsx`)가 그대로 통과하는 것으로 확인, 구현 `P/components/VideoPlayer.tsx`, `P/hooks/usePlayerController.ts`, `P/index.ts`, `U/components/VideoDetail.tsx`
- [x] T003 [P] analysis 응답 Zod 스키마(생성 타입 `satisfies`, `analysis`·`forecast`는 events JSON Schema를 옮긴 2차 스키마), query key, `analysisApi.ts`, `apiRequest`의 `query` 옵션, 계약 예시 픽스처 — 테스트 `A/model/schemas.test.ts`(계약 예시 파싱), `src/shared/api/client.test.ts`(쿼리 문자열), 구현 `A/model/{schemas,queryKeys}.ts`, `A/api/analysisApi.ts`, `src/shared/api/client.ts`, `mocks/analysis.ts`

## Phase 2: 실시간 알림 연결 (US-3 기반, P1)

- [x] T004 [R-12] 로그인하면 티켓을 받아 스트림에 연결하고 메시지를 구독자에게 전달(SSE 해석기, 메시지 Zod 스키마와 계약 예시 파싱, `ping` 무시) — 테스트 `N/model/parseSse.test.ts`, `N/model/notificationStream.test.ts`, `N/model/schemas.test.ts`, 구현 `N/model/{parseSse,notificationStream,schemas}.ts`, `N/api/sseTicket.ts`, `src/app/AppProviders.tsx`, `mocks/notifications.ts`
- [x] T005 [R-12] [NFR-2] 여러 화면이 구독해도 연결 요청은 한 번, 구독 해제 시 연결은 유지 — 테스트 `N/hooks/useNotification.test.tsx`, 구현 `N/hooks/{useNotification,useNotificationStatus}.ts`, `N/index.ts`
- [x] T006 [R-13] 끊기면 1·2·4·8·16·30초 대기 후 새 티켓으로 다시 연결하고 `Last-Event-ID`를 보냄. 45초 무응답도 끊김. 연결되면 대기 1초로 초기화 — 테스트 `notificationStream.test.ts`(가짜 타이머), 구현 `notificationStream.ts`
- [x] T007 [R-14] 로그아웃하면 연결을 닫고 재연결하지 않음, 마지막 id·버퍼를 버림 — 테스트 `notificationStream.test.ts`, 구현 `notificationStream.ts`
- [x] T008 [P] [NFR-3] SSE 티켓이 콘솔·`localStorage`·`sessionStorage`에 남지 않음 — 테스트 `N/model/notificationSecrets.test.ts`, 구현 `sseTicket.ts`, `notificationStream.ts`

## Phase 3: US-1 분석 결과 훑어보기 (P1)

- [x] T009 [R-1] 영상 상세에서 요약을 불러와 `NOT_ANALYZED`면 안내, `READY`면 요약·결과 패널 — 테스트 `A/components/AnalysisResults.test.tsx`, `src/pages/VideoDetailFlow.test.tsx`, 구현 `A/components/AnalysisResults.tsx`, `A/api/useSourceSummary.ts`, `src/pages/VideoDetailPage.tsx`, `A/index.ts`
- [x] T010 [R-2] 요약 패널: 요약문(상태별 안내), 이벤트·확정·활성 위험 수, 판정하지 않은 유형과 이유, 세션 역할·직전 상태 사용 — 테스트 `A/components/SummaryPanel.test.tsx`, 구현 `A/components/SummaryPanel.tsx`, `src/shared/lib/messages.ts`
- [ ] T011 [R-3] 이벤트 목록(시작 시각 순, "더 보기"), 유형·severity·판정·확인 상태 거르기(URL 쿼리), 행 표시 항목 — 테스트 `A/components/EventList.test.tsx`, `A/model/eventFilters.test.ts`, 구현 `A/components/{EventList,EventFilters}.tsx`, `A/api/useSourceEvents.ts`, `A/model/eventFilters.ts`
- [ ] T012 [R-6] 판정 상태 이름 네 가지와 설명이 null일 때 상태별 안내 — 테스트 `A/model/verification.test.ts`, `EventList.test.tsx`, 구현 `A/model/verification.ts`, `EventList.tsx`
- [ ] T013 [R-5] 이벤트를 누르면 플레이어가 `seekMs`로 가고 상세(근거 프레임, 설명, 위험 사유, "안전관리자 확인 필요"와 조치 제안, 판정 방식, 판정 호출 요약)가 열림. `?event=`로 바로 열어도 같음 — 테스트 `A/components/EventDetailPanel.test.tsx`, `AnalysisResults.test.tsx`, 구현 `A/components/EventDetailPanel.tsx`, `A/api/useEvent.ts`, `P/hooks/usePlayerController.ts`, `U/model/paths.ts`
- [ ] T014 [R-4] 자체 플레이어 컨트롤과 진행 막대 위 이벤트 표시(severity 색, 누르면 R-5 동작, 겹침 묶기) — 테스트 `P/components/PlayerControls.test.tsx`, `A/model/timelineMarkers.test.ts`, `P/components/VideoPlayer.test.tsx`(SPEC-006 동작 유지), 구현 `P/components/{PlayerControls,VideoPlayer}.tsx`, `P/model/types.ts`, `A/model/timelineMarkers.ts`
- [ ] T015 [R-17] 분석 API 404면 영상을 찾을 수 없다는 안내, 5xx·네트워크 오류면 "다시 시도". 패널별로 따로 — 테스트 `AnalysisResults.test.tsx`, `src/shared/lib/messages.test.ts`, 구현 `AnalysisResults.tsx`, `messages.ts`
- [ ] T016 [R-18] 목록·위험 패널을 키보드만으로 이동·선택, severity는 색과 글자 함께 — 테스트 `A/components/SeverityBadge.test.tsx`, `src/app/Keyboard.test.tsx`, 구현 `A/components/SeverityBadge.tsx`, `EventList.tsx`

## Phase 4: US-2 위험 상태 보기 (P1)

- [ ] T017 [R-8] 위험 패널: 활성 먼저·해소 다음, 구역 이름(없으면 "전체")·유형·사유·시작·해소·노출 인원·시간·이어 온 위험, 시작 시각을 누르면 이동 — 테스트 `A/components/RiskPanel.test.tsx`, 구현 `A/components/RiskPanel.tsx`, `A/api/useSourceRisks.ts`
- [ ] T018 [R-9] 예측이 있으면 구간별 노출 확률을 "참고용"과 함께, 없거나 형식이 틀리면 비움 — 테스트 `RiskPanel.test.tsx`, 구현 `A/components/RiskForecast.tsx`
- [ ] T019 [R-10] 상태 스냅샷을 시각 순으로 "구역: 이전 → 현재", 관련 이벤트를 누르면 R-5 동작 — 테스트 `A/components/SnapshotList.test.tsx`, 구현 `A/components/SnapshotList.tsx`, `A/api/useSourceSnapshots.ts`

## Phase 5: US-3 분석 진행 보기 (P1)

- [ ] T020 [R-15] 열린 영상의 `job.status`로 진행률·상태를 갱신하고 `terminal`이면 진행 표시를 닫음. 다른 영상 알림은 무시 — 테스트 `A/components/AnalysisProgress.test.tsx`, 구현 `A/components/AnalysisProgress.tsx`
- [ ] T021 [R-16] 열린 영상의 `source.completed`로 요약·이벤트·위험·스냅샷을 다시 불러옴(`NOT_ANALYZED` → 결과 표시) — 테스트 `AnalysisResults.test.tsx`, 구현 `A/hooks/useAnalysisLiveRefresh.ts`

## Phase 6: US-4 이벤트 확인·기각 (P2)

- [ ] T022 [R-7] OPERATOR에게만 확인·기각·되돌리기와 메모, 저장하면 목록·상세 갱신, 403 안내. USER에게는 버튼이 없음 — 테스트 `A/components/EventReviewForm.test.tsx`, `src/features/auth/hooks/useHasRole.test.tsx`, 구현 `A/components/EventReviewForm.tsx`, `A/api/useReviewEvent.ts`, `src/features/auth/hooks/useHasRole.ts`, `src/features/auth/index.ts`

## Phase 7: US-5 전체 이벤트 보기 (P2)

- [ ] T023 [R-11] "이벤트" 메뉴: 내 영상 전체 최신순 쪽 나눔, 유형·severity·판정·확인 상태·기간 거르기, 누르면 그 영상 상세가 이벤트가 열린 채로 — 테스트 `A/components/AllEventsList.test.tsx`, `src/pages/EventsFlow.test.tsx`, 구현 `A/components/AllEventsList.tsx`, `A/api/useMyEvents.ts`, `src/pages/EventsPage.tsx`, `src/app/routes.tsx`

## Phase 8: 마무리

- [ ] T024 [NFR-1] E2E: US-1(요약·목록·표시·이동), US-2(위험), US-3(진행 → 완료 → 다시 불러오기), 이벤트 500개 응답 뒤 300ms 안에 목록·표시, 360px 가로 스크롤 없음 — 테스트 `tests/e2e/analysis-results.spec.ts`, 가짜 API `tests/e2e/{fakeAnalysis,fakeNotifications}.ts`
- [ ] T025 [NFR-3] 근거 프레임·썸네일 서명 주소가 콘솔·브라우저 저장소에 남지 않음 — 테스트 `A/api/analysisSecrets.test.tsx`
- [ ] T026 개발용 mock 모드(`VITE_API_MOCKING=true`일 때만 MSW 브라우저 워커, 운영 빌드 제외). 5절 사용자 확인 뒤 진행 — `mocks/browser.ts`, `src/app/main.tsx`, `public/mockServiceWorker.js`, `.env.example`
- [ ] T027 계약과 구현 일치 확인(생성 타입 diff 없음, 픽스처 typecheck), README(mock 모드, 알림 연결), mock 모드 시연으로 성공 지표 확인

## Phase 8: v5.1 추가(계약 묶음 4.0.0)

- [ ] T028 [R-19] `gen:api`에 `stream-service` 추가, `S/model/schemas.ts`, `S/api/streamApi.ts`와 훅, `mocks/stream.ts` 픽스처 — 테스트 `S/api/streamApi.test.ts`, 구현 `package.json`, `src/api/generated/stream-service.ts`, `S/`
- [ ] T029 [R-19] `/stream/sessions/:sessionId` 화면: LIVE면 stream 조회(10초 폴링)와 HLS 재생, CLOSED면 analysis API로 전환, `AnalysisResults` 출처 props — 테스트 `useLiveSession.test.tsx`, `StreamSessionPage.test.tsx`, 구현 `src/pages/StreamSessionPage.tsx`, `src/app/routes.tsx`, `A/components/AnalysisResults.tsx`
- [ ] T030 [R-20] 알림 스키마 `alert.raised`, `alertFeed` 상태 전이, 앱 상단 `AlertBanner`(2초 안 표시, 세션 화면 이동) — 테스트 `alertFeed.test.ts`, `AlertBanner.test.tsx`, 구현 `N/model/schemas.ts`, `S/model/alertFeed.ts`, `S/components/AlertBanner.tsx`, `src/app/AppShell.tsx`
- [ ] T031 [R-21] 알림 스키마 `state.updated`, `applyStateUpdate`(sequence 순서), `LiveRiskPanel` 구독 — 테스트 `applyStateUpdate.test.ts`, `LiveRiskPanel.test.tsx`, 구현 `S/model/applyStateUpdate.ts`, `S/components/LiveRiskPanel.tsx`
- [ ] T032 [R-22] [R-23] 요약 패널의 일부 누락·예산 초과 안내, `unverified` 건수 집계 — 테스트 `SummaryPanel.test.tsx`, `eventFilters.test.ts`, 구현 `A/components/SummaryPanel.tsx`, `A/model/eventFilters.ts`, `src/shared/lib/messages.ts`
- [ ] T033 E2E: 가짜 stream API·SSE로 LIVE 세션 열기 → `state.updated` 반영 → `alert.raised` pending·confirmed 배너 → 세션 종료 뒤 analysis 결과 전환 — 테스트 `tests/e2e/stream-session.spec.ts`, 가짜 API `tests/e2e/fakeStream.ts`

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
