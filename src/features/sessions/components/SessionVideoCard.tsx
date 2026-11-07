import { Link } from "react-router";
import { VIDEO_STATUS_NAMES, videoDetailPath, type Video } from "../../upload";
import type { SummaryQuery } from "../api/useSessionVideoSummaries";

export interface SessionVideoCardProps {
  video: Video;
  /** 아직 query가 없으면 불러오는 중으로 보인다. */
  summary: SummaryQuery | undefined;
}

/** 세션 상세의 영상 칸 하나(SPEC-034 R-3). 요약은 도착하는 대로 채운다(NFR-2). */
export function SessionVideoCard({ video, summary }: SessionVideoCardProps) {
  return (
    <li
      aria-label={video.fileName}
      className="flex flex-col gap-1 rounded-lg border border-line bg-panel-raised p-3"
    >
      <Link
        to={videoDetailPath(video.id)}
        className="font-medium break-all text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {video.fileName}
      </Link>
      <span className="text-sm text-muted">{VIDEO_STATUS_NAMES[video.status]}</span>
      <SummaryFacts summary={summary} />
    </li>
  );
}

function SummaryFacts({ summary }: { summary: SummaryQuery | undefined }) {
  if (summary === undefined || summary.isPending) {
    return <span className="text-sm text-muted">분석 정보 불러오는 중</span>;
  }
  if (summary.isError) {
    return <span className="text-sm text-danger">분석 정보를 불러오지 못했습니다.</span>;
  }
  if (summary.data.status === "NOT_ANALYZED") {
    return <span className="text-sm">분석 전</span>;
  }
  const { confirmedEvents = 0, activeRisks = 0 } = summary.data.counts;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
      <span className="font-semibold text-accent">분석됨</span>
      <span>확정 이벤트 {confirmedEvents}건</span>
      <span className={activeRisks > 0 ? "text-warning" : ""}>활성 위험 {activeRisks}건</span>
    </div>
  );
}
