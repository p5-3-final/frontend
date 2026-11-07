import { RotateCw } from "lucide-react";
import { Link } from "react-router";
import { ApiError } from "../../../shared/api/problem";
import { formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Panel } from "../../../shared/ui/Panel";
import { streamSessionPath } from "../../stream";
import { useCameraSessions } from "../api/useCamera";
import type { CameraSession } from "../model/schemas";
import { buildSessionChains } from "../model/sessionChain";
import { CameraStatusBadge } from "./CameraStatusBadge";

export interface CameraSessionHistoryProps {
  cameraId: string;
}

/** 카메라 세션 이력(SPEC-034 R-14). 24시간 회전으로 이어진 세션은 한 묶음으로 보인다. */
export function CameraSessionHistory({ cameraId }: CameraSessionHistoryProps) {
  const { data, error, isPending } = useCameraSessions(cameraId);
  return (
    <Panel title="세션 이력">
      {isPending ? (
        <p className="text-sm text-muted">세션 이력을 불러오는 중입니다.</p>
      ) : error !== null ? (
        <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted">수집 세션이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {buildSessionChains(data.items).map((chain, index) => (
            <ol
              key={chain[0]?.sessionId ?? index}
              aria-label={`세션 묶음 ${String(index + 1)}`}
              className="flex flex-col gap-1 rounded-lg border border-line bg-panel-raised p-2"
            >
              {chain.map((session, position) => (
                <SessionRow
                  key={session.sessionId}
                  session={session}
                  rotated={position < chain.length - 1}
                />
              ))}
            </ol>
          ))}
        </div>
      )}
    </Panel>
  );
}

interface SessionRowProps {
  session: CameraSession;
  /** 묶음 안 앞 세션에서 24시간 회전으로 이어졌으면 참 */
  rotated: boolean;
}

function SessionRow({ session, rotated }: SessionRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5">
      <CameraStatusBadge status={session.status} />
      <span className="text-sm">
        {formatDateTime(session.startedAt)}
        {session.closedAt !== null && ` ~ ${formatDateTime(session.closedAt)}`}
      </span>
      {rotated && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
          <RotateCw aria-hidden="true" className="size-3.5" />
          24시간 회전으로 이어짐
        </span>
      )}
      <Link
        to={streamSessionPath(session.sessionId)}
        className="ml-auto text-sm text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        세션 열기
      </Link>
    </li>
  );
}
