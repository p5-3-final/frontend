import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { EVENT_TYPE_NAMES, SEVERITY_NAMES } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { TextField } from "../../../../shared/ui/TextField";
import { initialLabelValues, labelFormSchema, type LabelFormValues } from "../../model/labelSchema";
import { VERDICT_NAMES } from "../../model/names";
import {
  EVENT_TYPES_FOR_FILTER,
  SEVERITIES,
  VERDICTS,
  type ReviewItem,
  type ReviewLabel,
} from "../../model/schemas";
import { SelectField } from "../../ui/SelectField";

export interface ReviewLabelFormProps {
  item: ReviewItem;
  /** 맡은 사람이고 상태가 ASSIGNED일 때만 참이다(SPEC-035 R-5). */
  editable: boolean;
  pending: boolean;
  error?: string;
  onSubmit: (label: ReviewLabel) => void;
}

const TYPE_OPTIONS = [
  { value: "", label: "고르기" },
  ...EVENT_TYPES_FOR_FILTER.map((type) => ({ value: type, label: EVENT_TYPE_NAMES[type] ?? type })),
];
const SEVERITY_OPTIONS = [
  { value: "", label: "없음" },
  ...SEVERITIES.map((severity) => ({ value: severity, label: SEVERITY_NAMES[severity] })),
];

/**
 * 라벨 입력(SPEC-035 R-5). 막힌 이유를 저장 버튼 옆에 바로 보여 운영자가 무엇을 고쳐야 하는지 안다(US-1).
 */
export function ReviewLabelForm({
  item,
  editable,
  pending,
  error,
  onSubmit,
}: ReviewLabelFormProps) {
  const headingId = useId();
  const { control, register, handleSubmit, setValue } = useForm<
    LabelFormValues,
    unknown,
    ReviewLabel
  >({
    resolver: zodResolver(labelFormSchema),
    defaultValues: initialLabelValues(item),
    mode: "onChange",
  });
  const values = useWatch({ control });
  const check = labelFormSchema.safeParse(values);
  const reasons = check.success ? [] : [...new Set(check.error.issues.map((i) => i.message))];
  const eventPresent = values.eventPresent ?? false;

  return (
    <form
      aria-labelledby={headingId}
      noValidate
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4"
    >
      <h3 id={headingId} className="text-base font-semibold">
        라벨
      </h3>
      <fieldset disabled={!editable} className="flex flex-col gap-4 disabled:opacity-70">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-muted">판정 결과가</legend>
          <div className="flex flex-wrap gap-2">
            {VERDICTS.map((verdict) => (
              <label
                key={verdict}
                className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:ring-2 has-focus-visible:ring-accent"
              >
                <input
                  type="radio"
                  value={verdict}
                  {...register("verdict")}
                  className="accent-accent"
                />
                {VERDICT_NAMES[verdict]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            {...register("eventPresent", {
              onChange: (event: { target: { checked: boolean } }) => {
                if (!event.target.checked) {
                  setValue("eventType", "", { shouldValidate: true });
                }
              },
            })}
          />
          이벤트 있음
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="이벤트 유형"
            options={TYPE_OPTIONS}
            disabled={!eventPresent}
            {...register("eventType")}
          />
          <SelectField label="심각도" options={SEVERITY_OPTIONS} {...register("severity")} />
          <TextField
            label="시작(초)"
            type="number"
            min={0}
            step={0.001}
            inputMode="decimal"
            {...register("startSec")}
          />
          <TextField
            label="끝(초)"
            type="number"
            min={0}
            step={0.001}
            inputMode="decimal"
            {...register("endSec")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${headingId}-note`} className="text-sm font-medium text-muted">
            메모
          </label>
          <textarea
            id={`${headingId}-note`}
            rows={3}
            className="rounded-lg border border-line bg-surface p-3 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            {...register("note")}
          />
        </div>
      </fieldset>
      {error !== undefined && <Alert>{error}</Alert>}
      {editable && (
        <div className="flex flex-col gap-2">
          {reasons.length > 0 && (
            <ul aria-label="저장할 수 없는 이유" className="text-sm text-warning">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          <Button type="submit" disabled={pending || reasons.length > 0}>
            저장 후 다음
          </Button>
        </div>
      )}
    </form>
  );
}
