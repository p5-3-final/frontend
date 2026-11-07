const MS = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("ko-KR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** ms 값을 정수와 천 단위 쉼표로 보인다. 값이 없으면 "-"다. 예: 9120.5 → "9,121" */
export function formatMs(ms: number | null): string {
  return ms === null ? "-" : MS.format(ms);
}

/** 비율을 소수 첫째 자리 %로 보인다. 분모가 0이면 "-"다. 예: 5/14 → "35.7%" */
export function formatRatio(part: number, whole: number): string {
  return whole === 0 ? "-" : PERCENT.format(part / whole);
}
