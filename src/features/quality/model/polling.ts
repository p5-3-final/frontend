import type { ExportStatus, ImportStatus } from "./schemas";

/** SPEC-035 R-17: 진행 중인 가져오기·내보내기를 다시 불러오는 간격 */
export const POLL_INTERVAL_MS = 5000;

const ACTIVE_IMPORT = new Set<ImportStatus>(["PENDING", "VALIDATING", "REGISTERING"]);
const ACTIVE_EXPORT = new Set<ExportStatus>(["PENDING", "RUNNING"]);

export function isImportActive(status: ImportStatus): boolean {
  return ACTIVE_IMPORT.has(status);
}

export function isExportActive(status: ExportStatus): boolean {
  return ACTIVE_EXPORT.has(status);
}

/**
 * 가져오기 목록·상세의 `refetchInterval`. 진행 중인 항목이 하나라도 있으면 5초, 없으면 멈춘다.
 * 목록 한 번으로 진행 중인 항목 모두의 상태를 받는다(항목마다 요청하는 것보다 적다, plan 5절).
 */
export function importsPollInterval(
  imports: readonly { status: ImportStatus }[] | undefined,
): number | false {
  return imports?.some((entry) => isImportActive(entry.status)) === true ? POLL_INTERVAL_MS : false;
}

/** 내보내기 한 건의 `refetchInterval`. 진행 중이면 5초, 끝나면 멈춘다. */
export function exportPollInterval(entry: { status: ExportStatus } | undefined): number | false {
  return entry !== undefined && isExportActive(entry.status) ? POLL_INTERVAL_MS : false;
}
