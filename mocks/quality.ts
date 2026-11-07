// SPEC-035 quality-service 공개 API 픽스처와 MSW 핸들러. 응답은 계약 quality-service.yaml 2.0.0 예시를 생성 타입으로 옮긴 것이다.
// 계약이 바뀌면 생성 타입이 바뀌어 여기서 typecheck가 실패한다.
import { http, HttpResponse } from "msw";
import { z } from "zod";
import type { components } from "../src/api/generated/quality-service";
import { problem } from "./handlers";

type Schemas = components["schemas"];
export type ReviewItemBody = Omit<Schemas["ReviewItem"], "analysis"> & {
  analysis: Record<string, unknown> | null;
};
export type GoldenSetBody = Schemas["GoldenSet"];
export type GoldenSetEntryBody = Schemas["GoldenSetEntry"];
export type GoldenSetVersionBody = Schemas["GoldenSetVersion"];
export type EvaluationRunBody = Schemas["EvaluationRun"];
export type DatasetImportBody = Schemas["DatasetImport"];
export type FeatureExportBody = Schemas["FeatureExport"];

export const QUALITY_API = "http://localhost:8080/api/v1/quality";
/** 계약 예시의 운영자(assigneeId·frozenBy·requestedBy) */
export const OPERATOR_ID = "0192f0c4-6d1e-7a3b-9c2d-1e2f3a4b5c6d";
export const OTHER_OPERATOR_ID = "0192f0c4-0000-7000-8000-000000000099";
export const REVIEW_ITEM_ID = "0192fa00-0000-5000-8000-000000000001";
export const REVIEW_ITEM_ID_2 = "0192fa00-0000-5000-8000-000000000002";
export const REVIEW_ITEM_ID_3 = "0192fa00-0000-5000-8000-000000000003";
export const GOLDEN_SET_ID = "0192fb00-0000-7000-8000-000000000001";
export const IMPORT_GOLDEN_SET_ID = "0192fb00-0000-7000-8000-000000000012";
export const RUN_ID = "0192fc00-0000-7000-8000-000000000002";
export const BASELINE_RUN_ID = "0192fc00-0000-7000-8000-000000000001";
export const STAGE_SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
export const IMPORT_ID = "0192fd00-0000-7000-8000-000000000001";
export const EXPORT_ID = "0192fe00-0000-7000-8000-000000000001";
export const SIGNED_FRAME =
  "http://localhost:8333/vlm-media/blurred/ev-1.jpg?X-Amz-Signature=frame-sig";

/** 계약 events/_vlm-analysis.schema.json 예시 */
export function reviewAnalysisBody(): Record<string, unknown> {
  return {
    eventType: "ppe_missing",
    eventDetected: true,
    verificationStatus: "confirmed",
    description: "크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.",
    beforeState: null,
    afterState: "안전모 미착용 작업자 작업 중",
    riskDetected: true,
    riskType: "ppe_missing",
    riskReason: "안전모 미착용",
    solution: "안전관리자 확인 필요",
    severity: "high",
    evidenceStart: 95.0,
    evidenceEnd: 100.0,
  };
}

/** 계약 ReviewItem 예시. 기본은 아직 아무도 맡지 않은 항목이다. */
export function reviewItemBody(overrides: Partial<ReviewItemBody> = {}): ReviewItemBody {
  return {
    itemId: REVIEW_ITEM_ID,
    eventId: "0192f300-0000-5000-8000-000000000101",
    sourceId: STAGE_SOURCE_ID,
    jobId: "0192f0d5-0000-7000-8000-000000000001",
    eventType: "ppe_missing",
    startMs: 95000,
    endMs: 105000,
    judgmentMethod: "rule+vlm+escalate",
    reason: "review_required",
    reviewReasons: ["judgments_disagree"],
    evidenceFrameKeys: ["sources/x/blurred/ev-1.jpg"],
    evidenceFrameUrls: [SIGNED_FRAME],
    analysis: reviewAnalysisBody(),
    status: "UNASSIGNED",
    assigneeId: null,
    assignedAt: null,
    label: null,
    labeledAt: null,
    createdAt: "2026-11-06T09:00:00Z",
    ...overrides,
  };
}

/** 계약 ReviewLabel 예시 */
export function reviewLabelBody(
  overrides: Partial<Schemas["ReviewLabel"]> = {},
): Schemas["ReviewLabel"] {
  return {
    verdict: "incorrect",
    eventPresent: true,
    eventType: "ppe_missing",
    startMs: 96000,
    endMs: 104000,
    severity: "medium",
    note: "안전모는 썼고 조끼만 없음",
    ...overrides,
  };
}

/** 계약 GoldenSet 예시(검토 출처) */
export function goldenSetBody(overrides: Partial<GoldenSetBody> = {}): GoldenSetBody {
  return {
    setId: GOLDEN_SET_ID,
    name: "ppe-eval",
    split: "eval",
    description: "보호구 평가 세트",
    draftEntryCount: 0,
    latestVersion: 3,
    baselineRunId: BASELINE_RUN_ID,
    createdAt: "2026-11-06T09:00:00Z",
    origin: "review",
    ...overrides,
  };
}

export function goldenSetEntryBody(
  overrides: Partial<GoldenSetEntryBody> = {},
): GoldenSetEntryBody {
  return {
    entryId: "0192fb10-0000-7000-8000-000000000001",
    setId: GOLDEN_SET_ID,
    reviewItemId: REVIEW_ITEM_ID_3,
    sourceId: STAGE_SOURCE_ID,
    eventId: "0192f300-0000-5000-8000-000000000103",
    label: reviewLabelBody(),
    addedAt: "2026-11-06T10:10:00Z",
    ...overrides,
  };
}

export function goldenSetVersionBody(
  overrides: Partial<GoldenSetVersionBody> = {},
): GoldenSetVersionBody {
  return {
    setId: GOLDEN_SET_ID,
    version: 3,
    entryCount: 13,
    manifestKey: `golden/${GOLDEN_SET_ID}/v3/manifest.json`,
    frozenAt: "2026-11-06T11:00:00Z",
    frozenBy: OPERATOR_ID,
    ...overrides,
  };
}

/** 계약 EvaluationRun 예시(Gate 실패) */
export function evaluationRunBody(overrides: Partial<EvaluationRunBody> = {}): EvaluationRunBody {
  return {
    runId: RUN_ID,
    goldenSetId: GOLDEN_SET_ID,
    goldenSetVersion: 3,
    kind: "event",
    versions: {
      taxonomy: "v2",
      detectorProfile: "detect-v1",
      modelId: "gpt-6.1-terra",
      promptVersion: "event_judge@0123456789ab",
      embeddingModel: null,
    },
    metrics: [
      { name: "judge_precision", eventType: "ppe_missing", value: 0.74, higherIsBetter: true },
      { name: "candidate_recall", eventType: "ppe_missing", value: 0.81, higherIsBetter: true },
    ],
    startedAt: "2026-11-06T11:10:00Z",
    finishedAt: "2026-11-06T11:20:00Z",
    trigger: "ci",
    commitSha: "a6e8967",
    gate: {
      baselineRunId: BASELINE_RUN_ID,
      passed: false,
      tolerance: 0.02,
      failures: [
        { name: "judge_precision", eventType: "ppe_missing", baseline: 0.78, value: 0.74 },
      ],
    },
    receivedAt: "2026-11-06T11:20:01Z",
    ...overrides,
  };
}

export function sourceStageReportBody(): Schemas["SourceStageReport"] {
  return {
    sourceId: STAGE_SOURCE_ID,
    recordCount: 42,
    stages: [
      {
        path: "normalize.handle/normalize.transcode",
        stageId: "normalize.transcode",
        count: 1,
        totalMs: 4200,
        p50Ms: 4200,
        p95Ms: 4200,
        errorCount: 0,
      },
      {
        path: "event-analyzer.handle/analyzer.judge",
        stageId: "analyzer.judge",
        count: 3,
        totalMs: 9120.5,
        p50Ms: 2950.0,
        p95Ms: 3400.0,
        errorCount: 1,
      },
    ],
  };
}

export function stageTrendBody(
  overrides: Partial<Schemas["StageTrend"]> = {},
): Schemas["StageTrend"] {
  return {
    stageId: "analyzer.judge",
    from: "2026-11-01",
    to: "2026-11-06",
    versionKey: "modelId",
    versionValue: "gpt-6.1-terra",
    days: [
      { date: "2026-11-05", count: 98, p50Ms: 2800.0, p95Ms: 3300.0, errorCount: 0 },
      { date: "2026-11-06", count: 120, p50Ms: 2900.0, p95Ms: 3500.0, errorCount: 1 },
    ],
    ...overrides,
  };
}

export function alertReportBody(
  overrides: Partial<Schemas["AlertReport"]> = {},
): Schemas["AlertReport"] {
  return {
    from: "2026-11-01",
    to: "2026-11-06",
    cameraId: null,
    days: [
      {
        date: "2026-11-06",
        pendingCount: 14,
        confirmedCount: 9,
        dismissedCount: 5,
        firstAlertP50Ms: 1200.0,
        firstAlertP95Ms: 1900.0,
        judgeP50Ms: 3100.0,
        judgeP95Ms: 4800.0,
      },
    ],
    ...overrides,
  };
}

/** 계약 DatasetImport 예시(일부 영상 실패로 완료) */
export function datasetImportBody(overrides: Partial<DatasetImportBody> = {}): DatasetImportBody {
  return {
    importId: IMPORT_ID,
    datasetName: "physicalai-events",
    manifestKey: "imports/physicalai-2026-11/manifest.json",
    evalRatio: 0.2,
    splitSeed: 7,
    status: "COMPLETED",
    counts: { videos: 120, registered: 119, failed: 1, labels: 3400, dev: 95, eval: 24 },
    goldenSets: {
      devSetId: "0192fb00-0000-7000-8000-000000000011",
      evalSetId: IMPORT_GOLDEN_SET_ID,
      devVersion: 1,
      evalVersion: 1,
    },
    errors: [
      {
        externalId: "clip-0077",
        code: "QUALITY_IMPORT_VIDEO_NOT_FOUND",
        message: "videos/clip-0077.mp4 없음",
      },
    ],
    requestedBy: OPERATOR_ID,
    createdAt: "2026-11-06T12:00:00Z",
    finishedAt: "2026-11-06T12:30:00Z",
    ...overrides,
  };
}

export function featureExportBody(overrides: Partial<FeatureExportBody> = {}): FeatureExportBody {
  return {
    exportId: EXPORT_ID,
    status: "COMPLETED",
    goldenSetId: IMPORT_GOLDEN_SET_ID,
    from: null,
    to: null,
    fileKey: `exports/${EXPORT_ID}/features.jsonl`,
    rowCount: 310,
    sourceCount: 24,
    createdAt: "2026-11-06T13:00:00Z",
    finishedAt: "2026-11-06T13:01:00Z",
    ...overrides,
  };
}

export function pageBody<T>(items: T[], page = 0, size = 20) {
  return {
    items: items.slice(page * size, (page + 1) * size),
    page: {
      page,
      size,
      totalElements: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
    },
  };
}

export interface QualityFixture {
  reviewItems?: ReviewItemBody[];
  goldenSets?: GoldenSetBody[];
  entries?: GoldenSetEntryBody[];
  versions?: GoldenSetVersionBody[];
  runs?: EvaluationRunBody[];
  imports?: DatasetImportBody[];
  exports?: FeatureExportBody[];
  /**
   * 읽을 때마다 진행 중인 가져오기·내보내기를 한 단계씩 넘긴다. 브라우저 mock 모드 시연용이고,
   * 단위 테스트는 상태를 직접 정하므로 기본은 끈다.
   */
  advanceOnRead?: boolean;
}

/** 기본 검토 큐: 아무도 맡지 않은 두 항목과 내가 라벨한 한 항목 */
export function defaultReviewItems(): ReviewItemBody[] {
  return [
    reviewItemBody(),
    reviewItemBody({
      itemId: REVIEW_ITEM_ID_2,
      eventId: "0192f300-0000-5000-8000-000000000102",
      eventType: "fall",
      startMs: 200000,
      endMs: 212000,
      reason: "budget_exceeded",
      reviewReasons: [],
      createdAt: "2026-11-06T09:10:00Z",
    }),
    reviewItemBody({
      itemId: REVIEW_ITEM_ID_3,
      eventId: "0192f300-0000-5000-8000-000000000103",
      reason: "sample",
      status: "LABELED",
      assigneeId: OPERATOR_ID,
      assignedAt: "2026-11-06T10:00:00Z",
      label: reviewLabelBody(),
      labeledAt: "2026-11-06T10:05:00Z",
      createdAt: "2026-11-06T09:20:00Z",
    }),
  ];
}

const EVENT_TYPE_VALUES = [
  "fall",
  "fire_or_smoke",
  "ppe_missing",
  "object_removed",
  "barrier_not_restored",
  "hazard_zone_access",
  "equipment_abandoned",
  "object_moved",
  "other",
] as const;

const labelRequestSchema = z.object({
  verdict: z.enum(["correct", "incorrect", "uncertain"]),
  eventPresent: z.boolean(),
  eventType: z.enum(EVENT_TYPE_VALUES).nullable(),
  startMs: z.number().nullable(),
  endMs: z.number().nullable(),
  severity: z.enum(["low", "medium", "high"]).nullable(),
  note: z.string().nullable(),
}) satisfies z.ZodType<Schemas["ReviewLabel"]>;

const createSetSchema = z.object({
  name: z.string(),
  split: z.enum(["dev", "eval"]),
  description: z.string().nullable().optional(),
}) satisfies z.ZodType<Schemas["CreateGoldenSetRequest"]>;

const createImportSchema = z.object({
  manifestKey: z.string(),
  evalRatio: z.number(),
  splitSeed: z.number(),
}) satisfies z.ZodType<Schemas["CreateDatasetImportRequest"]>;

const createExportSchema = z.object({
  goldenSetId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
}) satisfies z.ZodType<Schemas["CreateFeatureExportRequest"]>;

const IMPORT_NEXT: Partial<Record<DatasetImportBody["status"], DatasetImportBody["status"]>> = {
  PENDING: "VALIDATING",
  VALIDATING: "REGISTERING",
  REGISTERING: "COMPLETED",
};
const EXPORT_NEXT: Partial<Record<FeatureExportBody["status"], FeatureExportBody["status"]>> = {
  PENDING: "RUNNING",
  RUNNING: "COMPLETED",
};

function pageParams(url: URL) {
  return {
    page: Number(url.searchParams.get("page") ?? "0"),
    size: Number(url.searchParams.get("size") ?? "20"),
  };
}

function defaultSets(): GoldenSetBody[] {
  return [
    goldenSetBody({ draftEntryCount: 1 }),
    goldenSetBody({
      setId: IMPORT_GOLDEN_SET_ID,
      name: "physicalai-events-eval",
      description: null,
      latestVersion: 1,
      baselineRunId: null,
      origin: "import",
    }),
  ];
}

function defaultRuns(): EvaluationRunBody[] {
  return [
    evaluationRunBody(),
    evaluationRunBody({
      runId: BASELINE_RUN_ID,
      receivedAt: "2026-11-05T11:20:01Z",
      trigger: "manual",
      commitSha: null,
      metrics: [
        { name: "judge_precision", eventType: "ppe_missing", value: 0.78, higherIsBetter: true },
      ],
      gate: { baselineRunId: null, passed: null, tolerance: 0.02, failures: [] },
    }),
  ];
}

/**
 * quality-service를 흉내 내는 핸들러. 맡기·라벨·초안·확정 같은 상태 변화를 메모리에 기억한다.
 * 호출할 때마다 새 상태로 시작한다. 일부만 바꾸려면 `server.use(바꿀 핸들러, ...qualityHandlers())`처럼 앞에 둔다.
 */
export function qualityHandlers(fixture: QualityFixture = {}) {
  let items = fixture.reviewItems ?? defaultReviewItems();
  let sets = fixture.goldenSets ?? defaultSets();
  let entries = fixture.entries ?? [goldenSetEntryBody()];
  let versions = fixture.versions ?? [goldenSetVersionBody()];
  const runs = fixture.runs ?? defaultRuns();
  let imports = fixture.imports ?? [datasetImportBody()];
  let exportsList = fixture.exports ?? [];
  let sequence = 0;
  const nextId = (prefix: string) => {
    sequence++;
    return `${prefix}-0000-7000-8000-${String(sequence).padStart(12, "0")}`;
  };
  const findItem = (id: unknown) => items.find((item) => item.itemId === id);
  const replaceItem = (next: ReviewItemBody) => {
    items = items.map((item) => (item.itemId === next.itemId ? next : item));
    return next;
  };
  const advance = () => {
    if (fixture.advanceOnRead !== true) {
      return;
    }
    imports = imports.map((entry) => {
      const status = IMPORT_NEXT[entry.status];
      return status === undefined
        ? entry
        : {
            ...entry,
            status,
            finishedAt: status === "COMPLETED" ? new Date().toISOString() : null,
          };
    });
    exportsList = exportsList.map((entry) => {
      const status = EXPORT_NEXT[entry.status];
      if (status === undefined) {
        return entry;
      }
      return status === "COMPLETED"
        ? {
            ...entry,
            status,
            fileKey: `exports/${entry.exportId}/features.jsonl`,
            rowCount: 310,
            sourceCount: 24,
            finishedAt: new Date().toISOString(),
          }
        : { ...entry, status };
    });
  };

  return [
    http.get(`${QUALITY_API}/review-items`, ({ request }) => {
      const url = new URL(request.url);
      const { page, size } = pageParams(url);
      const status = url.searchParams.get("status");
      const reason = url.searchParams.get("reason");
      const eventType = url.searchParams.get("eventType");
      const filtered = items
        .filter((item) => status === null || item.status === status)
        .filter((item) => reason === null || item.reason === reason)
        .filter((item) => eventType === null || item.eventType === eventType)
        .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
      return HttpResponse.json(pageBody(filtered, page, size));
    }),
    http.get(`${QUALITY_API}/review-items/:itemId`, ({ params }) => {
      const item = findItem(params.itemId);
      return item === undefined
        ? problem(404, "QUALITY_REVIEW_NOT_FOUND")
        : HttpResponse.json(item);
    }),
    http.post(`${QUALITY_API}/review-items/:itemId/assignment`, ({ params }) => {
      const item = findItem(params.itemId);
      if (item === undefined) {
        return problem(404, "QUALITY_REVIEW_NOT_FOUND");
      }
      if (item.status === "LABELED") {
        return problem(409, "QUALITY_REVIEW_ALREADY_LABELED");
      }
      if (item.status === "ASSIGNED") {
        return problem(409, "QUALITY_REVIEW_ALREADY_ASSIGNED");
      }
      return HttpResponse.json(
        replaceItem({
          ...item,
          status: "ASSIGNED",
          assigneeId: OPERATOR_ID,
          assignedAt: new Date().toISOString(),
        }),
      );
    }),
    http.delete(`${QUALITY_API}/review-items/:itemId/assignment`, ({ params }) => {
      const item = findItem(params.itemId);
      if (item === undefined) {
        return problem(404, "QUALITY_REVIEW_NOT_FOUND");
      }
      if (item.status !== "ASSIGNED") {
        return problem(409, "QUALITY_REVIEW_NOT_ASSIGNED");
      }
      replaceItem({ ...item, status: "UNASSIGNED", assigneeId: null, assignedAt: null });
      return new HttpResponse(null, { status: 204 });
    }),
    http.put(`${QUALITY_API}/review-items/:itemId/label`, async ({ params, request }) => {
      const item = findItem(params.itemId);
      if (item === undefined) {
        return problem(404, "QUALITY_REVIEW_NOT_FOUND");
      }
      if (item.status !== "ASSIGNED") {
        return problem(409, "QUALITY_REVIEW_NOT_ASSIGNED");
      }
      const label = labelRequestSchema.safeParse(await request.json());
      if (!label.success) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      return HttpResponse.json(
        replaceItem({
          ...item,
          status: "LABELED",
          label: label.data,
          labeledAt: new Date().toISOString(),
        }),
      );
    }),
    http.get(`${QUALITY_API}/golden-sets`, ({ request }) => {
      const { page, size } = pageParams(new URL(request.url));
      return HttpResponse.json(pageBody(sets, page, size));
    }),
    http.post(`${QUALITY_API}/golden-sets`, async ({ request }) => {
      const body = createSetSchema.safeParse(await request.json());
      if (!body.success) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      if (sets.some((set) => set.name === body.data.name)) {
        return problem(409, "QUALITY_GOLDEN_SET_DUPLICATED");
      }
      const created = goldenSetBody({
        setId: nextId("0192fb20"),
        name: body.data.name,
        split: body.data.split,
        description: body.data.description ?? null,
        draftEntryCount: 0,
        latestVersion: null,
        baselineRunId: null,
        createdAt: new Date().toISOString(),
      });
      sets = [...sets, created];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.get(`${QUALITY_API}/golden-sets/:setId`, ({ params }) => {
      const set = sets.find((entry) => entry.setId === params.setId);
      return set === undefined
        ? problem(404, "QUALITY_GOLDEN_SET_NOT_FOUND")
        : HttpResponse.json(set);
    }),
    http.get(`${QUALITY_API}/golden-sets/:setId/entries`, ({ params, request }) => {
      const { page, size } = pageParams(new URL(request.url));
      const own = entries.filter((entry) => entry.setId === params.setId);
      return HttpResponse.json(pageBody(own, page, size));
    }),
    http.post(`${QUALITY_API}/golden-sets/:setId/entries`, async ({ params, request }) => {
      const set = sets.find((entry) => entry.setId === params.setId);
      if (set === undefined) {
        return problem(404, "QUALITY_GOLDEN_SET_NOT_FOUND");
      }
      const body = z.object({ reviewItemId: z.string() }).safeParse(await request.json());
      if (!body.success) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      const item = findItem(body.data.reviewItemId);
      const label = item?.label ?? null;
      if (item === undefined || label === null || label.verdict === "uncertain") {
        return problem(409, "QUALITY_REVIEW_NOT_LABELED");
      }
      if (set.origin !== "review") {
        return problem(409, "QUALITY_GOLDEN_ORIGIN_MISMATCH");
      }
      if (entries.some((e) => e.setId === set.setId && e.reviewItemId === item.itemId)) {
        return problem(409, "QUALITY_GOLDEN_ENTRY_DUPLICATED");
      }
      const entry = goldenSetEntryBody({
        entryId: nextId("0192fb10"),
        setId: set.setId,
        reviewItemId: item.itemId,
        sourceId: item.sourceId,
        eventId: item.eventId,
        label,
        addedAt: new Date().toISOString(),
      });
      entries = [...entries, entry];
      sets = sets.map((s) =>
        s.setId === set.setId ? { ...s, draftEntryCount: s.draftEntryCount + 1 } : s,
      );
      return HttpResponse.json(entry, { status: 201 });
    }),
    http.delete(`${QUALITY_API}/golden-sets/:setId/entries/:entryId`, ({ params }) => {
      if (!entries.some((entry) => entry.entryId === params.entryId)) {
        return problem(404, "QUALITY_GOLDEN_ENTRY_NOT_FOUND");
      }
      entries = entries.filter((entry) => entry.entryId !== params.entryId);
      sets = sets.map((s) =>
        s.setId === params.setId
          ? { ...s, draftEntryCount: Math.max(0, s.draftEntryCount - 1) }
          : s,
      );
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${QUALITY_API}/golden-sets/:setId/versions`, ({ params, request }) => {
      const { page, size } = pageParams(new URL(request.url));
      const own = versions
        .filter((version) => version.setId === params.setId)
        .toSorted((a, b) => b.version - a.version);
      return HttpResponse.json(pageBody(own, page, size));
    }),
    http.post(`${QUALITY_API}/golden-sets/:setId/versions`, ({ params }) => {
      const set = sets.find((entry) => entry.setId === params.setId);
      if (set === undefined) {
        return problem(404, "QUALITY_GOLDEN_SET_NOT_FOUND");
      }
      const draft = entries.filter((entry) => entry.setId === set.setId);
      if (draft.length === 0) {
        return problem(409, "QUALITY_GOLDEN_EMPTY");
      }
      const version = (set.latestVersion ?? 0) + 1;
      const frozen = goldenSetVersionBody({
        setId: set.setId,
        version,
        entryCount: draft.length,
        manifestKey: `golden/${set.setId}/v${String(version)}/manifest.json`,
        frozenAt: new Date().toISOString(),
      });
      versions = [...versions, frozen];
      entries = entries.filter((entry) => entry.setId !== set.setId);
      sets = sets.map((s) =>
        s.setId === set.setId ? { ...s, draftEntryCount: 0, latestVersion: version } : s,
      );
      return HttpResponse.json(frozen, { status: 201 });
    }),
    http.put(`${QUALITY_API}/golden-sets/:setId/baseline`, async ({ params, request }) => {
      const set = sets.find((entry) => entry.setId === params.setId);
      if (set === undefined) {
        return problem(404, "QUALITY_GOLDEN_SET_NOT_FOUND");
      }
      const body = z.object({ runId: z.string() }).safeParse(await request.json());
      const run = body.success ? runs.find((entry) => entry.runId === body.data.runId) : undefined;
      if (run === undefined) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      if (run.goldenSetId !== set.setId) {
        return problem(409, "QUALITY_RUN_SET_MISMATCH");
      }
      const updated = { ...set, baselineRunId: run.runId };
      sets = sets.map((s) => (s.setId === set.setId ? updated : s));
      return HttpResponse.json(updated);
    }),
    http.get(`${QUALITY_API}/evaluation-runs`, ({ request }) => {
      const url = new URL(request.url);
      const { page, size } = pageParams(url);
      const setId = url.searchParams.get("goldenSetId");
      const filtered = runs
        .filter((run) => setId === null || run.goldenSetId === setId)
        .toSorted((a, b) => b.receivedAt.localeCompare(a.receivedAt));
      return HttpResponse.json(pageBody(filtered, page, size));
    }),
    http.get(`${QUALITY_API}/evaluation-runs/:runId`, ({ params }) => {
      const run = runs.find((entry) => entry.runId === params.runId);
      return run === undefined ? problem(404, "QUALITY_RUN_NOT_FOUND") : HttpResponse.json(run);
    }),
    http.get(`${QUALITY_API}/stage-reports/sources/:sourceId`, ({ params }) =>
      params.sourceId === STAGE_SOURCE_ID
        ? HttpResponse.json(sourceStageReportBody())
        : problem(404, "QUALITY_SOURCE_NOT_FOUND"),
    ),
    http.get(`${QUALITY_API}/stage-reports/trends`, ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(
        stageTrendBody({
          stageId: url.searchParams.get("stageId") ?? "analyzer.judge",
          from: url.searchParams.get("from") ?? "2026-11-01",
          to: url.searchParams.get("to") ?? "2026-11-06",
          versionKey: url.searchParams.get("versionKey"),
          versionValue: url.searchParams.get("versionValue"),
        }),
      );
    }),
    http.get(`${QUALITY_API}/alert-reports`, ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(
        alertReportBody({
          from: url.searchParams.get("from") ?? "2026-11-01",
          to: url.searchParams.get("to") ?? "2026-11-06",
          cameraId: url.searchParams.get("cameraId"),
        }),
      );
    }),
    http.get(`${QUALITY_API}/dataset-imports`, ({ request }) => {
      advance();
      const { page, size } = pageParams(new URL(request.url));
      return HttpResponse.json(pageBody(imports, page, size));
    }),
    http.post(`${QUALITY_API}/dataset-imports`, async ({ request }) => {
      const body = createImportSchema.safeParse(await request.json());
      if (!body.success) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      const active = imports.some(
        (entry) =>
          entry.manifestKey === body.data.manifestKey && IMPORT_NEXT[entry.status] !== undefined,
      );
      if (active) {
        return problem(409, "QUALITY_IMPORT_IN_PROGRESS");
      }
      const created = datasetImportBody({
        importId: nextId("0192fd00"),
        datasetName: null,
        ...body.data,
        status: "PENDING",
        counts: { videos: 0, registered: 0, failed: 0, labels: 0, dev: 0, eval: 0 },
        goldenSets: null,
        errors: [],
        createdAt: new Date().toISOString(),
        finishedAt: null,
      });
      imports = [created, ...imports];
      return HttpResponse.json(created, { status: 202 });
    }),
    http.get(`${QUALITY_API}/dataset-imports/:importId`, ({ params }) => {
      advance();
      const found = imports.find((entry) => entry.importId === params.importId);
      return found === undefined
        ? problem(404, "QUALITY_IMPORT_NOT_FOUND")
        : HttpResponse.json(found);
    }),
    http.post(`${QUALITY_API}/feature-exports`, async ({ request }) => {
      const body = createExportSchema.safeParse(await request.json());
      if (!body.success) {
        return problem(400, "QUALITY_INVALID_REQUEST");
      }
      const created = featureExportBody({
        exportId: nextId("0192fe00"),
        status: "PENDING",
        goldenSetId: body.data.goldenSetId ?? null,
        from: body.data.from ?? null,
        to: body.data.to ?? null,
        fileKey: null,
        rowCount: 0,
        sourceCount: 0,
        createdAt: new Date().toISOString(),
        finishedAt: null,
      });
      exportsList = [created, ...exportsList];
      return HttpResponse.json(created, { status: 202 });
    }),
    http.get(`${QUALITY_API}/feature-exports/:exportId`, ({ params }) => {
      advance();
      const found = exportsList.find((entry) => entry.exportId === params.exportId);
      return found === undefined
        ? problem(404, "QUALITY_EXPORT_NOT_FOUND")
        : HttpResponse.json(found);
    }),
  ];
}
