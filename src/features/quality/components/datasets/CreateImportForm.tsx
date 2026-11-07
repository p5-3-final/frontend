import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../../shared/api/problem";
import { messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { TextField } from "../../../../shared/ui/TextField";
import { useCreateDatasetImport } from "../../api/datasets";
import { createImportSchema, type CreateImportValues } from "../../model/importSchema";
import type { CreateDatasetImportRequest } from "../../model/schemas";

// 계약 CreateDatasetImportRequest 기본값(evalRatio 0.2, splitSeed 0)
const DEFAULTS: CreateImportValues = { manifestKey: "", evalRatio: "0.2", splitSeed: "0" };

/** 데이터셋 가져오기 시작(SPEC-035 R-16) */
export function CreateImportForm() {
  const create = useCreateDatasetImport();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateImportValues, unknown, CreateDatasetImportRequest>({
    resolver: zodResolver(createImportSchema),
    defaultValues: DEFAULTS,
  });

  return (
    <form
      aria-label="데이터셋 가져오기"
      noValidate
      onSubmit={(event) => {
        void handleSubmit((request) => {
          create.mutate(request, {
            onSuccess: () => {
              reset(DEFAULTS);
            },
          });
        })(event);
      }}
      className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-[3fr_1fr_1fr_auto] md:items-start"
    >
      <TextField
        label="매니페스트 경로"
        placeholder="imports/<폴더>/manifest.json"
        error={errors.manifestKey?.message}
        {...register("manifestKey")}
      />
      <TextField
        label="평가 비율(0~1)"
        type="number"
        min={0}
        max={1}
        step={0.05}
        error={errors.evalRatio?.message}
        {...register("evalRatio")}
      />
      <TextField
        label="분할 시드"
        type="number"
        min={0}
        step={1}
        error={errors.splitSeed?.message}
        {...register("splitSeed")}
      />
      <Button type="submit" disabled={create.isPending} className="md:mt-7">
        가져오기 시작
      </Button>
      {create.error !== null && (
        <div className="md:col-span-4">
          <Alert>
            {messageForCode(create.error instanceof ApiError ? create.error.code : undefined)}
          </Alert>
        </div>
      )}
    </form>
  );
}
