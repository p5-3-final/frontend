---
spec: SPEC-005
repo: frontend
updated: 2026-11-03
---

# Tasks: SPEC-005 영상 업로드 화면과 내 영상 목록 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `U` = `src/features/upload`

## Phase 1: 준비

- [x] T001 `gen:api`에 `media-service.yaml` 추가와 생성 타입, 계약 응답 Zod 스키마·query key — `package.json`, `src/api/generated/media-service.ts`, `U/model/{schemas,queryKeys}.ts`, `U/index.ts`
- [x] T002 [P] [NFR-3] `MEDIA_*` 오류 문구 — 테스트 `src/shared/lib/messages.test.ts`, 구현 `src/shared/lib/messages.ts`
- [x] T003 [P] [R-2] [R-3] 확장자로 형식 판단(contentType), 크기 1바이트~5GB — 테스트 `U/model/fileRules.test.ts`, 구현 `U/model/fileRules.ts`
- [x] T004 [R-9] [NFR-4] 저장소 전송(XHR POST·PUT, 진행률 콜백, 5xx·네트워크 오류 최대 3번 재전송, 4xx 즉시 실패, 중단) — 테스트 `U/api/storageTransport.test.ts`, 구현 `U/api/storageTransport.ts`, MSW 저장소 핸들러 `mocks/handlers.ts`

## Phase 2: US-1 영상 올리기 (P1)

- [ ] T005 [R-5] [R-7] 단일 업로드: 자리 발급 → 폼 POST(fields 순서, file 마지막) → 완료 — 테스트 `U/api/uploadVideo.test.ts`, 구현 `U/api/{mediaApi,uploadVideo}.ts`
- [ ] T006 [R-6] [R-7] [NFR-1] 멀티파트: 조각 크기로 나눠 동시 3개 PUT → ETag 모아 완료, 바이트는 저장소로만 — 테스트 `uploadVideo.test.ts`, 구현 `uploadVideo.ts`
- [ ] T007 [R-4] 대기열: 고른 순서대로 하나씩, 끝나면 다음 — 테스트 `U/model/uploadQueue.test.ts`, 구현 `U/model/uploadQueue.ts`, `U/hooks/useUploadQueue.ts`
- [ ] T008 [R-1] [R-2] [R-3] 업로드 버튼·끌어다 놓기로 파일 고르기, 거절 파일 안내 — 테스트 `U/components/UploadDropzone.test.tsx`, 구현 `U/components/UploadDropzone.tsx`
- [ ] T009 [R-8] [NFR-4] 대기열 패널과 진행률 — 테스트 `U/components/UploadQueuePanel.test.tsx`, 구현 `U/components/UploadQueuePanel.tsx`, `src/shared/ui/ProgressBar.tsx`

## Phase 3: US-4 내 영상 보기 (P1)

- [ ] T010 [R-15] [R-16] 내 영상 목록(최신순 20개, 페이지, 상태 이름) — 테스트 `U/components/VideoList.test.tsx`, 구현 `U/components/VideoList.tsx`, `U/api/useVideos.ts`, `U/model/videoStatus.ts`, `src/shared/ui/Pagination.tsx`, `src/shared/lib/format.ts`
- [ ] T011 [R-18] [R-7] 영상 분석 화면 조립: 빈 상태, 업로드 완료 시 목록 갱신 — 테스트 `src/pages/AnalysisPage.test.tsx`, `src/pages/AnalysisUpload.test.tsx`, 구현 `src/pages/AnalysisPage.tsx`, `src/app/AppProviders.tsx`
- [ ] T012 [R-17] 대기열에 없는 `UPLOADING` 영상에 미완료·만료 안내 — 테스트 `VideoList.test.tsx`, 구현 `VideoList.tsx`

## Phase 4: US-2 업로드 실패와 취소 (P1)

- [ ] T013 [R-10] 재시도까지 실패하면 실패 표시와 다음 파일로 — 테스트 `uploadQueue.test.ts`, `UploadQueuePanel.test.tsx`, 구현 `uploadQueue.ts`, `UploadQueuePanel.tsx`
- [ ] T014 [R-11] "다시 시도"는 대기열 끝에서 새 자리로 처음부터 — 테스트 `uploadQueue.test.ts`, 구현 `uploadQueue.ts`
- [ ] T015 [R-12] 취소: 전송 중단, 대기열에서 빼기, 자리를 받았으면 삭제 요청 — 테스트 `uploadQueue.test.ts`, 구현 `uploadQueue.ts`, `mediaApi.ts`

## Phase 5: US-3 업로드 중 화면 이동 (P2)

- [ ] T016 [R-13] 다른 메뉴로 갔다 와도 업로드 계속, 진행률 다시 표시. 로그아웃하면 대기열 비움 — 테스트 `src/pages/AnalysisUpload.test.tsx`, `uploadQueue.test.ts`, 구현 `uploadQueue.ts`
- [ ] T017 [R-14] 업로드 중 탭 닫기·새로고침 경고 — 테스트 `U/hooks/useLeaveWarning.test.tsx`, 구현 `U/hooks/useLeaveWarning.ts`

## Phase 6: US-5 영상 삭제 (P2)

- [ ] T018 [R-19] 삭제 확인 창(파일 이름) → 삭제 → 목록에서 빠짐, 취소는 변화 없음 — 테스트 `U/components/DeleteVideoDialog.test.tsx`, 구현 `U/components/DeleteVideoDialog.tsx`, `U/api/useDeleteVideo.ts`, `src/shared/ui/ConfirmDialog.tsx`
- [ ] T019 [R-20] 삭제 응답 `MEDIA_VIDEO_NOT_FOUND`면 안내 후 목록 다시 불러오기 — 테스트 `DeleteVideoDialog.test.tsx`, 구현 `useDeleteVideo.ts`

## Phase 7: 마무리

- [ ] T020 [NFR-2] [NFR-5] 서명 주소·폼 값이 브라우저 저장소·콘솔에 없음, 키보드만으로 업로드·취소·삭제 — 테스트 `U/api/uploadSecrets.test.ts`, `src/app/Keyboard.test.tsx`
- [ ] T021 [NFR-6] E2E: 단일·멀티파트 업로드 → 목록 → 삭제, 360px 가로 스크롤 없음 — 테스트 `tests/e2e/upload-flow.spec.ts`, `tests/e2e/responsive.spec.ts`, 가짜 API·저장소 `tests/e2e/fakeApi.ts`
- [ ] T022 README, 로컬 compose + `pnpm dev`로 실제 시연(1MB·110MB 업로드, `video.uploaded` 확인, R-21 브라우저 업로드 허용 확인)

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
