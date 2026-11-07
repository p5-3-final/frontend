import type { DatasetImport, EvaluationRun, ExportStatus, ReviewStatus, Verdict } from "./schemas";

/** 검토 항목 상태 이름(SPEC-035 R-2) */
export const REVIEW_STATUS_NAMES: Readonly<Record<ReviewStatus, string>> = {
  UNASSIGNED: "대기",
  ASSIGNED: "검토 중",
  LABELED: "라벨 완료",
};

/** 라벨 verdict 이름(SPEC-035 R-5) */
export const VERDICT_NAMES: Readonly<Record<Verdict, string>> = {
  correct: "맞음",
  incorrect: "틀림",
  uncertain: "불확실",
};

export const SPLIT_NAMES = { dev: "개발(dev)", eval: "평가(eval)" } as const;
export const ORIGIN_NAMES = { review: "검토", import: "가져오기" } as const;

export const RUN_KIND_NAMES: Readonly<Record<EvaluationRun["kind"], string>> = {
  event: "이벤트",
  search: "검색",
  track_attribute: "트랙 속성",
};

export const RUN_TRIGGER_NAMES: Readonly<Record<EvaluationRun["trigger"], string>> = {
  ci: "CI",
  scheduled: "예약",
  manual: "수동",
};

export const IMPORT_STATUS_NAMES: Readonly<Record<DatasetImport["status"], string>> = {
  PENDING: "대기",
  VALIDATING: "검증 중",
  REGISTERING: "등록 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

export const EXPORT_STATUS_NAMES: Readonly<Record<ExportStatus, string>> = {
  PENDING: "대기",
  RUNNING: "진행 중",
  COMPLETED: "완료",
  FAILED: "실패",
};
