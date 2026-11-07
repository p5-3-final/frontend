import { useId } from "react";

export interface SwitchProps {
  label: string;
  /** 라벨 아래 설명 */
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

/** 켜고 끄기. `role="switch"`와 `aria-checked`로 스크린 리더가 상태를 읽는다. */
export function Switch({ label, description, checked, disabled = false, onChange }: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        {description !== undefined && (
          <span id={descriptionId} className="text-sm text-muted">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        disabled={disabled}
        onClick={() => {
          onChange(!checked);
        }}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "border-accent bg-accent" : "border-line bg-panel-raised"}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-5 rounded-full bg-content transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
