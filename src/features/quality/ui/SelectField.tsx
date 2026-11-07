import { useId, type SelectHTMLAttributes } from "react";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly { value: string; label: string }[];
}

/** 라벨이 연결된 고르기 칸. 품질 화면의 거르기·폼에서 같이 쓴다. */
export function SelectField({ label, options, id, ...selectProps }: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-muted">
        {label}
      </label>
      <select
        id={selectId}
        className="h-11 rounded-lg border border-line bg-surface px-3 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
