export interface ProgressBarProps {
  /** 0~100 */
  percent: number;
  label: string;
}

/** 진행률 막대. 화면 낭독기는 `label`과 퍼센트를 읽는다. */
export function ProgressBar({ percent, label }: ProgressBarProps) {
  const value = Math.round(Math.min(100, Math.max(0, percent)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-line"
    >
      {/* 너비는 런타임 값이라 style로 준다(AGENTS.md 스타일 예외). */}
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${String(value)}%` }}
      />
    </div>
  );
}
