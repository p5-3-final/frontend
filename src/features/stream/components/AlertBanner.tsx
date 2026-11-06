import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { eventTypeName } from "../../../shared/lib/messages";
import { SeverityBadge } from "../../analysis";
import { useNotification } from "../../notifications";
import { applyAlert, removeAlert, type AlertFeed, type FeedAlert } from "../model/alertFeed";
import { streamSessionPath } from "../model/paths";

/**
 * 앱 상단 긴급 알림(SPEC-031 R-20). 어느 화면에서든 alert.raised를 받으면 바로(렌더 한 번) 보인다.
 * pending은 "확인 중", confirmed는 severity와 설명, dismissed는 접힌 한 줄이다. 누르면 그 세션 화면으로 간다.
 */
export function AlertBanner() {
  const [feed, setFeed] = useState<AlertFeed>([]);
  useNotification("alert.raised", (message) => {
    setFeed((current) => applyAlert(current, message));
  });
  if (feed.length === 0) {
    return null;
  }
  return (
    <section
      aria-label="새 긴급 알림"
      aria-live="assertive"
      className="flex flex-col gap-1 border-b border-danger/40 bg-danger-soft px-4 py-2"
    >
      <ul className="flex flex-col gap-1">
        {feed.map((alert) => (
          <AlertRow
            key={alert.candidateId}
            alert={alert}
            onClose={() => {
              setFeed((current) => removeAlert(current, alert.candidateId));
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function AlertRow({ alert, onClose }: { alert: FeedAlert; onClose: () => void }) {
  const name = eventTypeName(alert.eventType);
  const body = (
    <>
      <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
      <span className="font-semibold">{name}</span>
      {alert.status === "pending" && <span className="text-xs">확인 중</span>}
      {alert.status === "confirmed" && (
        <>
          <SeverityBadge severity={alert.severity} />
          {alert.description !== null && <span className="text-xs">{alert.description}</span>}
        </>
      )}
      {alert.status === "dismissed" && <span className="text-xs text-muted">오탐으로 기각됨</span>}
    </>
  );
  return (
    <li
      className={`flex items-center gap-2 text-sm ${alert.status === "dismissed" ? "text-muted opacity-70" : "text-danger"}`}
    >
      {alert.sourceId === null ? (
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{body}</span>
      ) : (
        <Link
          to={streamSessionPath(alert.sourceId)}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {body}
        </Link>
      )}
      <button
        type="button"
        aria-label={`${name} 알림 닫기`}
        onClick={onClose}
        className="rounded p-1 hover:bg-surface/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}
