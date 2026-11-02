---
spec: SPEC-002
repo: frontend
updated: 2026-11-02
---

# Tasks: SPEC-002 인증 화면과 앱 기본 레이아웃 — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `A` = `src/features/auth`, `L` = `src/app/layout`

## Phase 1: 준비

- [x] T001 의존성 `lucide-react`, `pretendard` 추가, 디자인 토큰(`@theme`)과 글꼴 — `src/app/index.css` (7284698)
- [x] T002 [P] [NFR-3] ProblemDetail → `ApiError` 변환, 오류 문구 — 테스트 `src/shared/api/problem.test.ts`, `src/shared/lib/messages.test.ts`, 구현 `src/shared/api/problem.ts`, `src/shared/lib/messages.ts` (7284698)
- [x] T003 [NFR-1] 메모리 세션과 재발급 단일 요청 — 테스트 `src/shared/api/session.test.ts`, 구현 `src/shared/api/session.ts`, 테스트용 MSW 서버 `tests/{server,setup}.ts` (7284698)
- [x] T004 API 클라이언트(기본 주소, 인증 헤더, 응답 스키마 검증, ApiError) — 테스트 `src/shared/api/client.test.ts`, 구현 `src/shared/api/{client,config}.ts` (7284698)

## Phase 2: US-1 가입 (P1)

- [x] T005 [R-2] 입력 규칙 위반은 요청하지 않고 칸 옆에 이유 표시 — 테스트 `A/model/schemas.test.ts`, `A/components/SignUpForm.test.tsx`, 구현 `A/model/schemas.ts`, `A/components/SignUpForm.tsx` (bf6d52d)
- [x] T006 [R-3] `AUTH_EMAIL_DUPLICATED`면 이메일 칸에 안내 — 테스트 `SignUpForm.test.tsx`, 구현 `SignUpForm.tsx`, `A/api/useSignUp.ts` (bf6d52d)
- [x] T007 [R-1] 가입 성공 시 안내와 함께 로그인 화면, 이메일 채움 — 테스트 `src/pages/SignUpFlow.test.tsx`, 구현 `src/pages/{SignUpPage,LogInPage}.tsx`, 라우터·Provider `src/app/{routes,AppProviders,App}.tsx`, 가입 state `A/model/signedUpState.ts`, 테스트 렌더 도우미 `tests/render.tsx` (bf6d52d)

## Phase 3: US-2 로그인과 레이아웃 (P1)

- [x] T008 [R-13] [R-14] 앱 기본 레이아웃(사이드바, 상단 바), 현재 메뉴 선택 표시 — 테스트 `L/AppLayout.test.tsx`, 구현 `L/{AppLayout,Sidebar,TopBar,menu}.tsx`, `src/app/routes.tsx` (2059e35)
- [x] T009 [R-4] 로그인 성공 시 영상 분석 화면, 상단 바에 닉네임 — 테스트 `src/pages/LogInFlow.test.tsx`, 구현 `A/components/{LogInForm,UserMenu}.tsx`, `A/api/{useLogIn,useMe}.ts`, `A/hooks/useSessionStatus.ts`, MSW 도우미 `mocks/handlers.ts` (2059e35)
- [x] T010 [R-5] `AUTH_INVALID_CREDENTIALS` 안내 — 테스트 `A/components/LogInForm.test.tsx`, 구현 `LogInForm.tsx` (2059e35)
- [x] T011 [R-6] `AUTH_ACCOUNT_LOCKED`, `GATEWAY_RATE_LIMITED` 안내 — 테스트 `LogInForm.test.tsx`, 구현 `LogInForm.tsx` (2059e35)
- [x] T012 [R-7] 로그인 필요 화면 → 로그인 → 원래 주소로 복귀, 외부 주소 `redirect` 무시 — 테스트 `A/components/RequireAuth.test.tsx`, 구현 `A/components/RequireAuth.tsx`, `A/model/redirect.ts`, `LogInPage.tsx` (2059e35)

## Phase 4: US-3 로그인 유지 (P1)

- [x] T013 [R-8] 앱 시작 시 재발급으로 로그인 복원(StrictMode에서도 재발급 1회) — 테스트 `A/components/SessionBootstrap.test.tsx`, 구현 `A/components/{SessionBootstrap,GuestOnly}.tsx`, `src/app/AppProviders.tsx`, StrictMode 렌더 `tests/render.tsx` (0412ed6)
- [x] T014 [R-9] 401 `AUTH_TOKEN_EXPIRED`면 재발급 후 같은 요청 1회 재시도 — 테스트 `src/shared/api/client.test.ts`, 구현 `client.ts` (0412ed6)
- [x] T015 [R-10] 재발급 실패 시 로그인 상태를 지우고 로그인 화면 — 테스트 `client.test.ts`, `RequireAuth.test.tsx`, 구현 `client.ts`, `session.ts` (0412ed6)

## Phase 5: US-4 내 정보와 로그아웃 (P1)

- [x] T016 [R-11] 사용자 메뉴에 닉네임, 이메일, 역할 — 테스트 `A/components/UserMenu.test.tsx`, 구현 `A/components/UserMenu.tsx` (2a4cdb5)
- [x] T017 [R-12] 로그아웃 요청, 상태 삭제, 로그인 화면(서버 실패해도) — 테스트 `UserMenu.test.tsx`, 구현 `UserMenu.tsx`, `A/api/useLogOut.ts` (2a4cdb5)

## Phase 6: US-5 앱 둘러보기 (P2)

- [x] T018 [P] [R-15] 준비 중 메뉴 화면 — 테스트 `src/pages/ComingSoonPage.test.tsx`, 구현 `ComingSoonPage.tsx`
- [x] T019 [P] [R-16] 영상 분석 빈 화면 — 테스트 `src/pages/AnalysisPage.test.tsx`, 구현 `AnalysisPage.tsx`, `src/shared/ui/EmptyState.tsx`

## Phase 7: 마무리

- [ ] T020 [NFR-2] 키보드만으로 가입·로그인·메뉴·로그아웃 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T021 [NFR-4] [NFR-5] 360px 가로 스크롤 없음, 1024px 미만 메뉴 버튼(서랍) — 테스트 `tests/e2e/responsive.spec.ts`, 구현 `L/MobileNav.tsx`, CI `e2e` job
- [ ] T022 E2E 흐름(가입 → 로그인 → 새로고침 → 로그아웃) — 테스트 `tests/e2e/auth-flow.spec.ts`
- [ ] T023 `.env.example`(`VITE_API_BASE_URL`), README, 로컬 compose로 실제 시연

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
