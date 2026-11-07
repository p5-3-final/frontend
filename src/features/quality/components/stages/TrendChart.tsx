import { niceTicks, xPosition } from "../../model/chartScale";
import { formatMs } from "../../model/format";
import type { StageTrend } from "../../model/schemas";

export interface TrendChartProps {
  trend: StageTrend;
}

// viewBox 기준 크기. 실제 크기는 너비에 맞춰 늘고 준다.
const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 12, right: 16, bottom: 28, left: 56 } as const;
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const SERIES = [
  { key: "p50Ms", label: "p50", stroke: "stroke-accent", fill: "fill-accent", dash: undefined },
  { key: "p95Ms", label: "p95", stroke: "stroke-warning", fill: "fill-warning", dash: "6 4" },
] as const;

/**
 * 날짜별 p50·p95 선 그래프(SPEC-035 R-15, D-24: 새 의존성 없이 SVG). 정확한 값은 같은 데이터의 표로 읽게 하고,
 * 그래프에는 요약 이름과 점마다 `<title>`만 둔다. 두 선은 색과 점선으로 함께 구분한다.
 */
export function TrendChart({ trend }: TrendChartProps) {
  const days = trend.days;
  const ticks = niceTicks(Math.max(0, ...days.map((day) => day.p95Ms)));
  const top = ticks.at(-1) ?? 1;
  const x = (index: number) => PAD.left + xPosition(index, days.length, PLOT_W);
  const y = (value: number) => PAD.top + PLOT_H - (value / top) * PLOT_H;
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));

  return (
    <figure className="flex flex-col gap-2">
      <svg
        role="img"
        aria-label={`${trend.stageId} 날짜별 p50·p95 추이, ${String(days.length)}일`}
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        className="h-auto w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-line"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {formatMs(tick)}
            </text>
          </g>
        ))}
        {days.map((day, index) =>
          index % labelEvery === 0 ? (
            <text
              key={day.date}
              x={x(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted text-[11px]"
            >
              {day.date.slice(5)}
            </text>
          ) : null,
        )}
        {SERIES.map((series) => (
          <g key={series.key}>
            <polyline
              points={days
                .map((day, index) => `${String(x(index))},${String(y(day[series.key]))}`)
                .join(" ")}
              fill="none"
              strokeWidth={2}
              strokeDasharray={series.dash}
              className={series.stroke}
            />
            {days.map((day, index) => (
              <circle
                key={day.date}
                cx={x(index)}
                cy={y(day[series.key])}
                r={3}
                className={series.fill}
              >
                <title>{`${day.date} ${series.label} ${formatMs(day[series.key])}ms`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="flex gap-4 text-sm text-muted">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5">
            <svg aria-hidden="true" width="20" height="6" viewBox="0 0 20 6">
              <line
                x1="0"
                x2="20"
                y1="3"
                y2="3"
                strokeWidth={2}
                strokeDasharray={series.dash}
                className={series.stroke}
              />
            </svg>
            {series.label}
          </span>
        ))}
        <span>단위 ms</span>
      </figcaption>
    </figure>
  );
}
