import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "../../../../shared/api/problem";
import { formatDateTime } from "../../../../shared/lib/format";
import { messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { TextField } from "../../../../shared/ui/TextField";
import { useCreateFeatureExport, useFeatureExport } from "../../api/datasets";
import { useGoldenSets } from "../../api/goldenSets";
import { exportFormSchema, type ExportFormValues } from "../../model/exportSchema";
import { EXPORT_STATUS_NAMES } from "../../model/names";
import type { CreateFeatureExportRequest } from "../../model/schemas";
import { recentPeriod } from "../../model/trendQuery";
import { Cell, DataTable } from "../../ui/DataTable";
import { SelectField } from "../../ui/SelectField";

const DEFAULT_DAYS = 30;

function ExportRow({ exportId }: { exportId: string }) {
  const entry = useFeatureExport(exportId);
  if (entry.data === undefined) {
    return (
      <tr>
        <Cell>{entry.isError ? messageForCode(undefined) : "불러오는 중"}</Cell>
        <Cell>-</Cell>
        <Cell>-</Cell>
        <Cell>-</Cell>
        <Cell>-</Cell>
        <Cell>-</Cell>
      </tr>
    );
  }
  const data = entry.data;
  return (
    <tr>
      <Cell>
        {data.goldenSetId === null ? `${data.from ?? ""} ~ ${data.to ?? ""}` : "Golden Set"}
      </Cell>
      <Cell>{EXPORT_STATUS_NAMES[data.status]}</Cell>
      <Cell>
        {data.fileKey === null ? "-" : <code className="text-xs break-all">{data.fileKey}</code>}
      </Cell>
      <Cell numeric>{data.rowCount}</Cell>
      <Cell numeric>{data.sourceCount}</Cell>
      <Cell>{formatDateTime(data.createdAt)}</Cell>
    </tr>
  );
}

/**
 * 특징 내보내기(SPEC-035 R-19). Golden Set과 기간 중 하나만 입력하게 다른 쪽 칸을 막는다.
 * 계약에 내보내기 목록 API가 없어(C-28) 이 화면에서 시작한 내보내기만 화면 상태로 보이고, 화면을 떠나면 목록이 사라진다.
 */
export function FeatureExportPanel() {
  const sets = useGoldenSets();
  const create = useCreateFeatureExport();
  const [exportIds, setExportIds] = useState<readonly string[]>([]);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExportFormValues, unknown, CreateFeatureExportRequest>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: { mode: "golden", goldenSetId: "", ...recentPeriod(DEFAULT_DAYS) },
  });
  const mode = useWatch({ control, name: "mode" });

  return (
    <Panel title="특징 내보내기">
      <form
        aria-label="특징 내보내기"
        noValidate
        onSubmit={(event) => {
          void handleSubmit((request) => {
            create.mutate(request, {
              onSuccess: (created) => {
                setExportIds((ids) => [created.exportId, ...ids]);
              },
            });
          })(event);
        }}
        className="flex flex-col gap-3"
      >
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-1 text-sm font-medium text-muted">내보낼 영상</legend>
          <label className="flex items-center gap-2">
            <input type="radio" value="golden" className="accent-accent" {...register("mode")} />
            Golden Set으로
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="period" className="accent-accent" {...register("mode")} />
            기간으로
          </label>
        </fieldset>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-start">
          <SelectField
            label="Golden Set"
            disabled={mode !== "golden"}
            options={[
              { value: "", label: "고르기" },
              ...(sets.data?.items.map((set) => ({ value: set.setId, label: set.name })) ?? []),
            ]}
            {...register("goldenSetId")}
          />
          <TextField
            label="시작일"
            type="date"
            disabled={mode !== "period"}
            {...register("from")}
          />
          <TextField
            label="종료일"
            type="date"
            disabled={mode !== "period"}
            error={errors.to?.message}
            {...register("to")}
          />
          <Button type="submit" disabled={create.isPending} className="md:mt-7">
            내보내기 시작
          </Button>
        </div>
        {errors.goldenSetId?.message !== undefined && <Alert>{errors.goldenSetId.message}</Alert>}
        {create.error !== null && (
          <Alert>
            {messageForCode(create.error instanceof ApiError ? create.error.code : undefined)}
          </Alert>
        )}
      </form>
      {exportIds.length > 0 && (
        <DataTable
          label="최근 내보내기"
          columns={["대상", "상태", "파일 경로", "줄 수", "영상 수", "시작 시각"]}
        >
          {exportIds.map((exportId) => (
            <ExportRow key={exportId} exportId={exportId} />
          ))}
        </DataTable>
      )}
    </Panel>
  );
}
