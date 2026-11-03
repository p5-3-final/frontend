---
spec: SPEC-006
repo: frontend
status: Approved
owner: <이름>
created: 2026-11-03
updated: 2026-11-03
---

# Plan: SPEC-006 원본 영상 재생 — frontend

- spec: docs 레포 `docs/specs/SPEC-006-video-playback/spec.md`
- 계약: docs 레포 `docs/contracts/openapi/media-service.yaml` 1.1.0 (`getVideo`, `getVideoPlayback`, `deleteVideo`)
- 관련: SPEC-005(업로드 화면, 목록, 삭제 확인 창), backend SPEC-006 구현(backend #35)

## 1. 요약

영상 상세 화면(`/analysis/videos/:videoId`)을 추가한다. 목록의 파일 이름을 누르면 이 화면으로 가고, 파일 정보와 원본 플레이어를 보여 준다. 플레이어는 media-service가 준 서명 재생 주소를 `<video controls>`의 `src`로 쓰고, 브라우저가 저장소에서 바로 읽는다. 재생할 수 없는 상태·형식·없는 영상은 각각 안내하고, 재생 주소가 만료되면 새 주소를 한 번 받아 보던 위치부터 이어서 재생한다. 새 의존성은 없다.

원본 관리는 `upload` feature가 맡고 있어(media API, 영상 모델, 목록, 삭제) 상세 화면과 원본 플레이어도 이 feature에 둔다. `player` feature는 정규화 사본·오버레이용 분석 화면 몫으로 남긴다(spec 1절).

## 2. 담당 요구사항

경로 약어: `U` = `src/features/upload`

| 요구사항 | 담당 모듈 / 컴포넌트 | 검증 테스트 |
| --- | --- | --- |
| R-6 | `U/components/VideoList`(파일 이름 링크), `src/app/routes.tsx` | `VideoList.test.tsx`, `src/pages/VideoDetailFlow.test.tsx`(새로고침처럼 주소로 바로 열기) |
| R-7 | `U/components/VideoDetail`, `U/api/useVideo` | `VideoDetail.test.tsx` |
| R-8 | `U/components/OriginalPlayer`, `U/api/useVideoPlayback` | `OriginalPlayer.test.tsx` |
| R-9 | `VideoDetail`(상태별 이유) | `VideoDetail.test.tsx`(재생 주소 요청을 보내지 않음) |
| R-10 | `OriginalPlayer`(`error` 이벤트 → 안내와 내려받기 링크) | `OriginalPlayer.test.tsx` |
| R-11 | `OriginalPlayer`(만료 판단 → 재발급 한 번 → 위치 복원) | `OriginalPlayer.test.tsx` |
| R-12 | `VideoDetail` | `VideoDetail.test.tsx` |
| R-13 | `VideoDetail`, `DeleteVideoDialog`(`onDeleted`), `U/api/useDeleteVideo` | `src/pages/VideoDetailFlow.test.tsx` |
| NFR-3 | `useVideoPlayback`(메모리 query 캐시만, 화면을 떠나면 버림) | `src/features/upload/api/playbackSecrets.test.tsx`(브라우저 저장소·콘솔에 서명 없음) |
| NFR-4 | 플레이어(기본 컨트롤), 내려받기 링크, 삭제 버튼 | `src/app/Keyboard.test.tsx`에 상세 화면 시나리오 추가 |
| NFR-5 | `VideoDetail`, `OriginalPlayer` | Playwright `video-detail.spec.ts`(360px 모바일 프로젝트에서 가로 스크롤 없음, 플레이어 너비 ≤ 화면 너비) |

## 3. 원칙 점검

| 원칙 | 준수 | 비고 |
| --- | --- | --- |
| I 스펙 우선 — spec이 Approved 상태인가 | ☑ | docs #41 (현재 Implementing, docs #45) |
| II 계약 우선 — 계약 변경이 먼저 머지됐는가 | ☑ | docs #43(1.1.0), `pnpm gen:api`로 타입 재생성 |
| III 테스트 우선 — 모든 R-*에 테스트가 매핑되고, 태스크가 요구사항 단위 TDD 사이클로 나뉘었는가 | ☑ | 2절, tasks.md |
| IV 서비스 자율성 — 다른 서비스 DB나 코드에 직접 의존하지 않는가 | ☑ | api-gateway API와 media-service가 준 저장소 주소만 쓴다 |
| V 단순성 — 새 의존성이나 추상화가 정당한가 | ☑ | 새 의존성 없음. 브라우저 기본 `<video controls>`를 쓴다 |
| VI 관측 가능성 — 로그, 추적, health를 갖췄는가 | ☑ | 브라우저 로그(`console`)는 쓰지 않는다(NFR-3) |
| VII 보안 — 입력 검증, 인가, 비밀값 처리를 했는가 | ☑ | URL의 `videoId`는 Zod(uuid)로 검증, 응답은 Zod로 검증, 서명 주소는 메모리 query 캐시에만 두고 화면을 떠나면 버린다 |
| VIII 문서·주석 — spec·계약·plan과 구현이 일치하고, 주석이 왜를 설명하는가 | ☑ | |
| IX GitOps — AWS 변경은 infra, 클러스터 변경은 gitops 레포를 거치는가 | ☑ | 해당 없음 |

## 4. 기술 설계

### 변경 대상

| 경로 | 변경 |
| --- | --- |
| `src/api/generated/media-service.ts` | `pnpm gen:api`로 1.1.0 반영 |
| `U/model/schemas.ts` | `videoPlaybackSchema`(계약 `VideoPlayback`) |
| `U/model/queryKeys.ts` | `lists()`, `detail(id)`, `playback(id)` |
| `U/api/mediaApi.ts` | `getVideo`, `getVideoPlayback` |
| `U/api/` | `useVideo.ts`, `useVideoPlayback.ts`. `useDeleteVideo`는 목록만 무효화하고 지운 영상의 상세·재생 캐시는 버린다 |
| `U/components/` | `VideoDetail.tsx`(정보·상태별 안내·삭제), `OriginalPlayer.tsx`(플레이어·재생 불가 안내·이어 재생), `VideoList.tsx`(파일 이름을 링크로), `DeleteVideoDialog.tsx`(`onDeleted` 추가) |
| `src/shared/lib/messages.ts` | `MEDIA_NOT_PLAYABLE`, 재생 불가 안내 문구 |
| `src/pages/VideoDetailPage.tsx`, `src/app/routes.tsx` | `/analysis/videos/:videoId` 라우트(lazy) |
| `mocks/handlers.ts`, `tests/e2e/fakeMedia.ts` | `getVideo`·`getVideoPlayback` 핸들러, 저장소 GET |

### 상세 화면 (`VideoDetail`)

- `useParams`의 `videoId`를 `z.uuid()`로 검증한다. 형식이 틀리면 요청 없이 R-12 안내를 보인다.
- `useVideo(videoId)` → `getVideo`.
  - 로딩·오류·성공을 모두 처리한다. 오류 `code`가 `MEDIA_VIDEO_NOT_FOUND`면 "이미 삭제되었거나 찾을 수 없는 영상입니다."와 목록으로 돌아가는 링크(R-12). 그 밖의 오류는 공통 문구.
  - 파일 이름(제목), 크기, 형식, 상태 이름(SPEC-005 `VIDEO_STATUS_NAMES`), 올린 시각, 업로드 완료 시각을 `<dl>`로 보인다(R-7). 완료 시각이 없으면 "-".
- 상태가 업로드 완료 이후(`UPLOADED`, `NORMALIZING`, `READY`, `REJECTED`)면 `OriginalPlayer`, 아니면 이유를 보인다(R-8, R-9).
  - `UPLOADING`: "업로드가 끝나지 않아 재생할 수 없습니다."
  - `EXPIRED`: "24시간 안에 업로드를 마치지 않아 만료된 영상입니다."
  - 이때는 재생 주소를 요청하지 않는다(어차피 409).
- 삭제 버튼 → SPEC-005 `DeleteVideoDialog`. 성공하면 `onDeleted`에서 목록(`/analysis`)으로 `replace` 이동한다(R-13). 실패 안내는 SPEC-005 R-20과 같이 창 안에 보인다.
- 목록으로 돌아가는 링크를 제목 위에 둔다.

### 원본 플레이어 (`OriginalPlayer`)

- `useVideoPlayback(videoId)` → `getVideoPlayback`. `staleTime: Infinity`(자동 재요청 없음), `gcTime: 0`(화면을 떠나면 서명 주소를 버림, NFR-3). 409 `MEDIA_NOT_PLAYABLE`이면 R-9와 같은 안내(목록과 상세 사이에 상태가 바뀐 경우).
- `<video controls playsInline preload="metadata" src={url}>`, 너비 100%, 높이는 영상 비율을 따르고 최대 화면 높이의 70%(NFR-5). 배경은 검정.
- `error` 이벤트(R-10, R-11)
  - 현재 시각이 `expiresAt - 60초` 이후이고 이 주소로 아직 재발급하지 않았으면 만료로 본다. 보던 위치(`currentTime`)를 기억하고 재생 주소를 다시 받는다. 새 주소로 `src`를 바꾸고 `loadedmetadata`에서 위치를 되돌린 뒤 재생 중이었으면 다시 재생한다(R-11). 재발급은 한 번만 한다.
  - 그 밖의 경우(만료 전 오류, 재발급 뒤에도 오류)는 브라우저가 이 형식·코덱을 재생하지 못한 것으로 본다. 플레이어 대신 "이 브라우저에서 재생할 수 없는 영상입니다. 원본을 내려받아 다른 플레이어로 확인해 주세요."와 "원본 내려받기" 링크(`downloadUrl`)를 보인다(R-10).
  - 60초 여유는 브라우저와 저장소의 시계 차이 때문이다. 서명 만료는 저장소 시계로 판단하므로 브라우저가 조금 늦게 가도 만료로 볼 수 있게 한다.
  - 만료 판단을 HTTP 상태로 하지 않는 이유: `<video>`는 응답 상태를 알려 주지 않고, 브라우저마다 오류 코드(`MEDIA_ERR_NETWORK`, `MEDIA_ERR_SRC_NOT_SUPPORTED`)가 다르다.
- 내려받기 링크는 재생 중에도 플레이어 아래에 둔다(재생은 되지만 원본 파일이 필요한 경우).

### 목록에서 이동 (R-6)

- `VideoList`의 파일 이름을 `<Link to="/analysis/videos/{id}">`로 바꾼다. 행 전체를 링크로 만들지 않는 이유는 행 안에 삭제 버튼이 있어서다(링크 안의 버튼은 접근성 위반).

### API

`getVideo`, `getVideoPlayback`, `deleteVideo` (`media-service.yaml` 1.1.0). 응답은 생성 타입에 `satisfies`한 Zod 스키마로 검증한다.

## 5. 대안과 선택 이유

| 대안 | 장점 | 단점 | 선택 |
| --- | --- | --- | --- |
| 브라우저 기본 `<video controls>` | 의존성 없음, 키보드·접근성 기본 지원 | 브라우저마다 모양이 다름 | ☑ |
| 플레이어 라이브러리(video.js 등) | 일관된 UI | 새 의존성, 원본 재생에는 기능이 과함 | |
| 만료 전에 미리 주소 재발급(타이머) | 오류 전에 바꿈 | 재생 중 `src`를 바꾸면 끊김, 타이머 관리 | |
| 오류가 나면 만료 여부로 판단해 재발급 | 필요할 때만 한 번 | 만료 직전 다른 오류도 재발급 한 번을 거침 | ☑ |

## 6. 테스트 전략

- 단위·컴포넌트: Testing Library + MSW. `[SPEC-006 R-n] ...` 이름.
  - jsdom의 `<video>`는 미디어를 읽지 않는다. 재생 실패·만료는 `fireEvent.error(video)`로, 위치는 `currentTime` 대입과 `fireEvent.loadedMetadata`로 흉내 낸다. `play()`·`pause()`는 jsdom이 구현하지 않아 테스트 설정에서 대체한다.
  - 시각은 `vi.setSystemTime`으로 `expiresAt` 앞뒤를 만든다.
- 흐름: `src/pages/VideoDetailFlow.test.tsx`에서 라우터로 목록 → 상세 → 삭제 → 목록, 주소로 바로 열기.
- E2E(Playwright, desktop·360px): `fakeMedia.ts`에 상세·재생 주소와 저장소 GET을 더해 목록 → 상세 이동, 정보·플레이어 표시, 가로 스크롤 없음. Playwright Chromium은 H.264 mp4를 재생하지 못하므로, 가짜 저장소가 주는 mp4는 R-10 안내와 내려받기 링크가 보이는지로 확인한다.
- 시연: 로컬 compose + `pnpm dev` + 데스크톱 Chrome으로 mp4를 올리고 상세 화면에서 재생, mkv·avi는 R-10 안내와 내려받기를 확인한다(성공 지표).

## 7. 리스크와 롤백

- 리스크
  - 만료 판단은 브라우저 시계에 기댄다. 시계가 크게 틀린 PC에서는 만료 뒤 오류가 R-10 안내로 보일 수 있다. 이때는 화면을 새로고침하면 새 주소를 받는다.
  - 운영 S3 CORS는 `<video>`(교차 출처 속성 없음) 재생에 필요 없다. 나중에 `crossOrigin`이 필요해지면 GET·Range를 허용해야 한다(backend plan 8절).
- 롤백: 라우트와 링크를 되돌리면 된다(백엔드 API는 남아도 무해).

## 8. 배포 고려사항

- 새 환경변수 없음.
- nginx에 CSP가 없어 저장소 주소를 따로 허용할 필요가 없다. 나중에 CSP를 넣으면 `media-src`에 저장소 주소를 넣는다.
