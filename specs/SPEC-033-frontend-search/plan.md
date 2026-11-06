---
spec: SPEC-033
repo: frontend
status: Approved
owner: <이름>
created: 2026-11-06
updated: 2026-11-07
---

# Plan: SPEC-033 검색 화면(문장·이미지 장면 찾기, 주석 클립)과 영상 질문(Video RAG) — frontend

- spec: docs 레포 `docs/specs/SPEC-033-frontend-search/spec.md`
- 계약: docs 레포 `service-contracts/` 묶음 4.1.0
  - `openapi/search-service.yaml` 0.1.0: `searchSourceMoments`, `searchAllMoments`, `searchMomentsByImage`, `answerSourceQuestion`, `sendMomentFeedback`, `getGroundingClip`
  - `notifications/v1/notification-message.schema.json`: `grounding.completed`
  - `openapi/media-service.yaml`: `listVideos`, `getVideo`(영상 이름)
- 관련: SPEC-031(영상 상세 조립, 플레이어 컨트롤러, 알림 연결과 버퍼), SPEC-025·SPEC-026(인덱스·주석 클립)
- 선행: SPEC-031 T001(계약 lock 4.1.0과 생성 코드), T002(플레이어 컨트롤러), T004·T005(알림 연결), T009(영상 상세 조립)

## 1. 요약

사이드바 "검색"(`/search`)을 질의 입력·범위·정밀 검색·이미지 올리기와 결과 목록 화면으로 바꾼다. 문장 검색의 질의·범위·선택값은 URL 쿼리에 두고 query 캐시를 오래 유지한다. 그래서 결과에서 영상 상세로 갔다가 돌아와도 다시 요청하지 않는다(R-12). 상위 3개 결과의 주석 클립은 SSE `grounding.completed`로 상태를 바꾼다. 영상 상세에는 "영상에 질문" 패널을 더한다. 패널은 spec 영향 범위대로 `analysis` feature에 두고, search-service 호출 훅은 `search` feature가 `index.ts`로 내보낸다. 새 의존성은 없다.

## 2. 담당 요구사항

경로 약어: `S` = `src/features/search`, `A` = `src/features/analysis`

| 요구사항 | 담당 모듈 / 컴포넌트 | 검증 테스트 |
| --- | --- | --- |
| R-1 | `S/components/SearchForm`, `S/components/MomentResults`, `S/api/useMomentSearch` | `SearchForm.test.tsx`, `MomentResults.test.tsx` |
| R-2 | `S/components/SearchResultHeader` | `MomentResults.test.tsx` |
| R-3 | `MomentResults` | `MomentResults.test.tsx` |
| R-4 | `SearchResultHeader`, `S/model/degraded` | `degraded.test.ts`, `MomentResults.test.tsx` |
| R-5 | `S/components/GroundingSlot`, `S/hooks/useGroundingLiveStatus`, `S/api/useGroundingClip` | `GroundingSlot.test.tsx` |
| R-6 | `S/components/GroundingClipDialog` | `GroundingClipDialog.test.tsx` |
| R-7 | `SearchForm`(범위), `S/api/useMomentSearch`, `S/api/useVideoNames` | `SearchForm.test.tsx`, `MomentResults.test.tsx` |
| R-8 | `S/components/ImageSearchInput`, `S/model/imageRules`, `S/api/useImageSearch` | `imageRules.test.ts`, `ImageSearchInput.test.tsx` |
| R-9 | `A/components/VideoQuestionPanel`, `S/api/useAnswerQuestion` | `VideoQuestionPanel.test.tsx` |
| R-10 | `VideoQuestionPanel` | `VideoQuestionPanel.test.tsx` |
| R-11 | `S/api/useMomentFeedback`, `S/hooks/usePlayedFeedback`, `S/components/FeedbackButtons` | `FeedbackButtons.test.tsx`, `usePlayedFeedback.test.tsx`, `src/pages/SearchFlow.test.tsx` |
| R-12 | `MomentResults`(이동), `S/api/useMomentSearch`(캐시), `src/pages/SearchPage` | `src/pages/SearchFlow.test.tsx` |
| R-13 | `SearchForm`, `MomentResults`, `src/shared/lib/messages.ts` | `MomentResults.test.tsx`, `messages.test.ts` |
| NFR-1 | `MomentResults`(지연 썸네일) | `MomentResults.test.tsx`(`loading="lazy"`), Playwright `search.spec.ts`(결과 50개 응답 뒤 200ms) |
| NFR-2 | `useMomentSearch`, `useImageSearch`, `GroundingClipDialog` | `S/api/searchSecrets.test.tsx` |

## 3. 원칙 점검

| 원칙 | 준수 | 비고 |
| --- | --- | --- |
| I 스펙 우선 — spec이 Approved 상태인가 | ☑ | docs #128 |
| II 계약 우선 — 계약 변경이 먼저 머지됐는가 | ☑ | search-service 0.1.0은 docs #128로 머지됨. SPEC-031 T001이 4.1.0 생성 코드를 만든다 |
| III 테스트 우선 — 모든 R-*에 테스트가 매핑되고, 태스크가 요구사항 단위 TDD 사이클로 나뉘었는가 | ☑ | 2절, tasks.md |
| IV 서비스 자율성 — 다른 서비스 DB나 코드에 직접 의존하지 않는가 | ☑ | search-service·media-service 공개 API와 SSE만 쓴다 |
| V 단순성 — 새 의존성이나 추상화가 정당한가 | ☑ | 새 의존성 없음. 썸네일 지연은 `<img loading="lazy">`, 클립은 `<video>`, 이미지 업로드는 `FormData` |
| VI 관측 가능성 — 로그, 추적, health를 갖췄는가 | ☑ | `console`을 쓰지 않는다. 이동·재생·맞음·틀림 기록은 서버 질의 로그로 남는다(R-11) |
| VII 보안 — 입력 검증, 인가, 비밀값 처리를 했는가 | ☑ | 질의 1~200자, URL 쿼리, 이미지 형식·크기를 Zod·사전 검사로 확인. 서명 주소와 질의는 URL 밖의 브라우저 저장소에 두지 않는다(NFR-2) |
| VIII 문서·주석 — spec·계약·plan과 구현이 일치하고, 주석이 왜를 설명하는가 | ☑ | |
| IX GitOps — AWS 변경은 infra, 클러스터 변경은 gitops 레포를 거치는가 | ☑ | 해당 없음 |

## 4. 기술 설계

### 변경 대상

| 경로 | 변경 |
| --- | --- |
| `src/shared/api/client.ts` | `RequestOptions.body`에 `FormData`를 받으면 `Content-Type`을 붙이지 않고 그대로 보낸다(경계 문자열은 브라우저가 붙인다) |
| `src/shared/lib/messages.ts` | `SEARCH_*` 오류 문구, `degraded` 이유·해석 방법·찾은 경로 이름 |
| `S/model/` | `schemas.ts`(`MomentSearchResult`, `AnswerResult`, `GroundingClip`, 질의 폼·URL 쿼리), `queryKeys.ts`, `degraded.ts`, `imageRules.ts`, `searchParams.ts`(URL ↔ 검색 조건) |
| `S/api/` | `searchApi.ts`, `useMomentSearch`, `useImageSearch`(mutation), `useAnswerQuestion`, `useGroundingClip`, `useMomentFeedback`, `useVideoNames` |
| `S/hooks/` | `useGroundingLiveStatus`(`grounding.completed` 구독), `usePlayedFeedback`(5초 넘게 재생하면 `played`) |
| `S/components/` | `SearchForm`, `ImageSearchInput`, `SearchResultHeader`, `MomentResults`, `MomentResultItem`, `GroundingSlot`, `GroundingClipDialog`, `FeedbackButtons` |
| `S/index.ts` | `useAnswerQuestion`, `usePlayedFeedback`, 이동 상태 형식(`SearchJumpState`) |
| `A/components/VideoQuestionPanel.tsx` | 영상 상세 "영상에 질문" 패널 |
| `src/pages/SearchPage.tsx`, `src/app/routes.tsx` | `/search` 라우트(lazy). ComingSoon 목록에서 뺀다 |
| `src/pages/VideoDetailPage.tsx` | `VideoQuestionPanel`과 `usePlayedFeedback` 조립, "이 영상에서 검색" 링크(`/search?scope=source&sourceId=`) |
| `mocks/search.ts`, `tests/e2e/fakeSearch.ts` | 계약 예시 픽스처와 핸들러, `grounding.completed` 알림 |

### 데이터 모델

해당 없음(frontend). 마지막 이미지 검색 결과는 query 캐시(메모리)에만 둔다.

### API / 이벤트

- search-service 0.1.0: `searchSourceMoments`, `searchAllMoments`, `searchMomentsByImage`, `answerSourceQuestion`, `sendMomentFeedback`, `getGroundingClip`
- media-service: `listVideos`(영상 고르기), `getVideo`(전체 범위 결과의 영상 이름)
- SSE `grounding.completed`(`groundingId`, `segmentId`, `outcome`): SPEC-031 `useNotification`

### 검색 화면 (R-1~R-4, R-7, R-12, R-13)

- URL 쿼리: `?q=&scope=source|all&sourceId=&precise=1`. `searchParams.ts`가 Zod로 검증한다(q 1~200자, sourceId uuid). 질의를 URL에 두는 이유: 뒤로 가기·새로고침으로 같은 결과를 보고(R-12), URL 이외의 브라우저 저장소에는 남기지 않는다(NFR-2).
- 폼(React Hook Form + Zod): 질의 입력, 범위 라디오(이 영상·내 영상 전체), "이 영상"이면 영상 고르기 `<select>`(내 영상 `listVideos` 중 `READY`), 정밀 검색 체크박스(전체 범위면 꺼지고 막힘, R-7), 검색 버튼, 이미지 올리기 버튼. 보내면 URL만 바꾸고, 요청은 URL에서 읽은 조건으로 한다.
- 요청: `useMomentSearch(params)`
  - 이 영상: `searchSourceMoments(sourceId, q, precise)`
  - 전체: `searchAllMoments(q)`
  - `staleTime: Infinity`, `gcTime: 30분`, `retry: false`. 같은 조건으로 돌아오면 캐시를 그대로 그린다(R-12). 정밀 검색은 사용자별 상한이 있어 자동 재요청을 하지 않는다.
- 결과 머리(R-2, R-4): 해석된 대상어(`targets`)와 해석 방법(`parseMethod` 이름), "장면 외형 기준 검색입니다." 안내, `reused`면 "저장된 결과를 다시 보여 줍니다." 표시. `degraded.reason`별 안내: 재순위화 시간 초과, 장애, 정밀 검색 상한, AI 사용 불가.
- `notFound`(R-3): 목록 위에 "찾지 못했습니다."를 먼저 보이고, 결과 목록은 "참고 결과" 제목 아래 흐리게(`opacity`) 그린다.
- 결과 행(R-1): 썸네일(`loading="lazy"`, NFR-1), 구간(`mm:ss–mm:ss`), "유사도 0.82"(확률·퍼센트로 쓰지 않는다), 찾은 경로(`matchedBy`: 시각·텍스트·이미지). 받은 순서대로 그리고 다시 정렬하지 않는다. 전체 범위면 영상 이름(R-7).
- 영상 이름(R-7): 응답에 이름이 없어 결과의 고유 `sourceId`마다 `getVideo`를 부른다(`useQueries`, upload `videoQueryKeys.detail` 키를 함께 써서 캐시 공유). 도착 전에는 "영상 이름 불러오는 중", 실패하면 "이름을 불러오지 못한 영상". 요청 수 문제는 보고에 적는다.
- 이동(R-12): 행의 "이 장면 보기"를 누르면 `sendMomentFeedback(jumped)` 뒤 `videoDetailPath(sourceId, { seekMs })`로 이동하고, 이동 상태(`location.state`)에 `{ momentId }`를 넣어 영상 상세가 재생 시간을 기록하게 한다.
- 오류(R-13): 400이면 질의 입력 옆에 `code` 문구(`SEARCH_QUERY_INVALID`), 404 `SEARCH_NOT_INDEXED`면 "아직 검색할 수 있게 준비되지 않았습니다.", `SEARCH_SOURCE_NOT_FOUND`면 영상을 찾을 수 없다는 안내, 5xx·네트워크 오류면 "다시 시도"(`refetch`).

### 주석 클립 (R-5, R-6)

- 결과의 `grounding.status`가 `NONE`이면 주석 자리를 두지 않는다. `REQUESTED`면 "주석 클립 만드는 중", `READY`·`FAILED`는 아래와 같다.
- `useGroundingLiveStatus(groundingIds)`가 `grounding.completed`를 구독한다(버퍼 재생 포함. 검색 응답보다 알림이 먼저 올 수 있다). `READY`면 `getGroundingClip`을 불러 "주석 클립 보기"를 보이고, `FAILED`면 "주석을 만들지 못했습니다."를 보인다. 응답 시점에 이미 `READY`인 결과는 바로 클립 정보를 불러온다.
- 받은 상태는 검색 결과 캐시를 고치지 않고 그 결과의 주석 query로 둔다(서버 데이터를 복사하지 않는다).
- "주석 클립 보기"(R-6): `ConfirmDialog`와 같은 `<dialog>`에 `<video controls src={clipUrl}>`, 대상어별 색 범례(`colors`의 색 견본 + 대상어 글자), 현재 재생 위치에 가장 가까운 `frames[].ptsMs`의 객체 수(대상어: n). `ptsMs`는 원본 영상 시각이고(계약 예시가 구간 `startMs`와 같은 40000에서 시작), 클립은 결과 구간 `startMs`에서 시작하므로 클립 재생 위치에 `startMs`를 더해 가장 가까운 프레임을 고른다. 클립 주소는 창이 열린 동안만 쓰고 닫으면 버린다(`gcTime: 0`).

### 이미지 검색 (R-8)

- `<input type="file" accept="image/jpeg,image/png,image/webp">`. `imageRules`가 MIME 형식과 5MB(5,242,880바이트) 이하를 확인하고, 벗어나면 요청하지 않고 이유를 보인다.
- `FormData`(`image`, 이 영상 범위면 `sourceId`) → `searchMomentsByImage`(mutation). 결과는 문장 검색과 같은 `MomentResults`로 그린다.
- 이미지 검색은 URL에 담을 수 없어서 결과를 `queryClient.setQueryData(searchQueryKeys.lastImage())`에 둔다. 영상 상세로 갔다 돌아오면 URL에 `?image=last`가 있을 때 그 캐시를 다시 보인다(R-12). 캐시가 없으면(새로고침) 다시 올리라고 안내한다.

### 영상에 질문 (R-9, R-10)

- 영상 상세의 `VideoQuestionPanel`: 질문 입력(1~200자) → `useAnswerQuestion(sourceId, q)`(`answerSourceQuestion`, 버튼을 눌렀을 때만 요청). 서버가 15초까지 걸릴 수 있어 "답을 만드는 중"을 보이고 같은 질문을 다시 보내지 않게 버튼을 막는다.
- 결과: 답, 판정 상태(`confirmed` 확인됨, `unverified` 미확인), 근거 구간 목록(썸네일·구간, 누르면 `controller.seek(seekMs)`), 관련 이벤트(유형·시각·설명, 누르면 `seek(seekMs)`), 한계(`limitations`) 목록.
- `answer`가 null(R-10): 답 자리에 "답을 만들지 못했고 근거만 보여 줍니다."와 근거. `degraded`가 있으면 이유도 함께.

### 이동·재생·맞음·틀림 기록 (R-11)

- `jumped`: 결과에서 이동할 때 한 번.
- `played`: 영상 상세가 `location.state.momentId`를 받으면 `usePlayedFeedback(momentId, controller)`가 재생 중 누적 시간(일시정지·이동 제외)을 세다가 5초를 넘는 순간 `played`(`playedMs`)를 한 번 보낸다.
- `correct`·`incorrect`: 결과 행의 맞음·틀림 버튼(`aria-pressed`). 누르면 표시를 먼저 바꾸고 기록을 한 번 보낸다. 같은 결과에서 다시 누르면 보내지 않는다.
- 한 번만 보낸 것을 결과(`momentId`·종류)마다 메모리 `Set`에 기억한다. 기록 실패는 화면 동작을 막지 않는다(표시는 유지).

## 5. 대안과 선택 이유

| 대안 | 장점 | 단점 | 선택 |
| --- | --- | --- | --- |
| 문장 검색 조건을 URL 쿼리 + query 캐시 | 뒤로 가기·새로고침·링크 공유, NFR-2(URL만 허용)와 맞음 | 질의가 브라우저 기록에 남음(spec이 허용한 범위) | ☑ |
| 검색 상태를 모듈 저장소에 | URL이 깔끔 | 새로고침하면 사라짐, 서버 데이터를 저장소에 복사 | |
| "영상에 질문" 패널을 `analysis`에, 호출 훅은 `search`에 | spec 영향 범위와 같음, API 소유는 search | feature 두 곳에 걸침 | ☑ |
| 패널까지 `search`에 | 한 feature 안에서 끝남 | spec 영향 범위와 다름 | |
| 전체 범위 영상 이름을 `getVideo`로 따로 | 계약 변경 없음 | 결과 50개면 요청이 최대 50번 | ☑ (보고에 적음) |
| 검색 응답에 영상 이름 추가 | 요청 한 번 | 계약 변경, search-service가 media 데이터를 들고 있어야 함 | |

## 6. 테스트 전략

- 단위: `searchParams`(URL 검증·기본값), `degraded`(이유별 문구), `imageRules`(jpg·png·webp, 5MB 경계, gif 거절), 응답 스키마(계약 예시 파싱).
- 컴포넌트: Testing Library + MSW, `[SPEC-033 R-n] ...`. 알림은 SPEC-031 `mocks/notifications.ts`로 `grounding.completed`를 밀어 넣는다. 이미지는 `userEvent.upload`. 재생 시간은 `<video>`에 `timeupdate`·`play`·`pause`를 일으키고 가짜 타이머로 센다.
- 흐름: `src/pages/SearchFlow.test.tsx`에서 검색 → 결과 → 영상 상세(`?t=`) → 뒤로 → 요청 수가 그대로인지(MSW 호출 수) 확인한다.
- E2E(Playwright): 문장 검색 → 결과 → 주석 클립 READY → 클립 창, 결과 누르면 상세 이동, 영상 질문(US-1·US-2·US-4, P1), 결과 50개 그리기 200ms(NFR-1), 360px 가로 스크롤 없음.

## 7. 리스크와 롤백

- 리스크
  - search-service 계약이 생산자 확인 전 초안이다. 바뀌면 생성 타입·스키마·픽스처를 다시 맞춘다.
  - 주석 클립의 `frames[].ptsMs`가 원본 영상 시각인지 클립 안 시각인지 계약 설명에 적혀 있지 않다. 계약 예시(구간 `startMs` 40000, 첫 프레임 `ptsMs` 40000)에 맞춰 원본 기준으로 구현한다. 생산자가 다르게 정하면 계약 설명을 고친 뒤 화면을 맞춘다.
  - 정밀 검색은 사용자별 상한이 있다. 화면이 같은 질의를 다시 보내지 않도록 캐시를 오래 둔다.
- 롤백 방법: `/search` 라우트를 ComingSoon으로 되돌리고 패널 조립을 빼면 된다.

## 8. 배포 고려사항

- 새 환경변수 없음.
- search-service가 배포되기 전에는 검색 화면이 오류 안내를 보인다.
