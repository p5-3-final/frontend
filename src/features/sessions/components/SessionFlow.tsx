import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { formatMediaTime } from "../../../shared/lib/format";
import { eventTypeName } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Panel } from "../../../shared/ui/Panel";
import { videoDetailPath } from "../../upload";
import { buildSessionFlow, type FlowItem, type FlowSource } from "../model/sessionFlow";
import { sessionRoleName } from "../model/roles";

export interface SessionFlowProps {
  sources: readonly FlowSource[];
  pending: boolean;
  error: boolean;
  /** 분석이 끝나지 않은 영상이 있으면 참(R-5) */
  incomplete: boolean;
}

/**
 * 세션 흐름 요약(SPEC-034 R-4). 이어 온 위험과 작업 전후 비교 이벤트를 영상 순서·시각 순으로 보인다.
 * 누르면 그 영상 상세를 이벤트(또는 위험 시작 시각)로 연다.
 */
export function SessionFlow({ sources, pending, error, incomplete }: SessionFlowProps) {
  const items = buildSessionFlow(sources);
  return (
    <Panel title="세션 흐름 요약">
      {incomplete && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          분석이 끝나지 않은 영상이 있어 비교가 완전하지 않습니다.
        </p>
      )}
      {error && (
        <Alert>일부 영상의 분석 결과를 불러오지 못해 흐름 요약이 빠졌을 수 있습니다.</Alert>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          {pending
            ? "흐름 요약을 만드는 중입니다."
            : "이어 온 위험이나 방호 미복구·물건 제거·이동 이벤트가 없습니다."}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item) => (
            <FlowRow key={`${item.kind}-${item.videoId}-${item.id}`} item={item} />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function FlowRow({ item }: { item: FlowItem }) {
  const role = item.video.session?.role;
  const where = `${role === undefined ? "" : `${sessionRoleName(role)} · `}${item.video.fileName} ${formatMediaTime(item.atMs)}`;
  const target =
    item.kind === "event"
      ? videoDetailPath(item.videoId, { eventId: item.event.eventId })
      : videoDetailPath(item.videoId, { seekMs: item.atMs });
  return (
    <li>
      <Link
        to={target}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-panel-raised px-3 py-2 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {item.kind === "risk" ? (
          <>
            <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              이전 영상에서 이어짐
            </span>
            <span className="font-medium">{item.risk.reason}</span>
            <span className="text-sm text-muted">{eventTypeName(item.risk.riskType)}</span>
          </>
        ) : (
          <span className="font-medium">{eventTypeName(item.event.eventType)}</span>
        )}
        <span className="text-sm text-muted">{where}</span>
        <ArrowRight aria-hidden="true" className="ml-auto size-4 text-muted" />
      </Link>
    </li>
  );
}
