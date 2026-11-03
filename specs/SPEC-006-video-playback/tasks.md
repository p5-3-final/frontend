---
spec: SPEC-006
repo: frontend
updated: 2026-11-03
---

# Tasks: SPEC-006 원본 영상 재생 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `U` = `src/features/upload`

## Phase 1: 준비

- [ ] T001 (1.1.0 생성 타입은 0d6a7bf에서 먼저 반영) `videoPlaybackSchema`, query key(`lists`·`detail`·`playback`), `getVideo`·`getVideoPlayback`, MSW 핸들러, `MEDIA_NOT_PLAYABLE` 문구 — `src/api/generated/media-service.ts`, `U/model/{schemas,queryKeys}.ts`, `U/api/mediaApi.ts`, `mocks/handlers.ts`, 테스트 `src/shared/lib/messages.test.ts`, 구현 `src/shared/lib/messages.ts`

## Phase 2: US-1 내 영상 재생 (P1)

- [ ] T002 [R-6] 목록의 파일 이름이 상세 화면 링크, 상세 주소로 바로 열기 — 테스트 `U/components/VideoList.test.tsx`, `src/pages/VideoDetailFlow.test.tsx`, 구현 `VideoList.tsx`, `src/pages/VideoDetailPage.tsx`, `src/app/routes.tsx`
- [ ] T003 [R-7] 상세 화면에 파일 이름·크기·형식·상태·올린 시각·완료 시각 — 테스트 `U/components/VideoDetail.test.tsx`, 구현 `U/components/VideoDetail.tsx`, `U/api/useVideo.ts`
- [ ] T004 [R-8] 업로드 완료 이후 상태면 재생 주소로 플레이어 표시, 내려받기 링크 — 테스트 `U/components/OriginalPlayer.test.tsx`, 구현 `U/components/OriginalPlayer.tsx`, `U/api/useVideoPlayback.ts`
- [ ] T005 [R-11] 만료 뒤 재생 오류면 새 주소를 한 번 받아 보던 위치부터 이어서 재생 — 테스트 `OriginalPlayer.test.tsx`, 구현 `OriginalPlayer.tsx`

## Phase 3: US-2 재생할 수 없는 영상 (P1)

- [ ] T006 [R-9] `UPLOADING`·`EXPIRED`면 이유를 보이고 플레이어·재생 주소 요청 없음 — 테스트 `VideoDetail.test.tsx`, 구현 `VideoDetail.tsx`
- [ ] T007 [R-10] 만료 전 재생 오류(형식·코덱)면 안내와 원본 내려받기 — 테스트 `OriginalPlayer.test.tsx`, 구현 `OriginalPlayer.tsx`
- [ ] T008 [R-12] `MEDIA_VIDEO_NOT_FOUND`·형식이 틀린 ID면 찾을 수 없다는 안내와 목록 링크 — 테스트 `VideoDetail.test.tsx`, 구현 `VideoDetail.tsx`

## Phase 4: US-3 상세에서 삭제 (P2)

- [ ] T009 [R-13] 상세에서 삭제 확인 → 성공하면 목록으로 이동, 지운 영상의 상세·재생 캐시 버림 — 테스트 `src/pages/VideoDetailFlow.test.tsx`, 구현 `VideoDetail.tsx`, `DeleteVideoDialog.tsx`, `U/api/useDeleteVideo.ts`

## Phase 5: 마무리

- [ ] T010 [P] [NFR-3] 재생·내려받기 주소의 서명이 브라우저 저장소·콘솔에 없음 — 테스트 `U/api/playbackSecrets.test.tsx`
- [ ] T011 [P] [NFR-4] 상세 화면의 플레이어·내려받기·삭제를 키보드로 조작 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T012 [NFR-5] E2E: 목록 → 상세, 정보·플레이어(또는 R-10 안내) 표시, 360px 가로 스크롤 없음 — 테스트 `tests/e2e/video-detail.spec.ts`, 구현 `tests/e2e/fakeMedia.ts`
- [ ] T013 로컬 compose 시연(mp4 재생, mkv 안내·내려받기), README 화면 목록 갱신

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] lint, 타입 검사, 전체 테스트 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
