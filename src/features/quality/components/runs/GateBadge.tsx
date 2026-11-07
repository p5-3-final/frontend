import { GATE_OUTCOME_NAMES, type GateOutcome } from "../../model/gate";

const TONE_CLASSES: Readonly<Record<GateOutcome, string>> = {
  passed: "border-success/50 bg-success/10 text-success",
  failed: "border-danger/50 bg-danger-soft text-danger",
  no_baseline: "border-line bg-panel-raised text-muted",
};

/** Gate 결과 배지. 색만으로 구분하지 않게 글자를 함께 보인다(SPEC-035 R-12). */
export function GateBadge({ outcome, prefix = "" }: { outcome: GateOutcome; prefix?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[outcome]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {prefix}
      {GATE_OUTCOME_NAMES[outcome]}
    </span>
  );
}
