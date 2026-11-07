import { ChevronLeft, Play, Square } from "lucide-react";
import { Link } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { streamSessionPath } from "../../stream";
import { useCamera, useStartSession, useStopSession } from "../api/useCamera";
import { CAMERAS_PATH } from "../model/paths";
import type { Camera } from "../model/schemas";
import { CameraSessionHistory } from "./CameraSessionHistory";
import { CameraStatusBadge } from "./CameraStatusBadge";

// URL의 카메라 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식만 서버에 묻는다.
const cameraIdSchema = z.guid();

export interface CameraDetailProps {
  cameraId: string;
}

/** 카메라 상세(SPEC-034 R-13, R-14): 정보, 수집 시작·중지, 세션 이력 */
export function CameraDetail({ cameraId }: CameraDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        to={CAMERAS_PATH}
        className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        카메라 목록으로 돌아가기
      </Link>
      {cameraIdSchema.safeParse(cameraId).success ? (
        <CameraDetailBody cameraId={cameraId} />
      ) : (
        <Alert>{messageForCode("STREAM_NOT_FOUND")}</Alert>
      )}
    </div>
  );
}

function CameraDetailBody({ cameraId }: CameraDetailProps) {
  const { data: camera, error, isPending } = useCamera(cameraId);
  if (isPending) {
    return <p className="text-sm text-muted">카메라를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return (
    <>
      <CameraSummary camera={camera} />
      <CameraSessionHistory cameraId={cameraId} />
    </>
  );
}

function CameraSummary({ camera }: { camera: Camera }) {
  const start = useStartSession(camera.cameraId);
  const stop = useStopSession(camera.cameraId);
  const failure = start.error ?? stop.error;
  const facts = [
    ["상태", <CameraStatusBadge key="status" status={camera.status} />],
    ["RTSP 비밀값 참조", camera.rtspSecretRef],
    ["수집 프로필", camera.profileVersion],
    ["등록 시각", formatDateTime(camera.createdAt)],
  ] as const;
  return (
    <section aria-labelledby="camera-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 id="camera-heading" className="min-w-0 text-xl font-bold break-all">
          {camera.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {camera.activeSessionId !== null && camera.status === "LIVE" && (
            <Link
              to={streamSessionPath(camera.activeSessionId)}
              className="inline-flex h-11 items-center rounded-lg border border-accent px-4 font-semibold text-accent hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              실시간 세션 열기
            </Link>
          )}
          {camera.activeSessionId === null ? (
            <Button
              disabled={start.isPending}
              onClick={() => {
                stop.reset();
                start.mutate();
              }}
            >
              <Play aria-hidden="true" className="size-4" />
              수집 시작
            </Button>
          ) : (
            <Button
              variant="danger"
              disabled={stop.isPending || camera.status === "STOPPING"}
              onClick={() => {
                start.reset();
                if (camera.activeSessionId !== null) {
                  stop.mutate(camera.activeSessionId);
                }
              }}
            >
              <Square aria-hidden="true" className="size-4" />
              수집 중지
            </Button>
          )}
        </div>
      </div>
      {failure !== null && (
        <Alert>{messageForCode(failure instanceof ApiError ? failure.code : undefined)}</Alert>
      )}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-4 text-sm">
        {facts.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted">{term}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
