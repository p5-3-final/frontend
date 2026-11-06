const UNITS = ["KB", "MB", "GB"] as const;

/** 바이트 수를 1024 단위로 줄여 소수 첫째 자리까지 보여 준다. 예: 1536 → "1.5 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  let value = bytes;
  let unit: string = "B";
  for (const next of UNITS) {
    if (value < 1024) {
      break;
    }
    value /= 1024;
    unit = next;
  }
  return `${String(Math.round(value * 10) / 10)} ${unit}`;
}

const DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

/** ISO 시각을 서울 시간으로 보여 준다. 예: "2026. 11. 3. 오전 9:00" */
export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** 영상 안 시각(ms)을 "mm:ss"로, 1시간 이상이면 "h:mm:ss"로 보여 준다. 예: 95000 → "01:35" */
export function formatMediaTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${String(hours)}:${mmss}` : mmss;
}
