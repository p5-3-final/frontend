import { useId, type InputHTMLAttributes, type Ref } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** 칸 아래에 보여 줄 오류. 있으면 스크린 리더도 설명으로 읽는다. */
  error?: string | undefined;
  ref?: Ref<HTMLInputElement>;
}

/** 라벨과 오류 문구가 연결된 입력 칸. */
export function TextField({ label, error, id, ref, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        className="h-11 rounded-lg border border-line bg-surface px-3 text-content outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger"
        {...inputProps}
      />
      {error !== undefined && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
