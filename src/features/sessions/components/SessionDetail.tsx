import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import type { Video } from "../../upload";
import { useSessionVideoAnalysis } from "../api/useSessionVideoSummaries";
import { useWorkSession } from "../api/useWorkSession";
import { HISTORY_PATH } from "../model/paths";
import { SESSION_ROLES, sessionRoleName, type SessionRole } from "../model/roles";
import type { WorkSessionDetail } from "../model/schemas";
import { LoadError } from "./LoadError";
import { SessionFlow } from "./SessionFlow";
import { SessionVideoCard } from "./SessionVideoCard";

// URL의 세션 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식만 서버에 묻는다(plan 3절 VII).
const sessionIdSchema = z.guid();

export interface SessionDetailProps {
  sessionId: string;
}

/** 작업 세션 상세(SPEC-034 R-3). 위에 목록으로 돌아가는 링크를 둔다. */
export function SessionDetail({ sessionId }: SessionDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        to={HISTORY_PATH}
        className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        세션 목록으로 돌아가기
      </Link>
      {sessionIdSchema.safeParse(sessionId).success ? (
        <SessionDetailBody sessionId={sessionId} />
      ) : (
        <Alert>{messageForCode("MEDIA_SESSION_NOT_FOUND")}</Alert>
      )}
    </div>
  );
}

function SessionDetailBody({ sessionId }: SessionDetailProps) {
  const { data: session, error, isPending, refetch } = useWorkSession(sessionId);
  if (isPending) {
    return <p className="text-sm text-muted">작업 세션을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return (
      <LoadError
        error={error}
        failedMessage="작업 세션을 불러오지 못했습니다."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  return <SessionContent session={session} />;
}

function SessionContent({ session }: { session: WorkSessionDetail }) {
  const analysis = useSessionVideoAnalysis(session.videos);
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold break-all">{session.name}</h1>
        <p className="text-sm text-muted">
          {[session.site, session.area].filter((value) => value !== null).join(" · ")}
          {session.site === null && session.area === null ? "" : " · "}
          {formatDateTime(session.createdAt)}
        </p>
      </header>
      <div className="grid gap-3 lg:grid-cols-3">
        {SESSION_ROLES.map((role) => (
          <RoleColumn
            key={role}
            role={role}
            videos={session.videos.filter((video) => video.session?.role === role)}
            renderCard={(video) => (
              <SessionVideoCard
                key={video.id}
                video={video}
                summary={analysis.summaries.get(video.id)}
              />
            )}
          />
        ))}
      </div>
      <SessionFlow
        sources={analysis.flowSources}
        pending={analysis.flowPending}
        error={analysis.flowError}
        incomplete={analysis.incomplete}
      />
    </>
  );
}

interface RoleColumnProps {
  role: SessionRole;
  videos: Video[];
  renderCard: (video: Video) => ReactNode;
}

// 서버가 이미 역할·완료 시각 순으로 주므로 다시 정렬하지 않는다(plan 4절).
function RoleColumn({ role, videos, renderCard }: RoleColumnProps) {
  const name = sessionRoleName(role);
  return (
    <section
      aria-label={name}
      className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-panel p-3"
    >
      <h2 className="text-base font-semibold">{name}</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-muted">영상 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">{videos.map(renderCard)}</ul>
      )}
    </section>
  );
}
