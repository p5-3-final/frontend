import { z } from "zod";
import type { components, operations } from "../../../api/generated/quality-service";
import { EVENT_TYPES } from "../../analysis";

type Schemas = components["schemas"];
type Json<
  K extends keyof operations,
  S extends keyof operations[K]["responses"],
> = operations[K]["responses"][S] extends { content: { "application/json": infer T } } ? T : never;

// 계약 eventType(taxonomy/v2). 목록은 analysis와 같은 원본이라 그 목록을 쓰고 quality 생성 타입으로 다시 확인한다.
export const eventTypeSchema = z.enum(EVENT_TYPES) satisfies z.ZodType<Schemas["eventType"]>;
export type EventType = z.infer<typeof eventTypeSchema>;
export const EVENT_TYPES_FOR_FILTER: readonly EventType[] = EVENT_TYPES;

export const VERDICTS = ["correct", "incorrect", "uncertain"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const SEVERITIES = ["low", "medium", "high"] as const;

export const REVIEW_STATUSES = ["UNASSIGNED", "ASSIGNED", "LABELED"] as const;
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

const pageMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
}) satisfies z.ZodType<Schemas["PageMeta"]>;

/** 계약 ReviewLabel */
export const reviewLabelSchema = z.object({
  verdict: z.enum(VERDICTS),
  eventPresent: z.boolean(),
  eventType: eventTypeSchema.nullable(),
  startMs: z.number().nullable(),
  endMs: z.number().nullable(),
  severity: z.enum(SEVERITIES).nullable(),
  note: z.string().nullable(),
}) satisfies z.ZodType<Schemas["ReviewLabel"]>;
export type ReviewLabel = z.infer<typeof reviewLabelSchema>;

/**
 * 계약 ReviewItem. `reason`은 열린 목록(ADR-0014)이라 문자열로 받는다.
 * `analysis`는 계약이 `type: object`로만 둬 생성 타입이 `Record<string, never>`이므로 열린 객체로 받고,
 * 화면에 쓰기 전에 analysis의 2차 스키마(`vlmAnalysisSchema`)로 한 번 더 해석한다.
 */
export const reviewItemSchema = z.object({
  itemId: z.string(),
  eventId: z.string(),
  sourceId: z.string(),
  jobId: z.string(),
  eventType: eventTypeSchema,
  startMs: z.number(),
  endMs: z.number(),
  judgmentMethod: z.string(),
  reason: z.string(),
  reviewReasons: z.array(z.string()),
  evidenceFrameKeys: z.array(z.string()),
  evidenceFrameUrls: z.array(z.string()),
  analysis: z.record(z.string(), z.unknown()),
  status: reviewStatusSchema,
  assigneeId: z.string().nullable(),
  assignedAt: z.string().nullable(),
  label: reviewLabelSchema.nullable(),
  labeledAt: z.string().nullable(),
  createdAt: z.string(),
}) satisfies z.ZodType<
  Omit<Schemas["ReviewItem"], "analysis"> & { analysis: Record<string, unknown> }
>;
export type ReviewItem = z.infer<typeof reviewItemSchema>;

export const reviewItemPageSchema = z.object({
  items: z.array(reviewItemSchema),
  page: pageMetaSchema,
});
export type ReviewItemPage = z.infer<typeof reviewItemPageSchema>;

export const GOLDEN_SPLITS = ["dev", "eval"] as const;
export type GoldenSplit = (typeof GOLDEN_SPLITS)[number];

/** 계약 GoldenSet */
export const goldenSetSchema = z.object({
  setId: z.string(),
  name: z.string(),
  split: z.enum(GOLDEN_SPLITS),
  description: z.string().nullable(),
  draftEntryCount: z.number(),
  latestVersion: z.number().nullable(),
  baselineRunId: z.string().nullable(),
  createdAt: z.string(),
  origin: z.enum(["review", "import"]),
}) satisfies z.ZodType<Schemas["GoldenSet"]>;
export type GoldenSet = z.infer<typeof goldenSetSchema>;

export const goldenSetPageSchema = z.object({
  items: z.array(goldenSetSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Json<"listGoldenSets", 200>>;

/** 계약 GoldenSetEntry */
export const goldenSetEntrySchema = z.object({
  entryId: z.string(),
  setId: z.string(),
  reviewItemId: z.string(),
  sourceId: z.string(),
  eventId: z.string(),
  label: reviewLabelSchema,
  addedAt: z.string(),
}) satisfies z.ZodType<Schemas["GoldenSetEntry"]>;
export type GoldenSetEntry = z.infer<typeof goldenSetEntrySchema>;

export const goldenSetEntryPageSchema = z.object({
  items: z.array(goldenSetEntrySchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Json<"listGoldenSetEntries", 200>>;

/** 계약 GoldenSetVersion */
export const goldenSetVersionSchema = z.object({
  setId: z.string(),
  version: z.number(),
  entryCount: z.number(),
  manifestKey: z.string(),
  frozenAt: z.string(),
  frozenBy: z.string(),
}) satisfies z.ZodType<Schemas["GoldenSetVersion"]>;
export type GoldenSetVersion = z.infer<typeof goldenSetVersionSchema>;

export const goldenSetVersionPageSchema = z.object({
  items: z.array(goldenSetVersionSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Json<"listGoldenSetVersions", 200>>;

const metricSchema = z.object({
  name: z.string(),
  eventType: eventTypeSchema.nullable(),
  value: z.number(),
  higherIsBetter: z.boolean(),
}) satisfies z.ZodType<Schemas["Metric"]>;
export type Metric = z.infer<typeof metricSchema>;

export const RUN_VERSION_KEYS = [
  "taxonomy",
  "detectorProfile",
  "modelId",
  "promptVersion",
  "embeddingModel",
] as const;

/** 계약 EvaluationRun */
export const evaluationRunSchema = z.object({
  runId: z.string(),
  goldenSetId: z.string(),
  goldenSetVersion: z.number(),
  kind: z.enum(["event", "search", "track_attribute"]),
  versions: z.object({
    taxonomy: z.string().nullable(),
    detectorProfile: z.string().nullable(),
    modelId: z.string().nullable(),
    promptVersion: z.string().nullable(),
    embeddingModel: z.string().nullable(),
  }),
  metrics: z.array(metricSchema),
  startedAt: z.string(),
  finishedAt: z.string(),
  trigger: z.enum(["ci", "scheduled", "manual"]),
  commitSha: z.string().nullable(),
  gate: z.object({
    baselineRunId: z.string().nullable(),
    passed: z.boolean().nullable(),
    tolerance: z.number(),
    failures: z.array(
      z.object({
        name: z.string(),
        eventType: z.string().nullable(),
        baseline: z.number(),
        value: z.number(),
      }),
    ),
  }),
  receivedAt: z.string(),
}) satisfies z.ZodType<Schemas["EvaluationRun"]>;
export type EvaluationRun = z.infer<typeof evaluationRunSchema>;
export type GateFailure = EvaluationRun["gate"]["failures"][number];

export const evaluationRunPageSchema = z.object({
  items: z.array(evaluationRunSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Json<"listEvaluationRuns", 200>>;

/** 계약 SourceStageReport */
export const sourceStageReportSchema = z.object({
  sourceId: z.string(),
  recordCount: z.number(),
  stages: z.array(
    z.object({
      path: z.string(),
      stageId: z.string(),
      count: z.number(),
      totalMs: z.number(),
      p50Ms: z.number(),
      p95Ms: z.number(),
      errorCount: z.number(),
    }),
  ),
}) satisfies z.ZodType<Schemas["SourceStageReport"]>;
export type SourceStageReport = z.infer<typeof sourceStageReportSchema>;

/** 계약 StageTrend */
export const stageTrendSchema = z.object({
  stageId: z.string(),
  from: z.string(),
  to: z.string(),
  versionKey: z.string().nullable(),
  versionValue: z.string().nullable(),
  days: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
      p50Ms: z.number(),
      p95Ms: z.number(),
      errorCount: z.number(),
    }),
  ),
}) satisfies z.ZodType<Schemas["StageTrend"]>;
export type StageTrend = z.infer<typeof stageTrendSchema>;

/** 계약 AlertReport(v5.1, SPEC-029 R-28) */
export const alertReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  cameraId: z.string().nullable(),
  days: z.array(
    z.object({
      date: z.string(),
      pendingCount: z.number(),
      confirmedCount: z.number(),
      dismissedCount: z.number(),
      firstAlertP50Ms: z.number().nullable(),
      firstAlertP95Ms: z.number().nullable(),
      judgeP50Ms: z.number().nullable(),
      judgeP95Ms: z.number().nullable(),
    }),
  ),
}) satisfies z.ZodType<Schemas["AlertReport"]>;
export type AlertReport = z.infer<typeof alertReportSchema>;

export const IMPORT_STATUSES = [
  "PENDING",
  "VALIDATING",
  "REGISTERING",
  "COMPLETED",
  "FAILED",
] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

/** 계약 DatasetImport */
export const datasetImportSchema = z.object({
  importId: z.string(),
  datasetName: z.string().nullable(),
  manifestKey: z.string(),
  evalRatio: z.number(),
  splitSeed: z.number(),
  status: z.enum(IMPORT_STATUSES),
  counts: z.object({
    videos: z.number(),
    registered: z.number(),
    failed: z.number(),
    labels: z.number(),
    dev: z.number(),
    eval: z.number(),
  }),
  goldenSets: z
    .object({
      devSetId: z.string(),
      evalSetId: z.string(),
      devVersion: z.number().nullable(),
      evalVersion: z.number().nullable(),
    })
    .nullable(),
  errors: z.array(
    z.object({ externalId: z.string().nullable(), code: z.string(), message: z.string() }),
  ),
  requestedBy: z.string(),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
}) satisfies z.ZodType<Schemas["DatasetImport"]>;
export type DatasetImport = z.infer<typeof datasetImportSchema>;

export const datasetImportPageSchema = z.object({
  items: z.array(datasetImportSchema),
  page: pageMetaSchema,
}) satisfies z.ZodType<Json<"listDatasetImports", 200>>;

export const EXPORT_STATUSES = ["PENDING", "RUNNING", "COMPLETED", "FAILED"] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];

/** 계약 FeatureExport */
export const featureExportSchema = z.object({
  exportId: z.string(),
  status: z.enum(EXPORT_STATUSES),
  goldenSetId: z.string().nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  fileKey: z.string().nullable(),
  rowCount: z.number(),
  sourceCount: z.number(),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
}) satisfies z.ZodType<Schemas["FeatureExport"]>;
export type FeatureExport = z.infer<typeof featureExportSchema>;

export type CreateGoldenSetRequest = Schemas["CreateGoldenSetRequest"];
export type CreateDatasetImportRequest = Schemas["CreateDatasetImportRequest"];
export type CreateFeatureExportRequest = Schemas["CreateFeatureExportRequest"];
export type StageId = Schemas["stageId"];
export type TrendVersionKey = components["parameters"]["VersionKey"];
