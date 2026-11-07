import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { TextField } from "../../../../shared/ui/TextField";
import { useStageTrend } from "../../api/stages";
import { formatMs } from "../../model/format";
import { STAGE_IDS, TREND_VERSION_KEYS } from "../../model/stages";
import {
  recentPeriod,
  trendFormSchema,
  type TrendFormValues,
  type TrendQuery,
} from "../../model/trendQuery";
import { Cell, DataTable } from "../../ui/DataTable";
import { SelectField } from "../../ui/SelectField";
import { QualityError } from "../QualityError";
import { TrendChart } from "./TrendChart";

const STAGE_OPTIONS = STAGE_IDS.map((stageId) => ({ value: stageId, label: stageId }));
const KEY_OPTIONS = [
  { value: "", label: "없음" },
  ...TREND_VERSION_KEYS.map((key) => ({ value: key, label: key })),
];
const DEFAULT_DAYS = 7;

/** 단계별 일 단위 p50·p95 추이(SPEC-035 R-15). 기간이 90일을 넘으면 요청하지 않는다. */
export function StageTrend() {
  const [query, setQuery] = useState<TrendQuery>();
  const trend = useStageTrend(query);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrendFormValues, unknown, TrendQuery>({
    resolver: zodResolver(trendFormSchema),
    defaultValues: {
      stageId: "analyzer.judge",
      ...recentPeriod(DEFAULT_DAYS),
      versionKey: "",
      versionValue: "",
    },
  });
  const versionKey = useWatch({ control, name: "versionKey" });

  return (
    <Panel title="단계 추이">
      <form
        aria-label="단계 추이"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(setQuery)(event);
        }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-start"
      >
        <SelectField label="단계" options={STAGE_OPTIONS} {...register("stageId")} />
        <TextField label="시작일" type="date" {...register("from")} />
        <TextField label="종료일" type="date" error={errors.to?.message} {...register("to")} />
        <SelectField label="버전 키" options={KEY_OPTIONS} {...register("versionKey")} />
        <TextField
          label="버전 값"
          disabled={versionKey === ""}
          error={errors.versionValue?.message}
          {...register("versionValue")}
        />
        <Button type="submit" className="lg:mt-7">
          조회
        </Button>
      </form>
      {trend.isFetching && <p role="status">추이를 불러오는 중입니다.</p>}
      {trend.isError && (
        <QualityError
          error={trend.error}
          onRetry={() => {
            void trend.refetch();
          }}
        />
      )}
      {trend.data?.days.length === 0 && (
        <p className="text-sm text-muted">그 기간의 기록이 없습니다.</p>
      )}
      {trend.data !== undefined && trend.data.days.length > 0 && (
        <>
          <TrendChart trend={trend.data} />
          <DataTable label="단계 추이 값" columns={["날짜", "개수", "p50(ms)", "p95(ms)", "오류"]}>
            {trend.data.days.map((day) => (
              <tr key={day.date}>
                <Cell>{day.date}</Cell>
                <Cell numeric>{day.count}</Cell>
                <Cell numeric>{formatMs(day.p50Ms)}</Cell>
                <Cell numeric>{formatMs(day.p95Ms)}</Cell>
                <Cell numeric>{day.errorCount}</Cell>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </Panel>
  );
}
