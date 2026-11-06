import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../../shared/api/problem";
import { messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { TextField } from "../../../../shared/ui/TextField";
import { useCreateGoldenSet } from "../../api/goldenSets";
import { createGoldenSetSchema, type CreateGoldenSetValues } from "../../model/goldenSetSchema";
import { SPLIT_NAMES } from "../../model/names";
import { GOLDEN_SPLITS, type CreateGoldenSetRequest } from "../../model/schemas";
import { SelectField } from "../../ui/SelectField";

const SPLIT_OPTIONS = GOLDEN_SPLITS.map((split) => ({ value: split, label: SPLIT_NAMES[split] }));
const DEFAULTS: CreateGoldenSetValues = { name: "", split: "eval", description: "" };

/** Golden Set 만들기(SPEC-035 R-8). 이름 중복(409)은 이름 칸에 안내한다. */
export function CreateGoldenSetForm() {
  const create = useCreateGoldenSet();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateGoldenSetValues, unknown, CreateGoldenSetRequest>({
    resolver: zodResolver(createGoldenSetSchema),
    defaultValues: DEFAULTS,
  });

  const submit = (request: CreateGoldenSetRequest) => {
    create.mutate(request, {
      onSuccess: () => {
        reset(DEFAULTS);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "QUALITY_GOLDEN_SET_DUPLICATED") {
          setError("name", { message: messageForCode(error.code) });
        }
      },
    });
  };
  const otherError =
    create.error !== null &&
    !(create.error instanceof ApiError && create.error.code === "QUALITY_GOLDEN_SET_DUPLICATED");

  return (
    <form
      aria-label="Golden Set 만들기"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-[2fr_1fr_3fr_auto] md:items-start"
    >
      <TextField
        label="이름"
        placeholder="ppe-eval"
        error={errors.name?.message}
        {...register("name")}
      />
      <SelectField label="분할" options={SPLIT_OPTIONS} {...register("split")} />
      <TextField label="설명" error={errors.description?.message} {...register("description")} />
      <Button type="submit" disabled={create.isPending} className="md:mt-7">
        만들기
      </Button>
      {otherError && (
        <div className="md:col-span-4">
          <Alert>
            {messageForCode(create.error instanceof ApiError ? create.error.code : undefined)}
          </Alert>
        </div>
      )}
    </form>
  );
}
