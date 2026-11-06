import { Play } from "lucide-react";
import { Link } from "react-router";
import { videoDetailPath } from "../../upload";
import type { SearchJumpState } from "../model/jumpState";
import { formatMatchedBy, formatRange, formatSimilarity } from "../model/format";
import type { MomentResult } from "../model/schemas";
import { GroundingSlot } from "./GroundingSlot";

export interface MomentResultItemProps {
  moment: MomentResult;
  /** 내 영상 전체 검색이면 결과마다 영상 이름을 보인다(SPEC-033 R-7). */
  videoName?: string | undefined;
}

/** 검색 결과 한 줄(SPEC-033 R-1). */
export function MomentResultItem({ moment, videoName }: MomentResultItemProps) {
  const range = formatRange(moment.startMs, moment.endMs);
  // 영상 상세가 재생 시간을 이 결과로 기록한다(SPEC-033 R-11).
  const jumpState: SearchJumpState = { searchMomentId: moment.momentId };
  return (
    <li className="flex gap-3 rounded-lg border border-line bg-panel-raised p-3">
      {moment.thumbnailUrl === null ? (
        <div
          aria-hidden="true"
          className="flex h-18 w-32 shrink-0 items-center justify-center rounded-md bg-surface text-muted"
        >
          <Play className="size-5" />
        </div>
      ) : (
        // NFR-1: 화면에 보이는 썸네일만 받는다.
        <img
          src={moment.thumbnailUrl}
          alt={`${range} 장면`}
          loading="lazy"
          width={128}
          height={72}
          className="h-18 w-32 shrink-0 rounded-md bg-surface object-cover"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        {videoName !== undefined && <p className="truncate font-semibold">{videoName}</p>}
        <p className="font-semibold tabular-nums">{range}</p>
        <p className="flex flex-wrap gap-x-3 text-muted">
          <span className="tabular-nums">{formatSimilarity(moment.similarity)}</span>
          <span>{formatMatchedBy(moment.matchedBy)}</span>
        </p>
        <GroundingSlot moment={moment} />
        <Link
          to={videoDetailPath(moment.sourceId, { seekMs: moment.seekMs })}
          state={jumpState}
          aria-label={`${range} 장면 보기`}
          className="inline-flex items-center gap-1 self-start font-semibold text-accent hover:text-accent-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Play aria-hidden="true" className="size-4" />이 장면 보기
        </Link>
      </div>
    </li>
  );
}
