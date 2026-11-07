import type { SessionStatus } from "../../stream";
import type { CameraStatus } from "../model/schemas";
import { CAMERA_STATUS_NAMES } from "../model/status";

const TONES: Readonly<Record<CameraStatus | SessionStatus, string>> = {
  IDLE: "border-line text-muted",
  STARTING: "border-accent/40 text-accent",
  LIVE: "border-accent bg-accent-soft text-accent",
  STOPPING: "border-warning/40 text-warning",
  CLOSED: "border-line text-muted",
  FAILED: "border-danger/40 bg-danger-soft text-danger",
};

/** 카메라·세션 상태. 색과 함께 글자로도 보인다. */
export function CameraStatusBadge({ status }: { status: CameraStatus | SessionStatus }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${TONES[status]}`}
    >
      {CAMERA_STATUS_NAMES[status]}
    </span>
  );
}
