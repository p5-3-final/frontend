---
spec: SPEC-033
repo: frontend
updated: 2026-11-06
---

# Tasks: SPEC-033 검색 화면(문장·이미지 장면 찾기, 주석 클립)과 영상 질문(Video RAG) — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `S` = `src/features/search`, `A` = `src/features/analysis`

선행: SPEC-031 T001(계약 lock 4.1.0과 생성 코드), T002(플레이어 컨트롤러), T004·T005(알림 연결과 버퍼), T009(영상 상세 조립)

## Phase 1: 준비

- [x] T001 search 응답 Zod 스키마, URL 쿼리 스키마, query key, API 함수, `apiRequest`의 `FormData` 본문, 계약 예시 픽스처, `/search` 라우트 — 테스트 `S/model/schemas.test.ts`(계약 예시 파싱), `S/model/searchParams.test.ts`, `src/shared/api/client.test.ts`, 구현 `S/model/{schemas,searchParams,queryKeys}.ts`, `S/api/searchApi.ts`, `src/shared/api/client.ts`, `mocks/search.ts`, `src/pages/SearchPage.tsx`, `src/app/routes.tsx`

## Phase 2: US-1 문장으로 장면 찾기 (P1)

- [x] T002 [R-1] 1~200자 질의로 영상 범위 검색(정밀 선택값 포함), 받은 순서대로 썸네일·구간·"유사도"·찾은 경로 — 테스트 `S/components/SearchForm.test.tsx`, `S/components/MomentResults.test.tsx`, 구현 `S/components/{SearchForm,MomentResults,MomentResultItem}.tsx`, `S/api/useMomentSearch.ts`
- [x] T003 [R-2] 결과 위에 대상어·해석 방법, "장면 외형 기준 검색", 재사용 표시 — 테스트 `MomentResults.test.tsx`, 구현 `S/components/SearchResultHeader.tsx`, `src/shared/lib/messages.ts`
- [x] T004 [R-3] `notFound`면 "찾지 못함"을 먼저, 결과는 참고용으로 흐리게 — 테스트 `MomentResults.test.tsx`, 구현 `MomentResults.tsx`
- [x] T005 [P] [R-4] `degraded` 이유 네 가지별 안내 — 테스트 `S/model/degraded.test.ts`, `MomentResults.test.tsx`, 구현 `S/model/degraded.ts`, `SearchResultHeader.tsx`
- [x] T006 [R-7] "내 영상 전체"면 전체 검색, 정밀 검색 꺼짐·막힘, 결과마다 영상 이름 — 테스트 `SearchForm.test.tsx`, `MomentResults.test.tsx`, 구현 `SearchForm.tsx`, `S/api/useVideoNames.ts`
- [x] T007 [R-12] 결과를 누르면 영상 상세를 `seekMs`로 열고, 돌아오면 다시 요청하지 않고 같은 결과 — 테스트 `src/pages/SearchFlow.test.tsx`, 구현 `MomentResultItem.tsx`, `useMomentSearch.ts`, `src/pages/VideoDetailPage.tsx`
- [x] T008 [R-13] 400이면 입력 옆 이유, 404 `SEARCH_NOT_INDEXED`면 준비 안 됨 안내, 5xx·네트워크면 다시 시도 — 테스트 `MomentResults.test.tsx`, `src/shared/lib/messages.test.ts`, 구현 `SearchForm.tsx`, `MomentResults.tsx`, `messages.ts`

## Phase 3: US-2 주석 클립 (P1)

- [x] T009 [R-5] `grounding.completed` READY면 클립 정보를 불러와 "주석 클립 보기", FAILED면 "주석을 만들지 못함", `NONE`이면 자리 없음. 알림이 응답보다 먼저 와도 반영 — 테스트 `S/components/GroundingSlot.test.tsx`, 구현 `S/components/GroundingSlot.tsx`, `S/hooks/useGroundingLiveStatus.ts`, `S/api/useGroundingClip.ts`
- [x] T010 [R-6] "주석 클립 보기"로 클립 재생, 대상어별 색 범례, 현재 위치의 프레임별 객체 수 — 테스트 `S/components/GroundingClipDialog.test.tsx`, 구현 `S/components/GroundingClipDialog.tsx`

## Phase 4: US-4 영상에 질문 (P1)

- [x] T011 [R-9] 영상 상세 "영상에 질문": 답·판정 상태·근거 구간·관련 이벤트·한계, 근거·이벤트를 누르면 `seekMs`로 이동 — 테스트 `A/components/VideoQuestionPanel.test.tsx`, 구현 `A/components/VideoQuestionPanel.tsx`, `S/api/useAnswerQuestion.ts`, `S/index.ts`, `src/pages/VideoDetailPage.tsx`
- [x] T012 [R-10] `answer`가 null이면 "답을 만들지 못했고 근거만 보여 줌"과 근거 — 테스트 `VideoQuestionPanel.test.tsx`, 구현 `VideoQuestionPanel.tsx`

## Phase 5: US-3 이미지로 찾기 (P2)

- [x] T013 [R-8] jpg·png·webp 5MB 이하면 범위와 함께 이미지 검색, 벗어나면 요청 없이 이유. 돌아오면 마지막 결과를 다시 보임 — 테스트 `S/model/imageRules.test.ts`, `S/components/ImageSearchInput.test.tsx`, 구현 `S/model/imageRules.ts`, `S/components/ImageSearchInput.tsx`, `S/api/useImageSearch.ts`

## Phase 6: US-5 맞음·틀림 (P2)

- [x] T014 [R-11] 이동 `jumped`, 5초 넘게 재생 `played`(재생 길이), 맞음·틀림을 결과마다 한 번씩 기록 — 테스트 `S/components/FeedbackButtons.test.tsx`, `S/hooks/usePlayedFeedback.test.tsx`, `src/pages/SearchFlow.test.tsx`, 구현 `S/components/FeedbackButtons.tsx`, `S/hooks/usePlayedFeedback.ts`, `S/api/useMomentFeedback.ts`

## Phase 7: 마무리

- [x] T015 [NFR-2] 질의·서명 주소(썸네일·클립)가 URL 밖의 브라우저 저장소와 콘솔에 남지 않음 — 테스트 `S/api/searchSecrets.test.tsx`
- [ ] T016 [NFR-1] E2E: 문장 검색 → 결과 → 주석 클립 READY → 클립 재생, 결과에서 상세 이동, 영상 질문, 결과 50개 응답 뒤 200ms, 화면 밖 썸네일은 요청하지 않음, 360px 가로 스크롤 없음 — 테스트 `tests/e2e/search.spec.ts`, 가짜 API `tests/e2e/fakeSearch.ts`
- [ ] T017 키보드만으로 검색 → 결과 이동 → 맞음·틀림 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T018 계약과 구현 일치 확인(생성 타입 diff 없음, 픽스처 typecheck), README, mock 모드 시연으로 성공 지표 확인

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
