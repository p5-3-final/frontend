import { z } from "zod";
import { STAGE_IDS, TREND_VERSION_KEYS } from "./stages";
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
/** 계약 To 파라미터: from부터 최대 90일(SPEC-035 R-15, R-19) */
export const MAX_PERIOD_DAYS = 90;
const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 기간 입력이 요청할 수 있는 값인지. 문제가 있으면 이유를, 없으면 null을 돌려준다. */
export function periodError(from: string, to: string): string | null {
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return "시작일과 종료일을 넣어 주세요.";
  }
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  if (Number.isNaN(days)) {
    return "시작일과 종료일을 넣어 주세요.";
  }
  if (days < 0) {
    return "종료일은 시작일과 같거나 뒤여야 합니다.";
  }
  return days > MAX_PERIOD_DAYS ? "기간은 90일까지 조회할 수 있습니다." : null;
}

/** 오늘(UTC)까지 `days`일 기간. 날짜 입력의 처음 값이다. */
export function recentPeriod(days: number, now = new Date()): { from: string; to: string } {
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getTime() - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { from, to };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MESSAGE = "영상 ID(UUID)를 넣어 주세요.";

/** 영상 ID 입력(SPEC-035 R-14) */
export const sourceIdFormSchema = z.object({
  sourceId: z.string().trim().regex(UUID_PATTERN, UUID_MESSAGE),
});

function refinePeriod(values: { from: string; to: string }, context: z.RefinementCtx) {
  const error = periodError(values.from, values.to);
  if (error !== null) {
    context.addIssue({ code: "custom", path: ["to"], message: error });
  }
}

/** 단계 추이 조회 폼(R-15). 기간이 90일을 넘으면 요청하지 않는다. 버전 값은 버전 키와 함께만 보낸다. */
export const trendFormSchema = z
  .object({
    stageId: z.enum(STAGE_IDS),
    from: z.string(),
    to: z.string(),
    versionKey: z.union([z.literal(""), z.enum(TREND_VERSION_KEYS)]),
    versionValue: z.string().trim().max(200),
  })
  .superRefine((values, context) => {
    refinePeriod(values, context);
    if (values.versionKey !== "" && values.versionValue === "") {
      context.addIssue({
        code: "custom",
        path: ["versionValue"],
        message: "버전 값을 넣어 주세요.",
      });
    }
  })
  .transform((values): TrendQuery => ({
    stageId: values.stageId,
    from: values.from,
    to: values.to,
    ...(values.versionKey === ""
      ? {}
      : { versionKey: values.versionKey, versionValue: values.versionValue }),
  }));
export type TrendFormValues = z.input<typeof trendFormSchema>;

/** 긴급 알림 지표 조회 폼(R-22). 카메라는 선택이다. */
export const alertFormSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    cameraId: z.union([
      z.literal(""),
      z.string().trim().regex(UUID_PATTERN, "카메라 ID(UUID)를 넣어 주세요."),
    ]),
  })
  .superRefine(refinePeriod)
  .transform((values): AlertQuery => ({
    from: values.from,
    to: values.to,
    ...(values.cameraId === "" ? {} : { cameraId: values.cameraId }),
  }));
export type AlertFormValues = z.input<typeof alertFormSchema>;
