---
spec: SPEC-035
repo: frontend
updated: 2026-11-07
---

# Tasks: SPEC-035 품질 화면(검토 큐·Golden Set·평가 실행·처리 단계·데이터셋 가져오기) — frontend

규칙

- 태스크 하나는 커밋 하나에서 PR 하나 사이의 크기로 잡는다(반나절 이하).
- `[P]`는 다른 태스크와 병렬로 진행할 수 있다는 뜻이다. `[R-n]`은 담당 요구사항이다.
- 태스크 하나는 요구사항 하나의 Red → Green → Refactor 사이클이다. 테스트와 구현을 같은 태스크에서 끝내서, 커밋마다 테스트가 통과하는 상태를 유지한다.
- 완료한 태스크는 `[x]`로 바꾼다. 커밋한 뒤에는 커밋 해시를 덧붙인다.

경로 약어: `Q` = `src/features/quality`

선행: SPEC-031 T001(계약 lock 4.0.0과 생성 코드), T022(auth `useHasRole`·`useMe` 내보내기)

## Phase 1: 준비

- [x] T001 quality 응답 Zod 스키마(생성 타입 `satisfies`, `analysis`는 SPEC-031 2차 스키마), query key, API 함수, 계약 예시 픽스처, `/quality/*` lazy 라우트와 탭 틀 — 테스트 `Q/model/schemas.test.ts`(계약 예시 파싱), 구현 `Q/model/{schemas,queryKeys}.ts`, `Q/api/qualityApi.ts`, `mocks/quality.ts`, `src/pages/QualityPage.tsx`, `src/app/routes.tsx`, `Q/index.ts`

## Phase 2: US-1 검토 큐 처리 (P1)

- [x] T002 [R-1] OPERATOR에게만 "품질" 메뉴, USER는 숨김, 품질 경로로 직접 들어오면 권한 없음 — 테스트 `src/app/layout/AppLayout.test.tsx`, `Q/components/RequireOperator.test.tsx`, 구현 `src/app/layout/{menu.ts,Sidebar.tsx,MobileNav.tsx}`, `Q/components/RequireOperator.tsx`
- [x] T003 [R-2] 검토 큐 목록: 상태·사유·유형 거르기(URL), 만든 순서 쪽 나눔, 유형·구간·판정 방식·사유·상태·맡은 사람("나" 표시) — 테스트 `Q/components/review/ReviewQueue.test.tsx`, 구현 `Q/components/review/ReviewQueue.tsx`, `Q/api/useReviewItems.ts`
- [x] T004 [R-3] "맡기" 성공하면 상세, 409면 "이미 다른 사람이 맡음"·"이미 라벨됨"과 목록 다시 — 테스트 `ReviewQueue.test.tsx`, 구현 `Q/api/useAssignReviewItem.ts`, `ReviewQueue.tsx`, `src/shared/lib/messages.ts`
- [x] T005 [R-4] 검토 상세: 근거 프레임(서명 주소), 판정 결과, 판정 방식, 판정 이유, 이미지가 만료돼 못 읽으면 상세를 한 번 다시 불러옴 — 테스트 `Q/components/review/ReviewDetail.test.tsx`, 구현 `Q/components/review/{ReviewDetail,EvidenceFrames}.tsx`, `Q/api/useReviewItem.ts`
- [x] T006 [R-5] 라벨 입력은 맡은 사람에게만, 이벤트 유무가 켜지면 유형·시작·끝 필수와 끝 > 시작, 꺼지면 유형 비움 — 테스트 `Q/model/labelSchema.test.ts`, `Q/components/review/ReviewLabelForm.test.tsx`, 구현 `Q/model/labelSchema.ts`, `Q/components/review/ReviewLabelForm.tsx`
- [x] T007 [R-6] "저장 후 다음": 저장하고 같은 거르기의 다음 `UNASSIGNED`를 맡아 열기(409면 다음 후보), 없으면 "남은 항목 없음" — 테스트 `ReviewDetail.test.tsx`, 구현 `Q/api/useLabelAndNext.ts`, `ReviewDetail.tsx`
- [x] T008 [R-7] "내려놓기"하고 목록으로 — 테스트 `ReviewDetail.test.tsx`, 구현 `Q/api/useReleaseReviewItem.ts`, `ReviewDetail.tsx`
- [x] T009 [R-20] 품질 API 403이면 권한 없음, 5xx·네트워크면 다시 시도 — 테스트 `Q/components/QualityError.test.tsx`, `src/shared/lib/messages.test.ts`, 구현 `Q/components/QualityError.tsx`, `messages.ts`

## Phase 3: US-2 Golden Set 버전 확정 (P1)

- [x] T010 [R-8] Golden Set 목록(이름·분할·출처·초안 수·최신 버전·기준 실행)과 만들기(이름 패턴·분할·설명), 이름 중복 409 안내 — 테스트 `Q/components/golden/GoldenSetList.test.tsx`, `Q/components/golden/CreateGoldenSetForm.test.tsx`, 구현 `Q/components/golden/{GoldenSetList,CreateGoldenSetForm}.tsx`, `Q/model/goldenSetSchema.ts`, `Q/api/{useGoldenSets,useCreateGoldenSet}.ts`
- [x] T011 [R-9] 라벨된 검토 항목에서 출처가 검토인 세트로 "Golden Set에 넣기", 409면 이유(라벨 없음·uncertain·이미 들어 있음·가져온 세트) — 테스트 `Q/components/review/AddToGoldenSet.test.tsx`, 구현 `Q/components/review/AddToGoldenSet.tsx`, `Q/api/useAddGoldenSetEntry.ts`
- [x] T012 [R-10] Golden Set 상세: 초안 항목(빼기), 확정 버전 목록, 확인 창 뒤 "버전 확정", 409면 초안 없음·확정 진행 중 — 테스트 `Q/components/golden/GoldenSetDetail.test.tsx`, 구현 `Q/components/golden/GoldenSetDetail.tsx`, `Q/api/{useGoldenSet,useGoldenSetEntries,useGoldenSetVersions,useDeleteGoldenSetEntry,useFreezeGoldenSet}.ts`

## Phase 4: US-3 Gate 실패 원인 보기 (P1)

- [x] T013 [R-12] 평가 실행 목록: 받은 시각 내림차순, Golden Set·버전·종류·트리거·Gate 결과(통과·실패·기준 없음), Golden Set 거르기 — 테스트 `Q/components/runs/EvaluationRunList.test.tsx`, 구현 `Q/components/runs/EvaluationRunList.tsx`, `Q/api/useEvaluationRuns.ts`
- [x] T014 [R-13] 평가 실행 상세: 버전 정보, Gate 결과, 실패 지표(이름·유형·기준값·실행값·차이)를 맨 위 강조, 그 아래 전체 지표를 이름·유형 순 — 테스트 `Q/model/gate.test.ts`, `Q/components/runs/EvaluationRunDetail.test.tsx`, 구현 `Q/model/gate.ts`, `Q/components/runs/EvaluationRunDetail.tsx`, `Q/api/useEvaluationRun.ts`
- [x] T015 [R-11] "기준으로 지정"으로 그 실행의 Golden Set 기준 실행을 바꾸고, 409면 다른 세트의 실행이라는 안내 — 테스트 `EvaluationRunDetail.test.tsx`, 구현 `Q/api/useSetBaseline.ts`, `EvaluationRunDetail.tsx`

## Phase 5: US-4 처리 단계 지연 보기 (P2)

- [x] T016 [R-14] 영상 ID로 단계 분해 표(합계 내림차순), 404면 "측정 기록 없음(90일 보존)" — 테스트 `Q/components/stages/SourceStageReport.test.tsx`, 구현 `Q/components/stages/SourceStageReport.tsx`, `Q/api/useSourceStageReport.ts`
- [x] T017 [R-15] 단계·기간·버전 키·값으로 추이를 조회해 날짜별 p50·p95 선 그래프(SVG)와 표, 90일을 넘으면 요청 없이 이유 — 테스트 `Q/model/chartScale.test.ts`, `Q/model/trendQuery.test.ts`, `Q/components/stages/StageTrend.test.tsx`, 구현 `Q/model/{chartScale,trendQuery}.ts`, `Q/components/stages/{StageTrend,TrendChart}.tsx`, `Q/api/useStageTrend.ts`

## Phase 6: US-5 데이터셋 가져오기 (P2)

- [x] T018 [R-16] 매니페스트 경로·평가 비율·분할 시드로 가져오기 시작, 409면 "같은 매니페스트를 가져오는 중" — 테스트 `Q/components/datasets/CreateImportForm.test.tsx`, 구현 `Q/components/datasets/CreateImportForm.tsx`, `Q/model/importSchema.ts`, `Q/api/useCreateDatasetImport.ts`
- [x] T019 [R-17] 진행 중인 가져오기·내보내기가 있으면 5초마다 다시 불러오고, 끝나면 멈춤 — 테스트 `Q/model/polling.test.ts`, `Q/components/datasets/DatasetImports.test.tsx`(가짜 타이머), 구현 `Q/model/polling.ts`, `Q/components/datasets/DatasetImports.tsx`, `Q/api/{useDatasetImports,useFeatureExport}.ts`
- [x] T020 [R-18] 가져오기 상세: 상태, 개수, 만든 Golden Set 버전(세트 상세 링크), 오류 목록 — 테스트 `Q/components/datasets/DatasetImportDetail.test.tsx`, 구현 `Q/components/datasets/DatasetImportDetail.tsx`, `Q/api/useDatasetImport.ts`
- [x] T021 [R-19] 특징 내보내기: Golden Set·기간(최대 90일) 중 하나만 받도록 입력을 막고 시작, 완료되면 파일 경로·줄 수·영상 수 — 테스트 `Q/components/datasets/FeatureExportPanel.test.tsx`, 구현 `Q/components/datasets/FeatureExportPanel.tsx`, `Q/model/exportSchema.ts`, `Q/api/useCreateFeatureExport.ts`

## Phase 7: 마무리

- [ ] T022 [NFR-1] [NFR-2] E2E: 맡기 → 라벨 → 저장 후 다음(저장 응답 뒤 300ms 안에 다음 항목), Golden Set 넣기 → 버전 확정, Gate 실패 표시, 추이 그래프, USER 첫 화면이 품질 묶음을 받지 않음 — 테스트 `tests/e2e/quality.spec.ts`, 가짜 API `tests/e2e/fakeQuality.ts`
- [ ] T023 키보드만으로 맡기 → 라벨 입력 → 저장 후 다음, 확인 창 — 테스트 `src/app/Keyboard.test.tsx`
- [ ] T024 계약과 구현 일치 확인(생성 타입 diff 없음, 픽스처 typecheck), README, 로컬 compose의 quality-service(또는 mock 모드) 시연으로 성공 지표 확인

## Phase 7: v5.1 추가(계약 묶음 4.0.0)

- [x] T025 [R-21] `reviewReason`(열린 목록·이름·안내), 검토 큐 사유 필터, 상세의 재분석 안내 — 테스트 `reviewReason.test.ts`, `ReviewFilters.test.tsx`, `ReviewDetail.test.tsx`, 구현 `Q/model/reviewReason.ts`, `Q/components/review/ReviewFilters.tsx`, `Q/components/review/ReviewDetail.tsx`, `src/shared/lib/messages.ts`
- [x] T026 [R-22] `useAlertReport`와 처리 단계 탭의 긴급 알림 지표(p50·p95·dismissed 비율·미해결) — 테스트 `AlertReportPanel.test.tsx`, 구현 `Q/api/useAlertReport.ts`, `Q/components/stages/AlertReportPanel.tsx`, `mocks/quality.ts`

## 완료 조건 (Definition of Done)

- [ ] 이 레포가 담당하는 모든 R-*, NFR-*의 테스트 통과
- [ ] typecheck, lint, format:check, test, e2e 통과
- [ ] plan.md와 실제 구현이 일치함
- [ ] docs 레포 spec 상태 갱신 (`Implementing` / `Done`)
