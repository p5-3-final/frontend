import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../../shared/api/problem";
import { messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { TextField } from "../../../../shared/ui/TextField";
import { useSourceStageReport } from "../../api/stages";
import { formatMs } from "../../model/format";
import { sourceIdFormSchema } from "../../model/trendQuery";
import { Cell, DataTable } from "../../ui/DataTable";
import { QualityError } from "../QualityError";

const COLUMNS = ["단계 경로", "개수", "합계(ms)", "p50(ms)", "p95(ms)", "오류"] as const;

/** 영상별 단계 분해(SPEC-035 R-14). 어느 단계가 오래 걸렸는지 보이도록 합계 내림차순으로 정렬한다. */
export function SourceStageReport() {
  const [sourceId, setSourceId] = useState<string>();
  const report = useSourceStageReport(sourceId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(sourceIdFormSchema), defaultValues: { sourceId: "" } });
  const notFound = report.error instanceof ApiError && report.error.status === 404;

  return (
    <Panel title="영상별 단계 분해">
      <form
        aria-label="영상별 단계 분해"
        noValidate
        onSubmit={(event) => {
          void handleSubmit((values) => {
            setSourceId(values.sourceId);
          })(event);
        }}
        className="flex flex-wrap items-start gap-2"
      >
        <div className="min-w-72 flex-1">
          <TextField label="영상 ID" error={errors.sourceId?.message} {...register("sourceId")} />
        </div>
        <Button type="submit" className="mt-7">
          조회
        </Button>
      </form>
      {report.isFetching && <p role="status">단계 분해를 불러오는 중입니다.</p>}
      {notFound && <Alert>{messageForCode("QUALITY_SOURCE_NOT_FOUND")}</Alert>}
      {report.isError && !notFound && (
        <QualityError
          error={report.error}
          onRetry={() => {
            void report.refetch();
          }}
        />
      )}
      {report.data !== undefined && (
        <>
          <p className="text-sm text-muted">측정 기록 {report.data.recordCount}건</p>
          <DataTable label="단계 분해" columns={COLUMNS}>
            {report.data.stages
              .toSorted((a, b) => b.totalMs - a.totalMs)
              .map((stage) => (
                <tr key={stage.path}>
                  <Cell>
                    <code className="text-xs break-all">{stage.path}</code>
                  </Cell>
                  <Cell numeric>{stage.count}</Cell>
                  <Cell numeric>{formatMs(stage.totalMs)}</Cell>
                  <Cell numeric>{formatMs(stage.p50Ms)}</Cell>
                  <Cell numeric>{formatMs(stage.p95Ms)}</Cell>
                  <Cell numeric>{stage.errorCount}</Cell>
                </tr>
              ))}
          </DataTable>
        </>
      )}
    </Panel>
  );
}
