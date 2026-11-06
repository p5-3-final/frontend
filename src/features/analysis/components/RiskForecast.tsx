import { riskForecastSchema } from "../model/schemas";

export interface RiskForecastProps {
  /** 계약 Risk.forecast(열린 객체). 화면에 쓰기 전에 _risk-forecast 형식으로 해석한다. */
  forecast: Record<string, unknown> | null;
}

function horizonName(seconds: number): string {
  if (seconds % 3600 === 0) {
    return `${String(seconds / 3600)}시간`;
  }
  if (seconds % 60 === 0) {
    return `${String(seconds / 60)}분`;
  }
  return `${String(seconds)}초`;
}

/**
 * 위험 노출 예측(SPEC-031 R-9). 예측은 참고용이라 그렇게 표시한다(SPEC-028).
 * 예측이 없거나, 형식을 읽을 수 없거나, 예측 모델이 없어 구간이 비었으면 그 자리를 비운다.
 */
export function RiskForecast({ forecast }: RiskForecastProps) {
  const parsed = riskForecastSchema.safeParse(forecast);
  if (!parsed.success || parsed.data.horizons.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded border border-line px-1.5 text-muted">참고용</span>
      <ul aria-label="노출 예측" className="flex flex-wrap gap-x-3">
        {parsed.data.horizons.map((horizon) => (
          <li key={horizon.horizonSec}>
            {horizonName(horizon.horizonSec)} 뒤 노출 확률{" "}
            {Math.round(horizon.exposureProbability * 100)}%
          </li>
        ))}
      </ul>
    </div>
  );
}
