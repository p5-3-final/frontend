import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { TextField } from "../../../../shared/ui/TextField";
import { useAlertReport } from "../../api/stages";
import { formatMs, formatRatio } from "../../model/format";
import {
  alertFormSchema,
  recentPeriod,
  type AlertFormValues,
  type AlertQuery,
} from "../../model/trendQuery";
import type { AlertReport } from "../../model/schemas";
import { Cell, DataTable } from "../../ui/DataTable";
import { QualityError } from "../QualityError";

const COLUMNS = [
  "날짜",
  "발행",
  "확인",
  "기각",
  "기각 비율",
  "첫 알림 p50(ms)",
  "첫 알림 p95(ms)",
  "판정 p50(ms)",
  "판정 p95(ms)",
] as const;
const DEFAULT_DAYS = 7;

type Day = AlertReport["days"][number];

// 기각 비율은 판정이 끝난(확인·기각) 알림 중 기각 비율이다. 아직 판정 중인 알림은 분모에 넣지 않는다.
function dismissedRatio(day: Pick<Day, "confirmedCount" | "dismissedCount">): string {
  return formatRatio(day.dismissedCount, day.confirmedCount + day.dismissedCount);
}

// pendingCount는 pending으로 발행된 알림 수라, 확인·기각으로 끝나지 않은 나머지를 미해결로 본다.
function unresolved(day: Pick<Day, "pendingCount" | "confirmedCount" | "dismissedCount">): number {
  return Math.max(0, day.pendingCount - day.confirmedCount - day.dismissedCount);
}

function Summary({ days }: { days: readonly Day[] }) {
  const total = days.reduce(
    (sum, day) => ({
      pendingCount: sum.pendingCount + day.pendingCount,
      confirmedCount: sum.confirmedCount + day.confirmedCount,
      dismissedCount: sum.dismissedCount + day.dismissedCount,
    }),
    { pendingCount: 0, confirmedCount: 0, dismissedCount: 0 },
  );
  const items = [
    ["발행", `${String(total.pendingCount)}건`],
    ["기각 비율", dismissedRatio(total)],
    ["미해결", `${String(unresolved(total))}건`],
  ] as const;
  return (
    <ul aria-label="기간 요약" className="grid grid-cols-3 gap-2">
      {items.map(([label, value]) => (
        <li key={label} className="rounded-lg border border-line bg-panel-raised px-3 py-2">
          <span className="block text-xs text-muted">{label}</span>
          <span className="text-lg font-semibold tabular-nums">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/** 긴급 알림 지연(p50·p95)과 기각(dismissed) 비율 리포트(SPEC-035 R-22, v5.1) */
export function AlertReportPanel() {
  const [query, setQuery] = useState<AlertQuery>();
  const report = useAlertReport(query);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AlertFormValues, unknown, AlertQuery>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: { ...recentPeriod(DEFAULT_DAYS), cameraId: "" },
  });

  return (
    <Panel title="긴급 알림 지표">
      <form
        aria-label="긴급 알림 지표"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(setQuery)(event);
        }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-start"
      >
        <TextField label="시작일" type="date" {...register("from")} />
        <TextField label="종료일" type="date" error={errors.to?.message} {...register("to")} />
        <TextField
          label="카메라 ID(선택)"
          error={errors.cameraId?.message}
          {...register("cameraId")}
        />
        <Button type="submit" className="lg:mt-7">
          조회
        </Button>
      </form>
      {report.isFetching && <p role="status">알림 지표를 불러오는 중입니다.</p>}
      {report.isError && (
        <QualityError
          error={report.error}
          onRetry={() => {
            void report.refetch();
          }}
        />
      )}
      {report.data?.days.length === 0 && (
        <p className="text-sm text-muted">그 기간의 알림이 없습니다.</p>
      )}
      {report.data !== undefined && report.data.days.length > 0 && (
        <>
          <Summary days={report.data.days} />
          <DataTable label="긴급 알림 일별 지표" columns={COLUMNS}>
            {report.data.days.map((day) => (
              <tr key={day.date}>
                <Cell>{day.date}</Cell>
                <Cell numeric>{day.pendingCount}</Cell>
                <Cell numeric>{day.confirmedCount}</Cell>
                <Cell numeric>{day.dismissedCount}</Cell>
                <Cell numeric>{dismissedRatio(day)}</Cell>
                <Cell numeric>{formatMs(day.firstAlertP50Ms)}</Cell>
                <Cell numeric>{formatMs(day.firstAlertP95Ms)}</Cell>
                <Cell numeric>{formatMs(day.judgeP50Ms)}</Cell>
                <Cell numeric>{formatMs(day.judgeP95Ms)}</Cell>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </Panel>
  );
}
