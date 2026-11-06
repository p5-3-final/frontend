import type { StageId, TrendVersionKey } from "./schemas";

/** 단계 추이 조회 조건(getStageTrend) */
export interface TrendQuery {
  stageId: StageId;
  from: string;
  to: string;
  versionKey?: TrendVersionKey;
  versionValue?: string;
}

/** 긴급 알림 지표 조회 조건(getAlertReport) */
export interface AlertQuery {
  from: string;
  to: string;
  cameraId?: string;
}
