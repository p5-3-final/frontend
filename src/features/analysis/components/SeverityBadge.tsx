import { SEVERITY_NAMES } from "../../../shared/lib/messages";
import type { Severity } from "../model/schemas";

export interface SeverityBadgeProps {
  severity: Severity | null;
}

// 진행 막대 표시와 같은 색(PlayerControls). 색만으로 구분하지 않게 글자도 함께 보인다(R-18).
const TONE_CLASSES: Readonly<Record<Severity, string>> = {
  high: "border-danger/50 bg-danger-soft text-danger",
  medium: "border-warning/50 bg-warning/10 text-warning",
  low: "border-accent/50 bg-accent-soft text-accent",
};

/** severity 배지(SPEC-031 R-18) */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (severity === null) {
    return null;
  }
  const name = SEVERITY_NAMES[severity];
  return (
    <span
      role="img"
      aria-label={`심각도 ${name}`}
      className={`inline-flex items-center gap-1 rounded border px-1.5 text-xs font-semibold ${TONE_CLASSES[severity]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      <span aria-hidden="true">{name}</span>
    </span>
  );
}
