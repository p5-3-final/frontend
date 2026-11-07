---
spec: SPEC-034
repo: frontend
updated: 2026-11-07
---

# Tasks: SPEC-034 작업 세션·분석 이력 화면과 학습용 보존 설정 화면 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `Se` = `src/features/sessions`, `St` = `src/features/settings`, `U` = `src/features/upload`

선행: SPEC-031 T001(계약 lock 4.0.0과 생성 코드), T003(analysis 스키마·API), T013(`videoDetailPath`의 `?event=`·`?t=`), T022(auth `useMe` 내보내기)

## Phase 1: 준비

- [x] T001 세션·보존 응답 Zod 스키마, query key, API 함수, MSW 핸들러, `/history`·`/history/sessions/:sessionId`·`/settings` 라우트 — 테스트 `Se/model/schemas.test.ts`, `St/model/schemas.test.ts`(계약 예시 파싱), 구현 `Se/model/{schemas,queryKeys,roles}.ts`, `Se/api/sessionsApi.ts`, `St/model/{schemas,queryKeys}.ts`, `St/api/settingsApi.ts`, `mocks/media.ts`, `src/pages/{HistoryPage,SessionDetailPage,SettingsPage}.tsx`, `src/app/routes.tsx`

## Phase 2: US-1 작업 전후 비교 (P1)

- [x] T002 [R-1] "분석 이력": 내 세션 최신순 20개씩 이름·현장·구역·만든 시각, 없으면 안내와 "세션 만들기" — 테스트 `Se/components/SessionList.test.tsx`, 구현 `Se/components/SessionList.tsx`, `Se/api/useWorkSessions.ts`
- [x] T003 [R-3] 세션 상세: 역할 칸에 받은 순서대로 영상, 영상마다 분석 상태·확정 이벤트 수·활성 위험 수 — 테스트 `Se/components/SessionDetail.test.tsx`, 구현 `Se/components/{SessionDetail,SessionVideoCard}.tsx`, `Se/api/{useWorkSession,useSessionVideoSummaries}.ts`
- [x] T004 [NFR-1] 영상별 analysis 요청을 동시에 4개까지만 — 테스트 `src/shared/lib/limitConcurrency.test.ts`, `SessionDetail.test.tsx`(동시 요청 최대값), 구현 `src/shared/lib/limitConcurrency.ts`, `useSessionVideoSummaries.ts`
- [x] T005 [R-4] 흐름 요약: 이어 온 위험과 확정 `barrier_not_restored`·`object_removed`·`object_moved`를 역할 순·시각 순으로, 누르면 그 영상 상세를 이벤트(또는 위험 시작 시각)로 — 테스트 `Se/model/sessionFlow.test.ts`, `Se/components/SessionFlow.test.tsx`, 구현 `Se/model/sessionFlow.ts`, `Se/components/SessionFlow.tsx`
- [x] T006 [R-5] 분석이 끝나지 않은 영상이 있으면 흐름 요약 위에 비교가 완전하지 않다는 안내 — 테스트 `SessionFlow.test.tsx`, 구현 `SessionFlow.tsx`
- [x] T007 [R-12] media 404면 세션·영상을 찾을 수 없다는 안내, 5xx·네트워크면 다시 시도 — 테스트 `SessionDetail.test.tsx`, `src/shared/lib/messages.test.ts`, 구현 `SessionDetail.tsx`, `SessionList.tsx`, `messages.ts`

## Phase 3: US-2 세션에 영상 올리기 (P1)

- [x] T008 [R-2] 이름(필수)·현장·구역으로 세션 만들기, 성공하면 상세로 이동, 400이면 입력 옆 이유 — 테스트 `Se/components/CreateSessionForm.test.tsx`, 구현 `Se/components/CreateSessionForm.tsx`, `Se/api/useCreateWorkSession.ts`
- [x] T009 [R-6] 업로드 화면 세션 고르기(없음·내 세션·새 세션)와 역할(작업 전·중·후), 세션을 고르면 역할 필수, 고른 값을 `createVideo`의 `sessionId`·`role`로 — 테스트 `Se/components/SessionRolePicker.test.tsx`, `U/model/uploadQueue.test.ts`, `src/pages/AnalysisUpload.test.tsx`, 구현 `Se/components/SessionRolePicker.tsx`, `U/model/uploadQueue.ts`, `U/components/{UploadButton,UploadDropzone}.tsx`, `src/pages/AnalysisPage.tsx`
- [x] T010 [R-7] "새 세션"과 이름이면 첫 파일의 자리 요청 전에 세션을 만들고 그 ID를 씀, 다음 파일은 같은 세션 — 테스트 `src/pages/AnalysisUpload.test.tsx`(요청 순서·본문), 구현 `SessionRolePicker.tsx`
- [x] T011 [R-8] 세션 상세 "이 세션에 영상 올리기"로 그 세션이 골라진 업로드 화면 — 테스트 `src/pages/SessionUploadFlow.test.tsx`, 구현 `SessionDetail.tsx`, `src/pages/AnalysisPage.tsx`

## Phase 4: US-3 학습용 보존 설정 (P2)

- [x] T012 [R-9] 설정 화면 보존 기본값 켜고 끄기, 저장 뒤 "이후에 올리는 영상에 적용됨", 실패하면 되돌림 — 테스트 `St/components/RetentionDefaultToggle.test.tsx`, 구현 `St/components/RetentionDefaultToggle.tsx`, `St/api/{useRetentionSettings,useUpdateRetentionSettings}.ts`, `St/index.ts`
- [x] T013 [R-10] 보존 중인 삭제 영상 목록(영상 ID·삭제 시각·`retainUntil`, 쪽 나눔), 확인 창 뒤 하나 철회·전체 철회 — 테스트 `St/components/RetainedVideoList.test.tsx`, 구현 `St/components/RetainedVideoList.tsx`, `St/api/{useRetainedVideos,useRevokeRetained}.ts`
- [x] T014 [R-11] 영상 상세 보존 동의 켜고 끄기(소유자에게만), 저장 뒤 "영상을 지울 때의 값이 적용됨" — 테스트 `U/components/RetentionConsentToggle.test.tsx`, 구현 `U/components/RetentionConsentToggle.tsx`, `U/api/useUpdateRetentionConsent.ts`, `U/components/VideoDetail.tsx`

## Phase 5: 마무리

- [x] T015 [NFR-2] 요약 응답이 늦어도 역할 칸·영상 이름을 먼저 그리고 요약은 도착하는 대로 채움 — 테스트 `SessionDetail.test.tsx`(느린 요약), 구현 `SessionDetail.tsx`
- [x] T016 E2E: 세션 만들기 → 작업 전·후 영상 올리기 → 세션 상세 역할별 표시 → 흐름 요약 이동, 세션 상세 응답 뒤 300ms, 보존 설정 바꾸기, 360px 가로 스크롤 없음 — 테스트 `tests/e2e/sessions.spec.ts`, 가짜 API `tests/e2e/fakeMedia.ts`, `tests/e2e/fakeAnalysis.ts`
- [x] T017 키보드만으로 세션 고르기·역할 고르기·철회 확인 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T018 계약과 구현 일치 확인(생성 타입 diff 없음), README, 로컬 compose(media·auth 실제, analysis mock) 시연으로 성공 지표 확인

## Phase 7: v5.1 추가(계약 묶음 4.0.0)

- [x] T019 [R-13] 카메라 스키마·API 훅, 목록·등록 폼(비밀값 참조만), `/history/cameras` 라우트와 탭 — 테스트 `CameraList.test.tsx`, `CameraForm.test.tsx`, 구현 `Ca/model`, `Ca/api`, `Ca/components/CameraList.tsx`, `CameraForm.tsx`, `src/pages/CamerasPage.tsx`, `src/app/routes.tsx`, `mocks/stream.ts`
- [x] T020 [R-13] 카메라 상세: 세션 start·stop, 409 안내, 15초 폴링, LIVE 세션 이동 — 테스트 `CameraDetail.test.tsx`, 구현 `Ca/components/CameraDetail.tsx`, `src/pages/CameraDetailPage.tsx`
- [x] T021 [R-14] `sessionChain`과 세션 이력(회전 표식), E2E(등록 → start → LIVE 이동 → stop → 이력) — 테스트 `sessionChain.test.ts`, `CameraSessionHistory.test.tsx`, `tests/e2e/cameras.spec.ts`, 구현 `Ca/model/sessionChain.ts`, `Ca/components/CameraSessionHistory.tsx`, `tests/e2e/fakeStream.ts`

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
