import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { formatBytes, formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { useVideo } from "../api/useVideo";
import { VIDEO_LIST_PATH } from "../model/paths";
import type { Video } from "../model/schemas";
import { isPlayable, NOT_PLAYABLE_REASONS, VIDEO_STATUS_NAMES } from "../model/videoStatus";
import { OriginalPlayer } from "./OriginalPlayer";

export interface VideoDetailProps {
  videoId: string;
}

// URL의 영상 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식만 서버에 묻는다(SPEC-006 R-12).
const videoIdSchema = z.guid();

/** 영상 상세 화면(SPEC-006). 위에 목록으로 돌아가는 링크를 두고 아래에 영상 정보를 보여 준다. */
export function VideoDetail({ videoId }: VideoDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        to={VIDEO_LIST_PATH}
        className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        목록으로 돌아가기
      </Link>
      {videoIdSchema.safeParse(videoId).success ? (
        <VideoDetailBody videoId={videoId} />
      ) : (
        <Alert>{messageForCode("MEDIA_VIDEO_NOT_FOUND")}</Alert>
      )}
    </div>
  );
}

function VideoDetailBody({ videoId }: VideoDetailProps) {
  const { data: video, error, isPending } = useVideo(videoId);

  if (isPending) {
    return <p className="text-sm text-muted">영상 정보를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    // R-12: MEDIA_VIDEO_NOT_FOUND도 공통 문구 표에 있어 code로 문구를 고른다.
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return (
    <>
      <h1 className="text-xl font-bold break-all">{video.fileName}</h1>
      {isPlayable(video.status) ? (
        <OriginalPlayer video={video} />
      ) : (
        <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          {NOT_PLAYABLE_REASONS[video.status]}
        </p>
      )}
      <VideoFacts video={video} />
    </>
  );
}

// SPEC-006 R-7
function VideoFacts({ video }: { video: Video }) {
  const facts = [
    ["크기", formatBytes(video.sizeBytes)],
    ["형식", video.contentType],
    ["상태", VIDEO_STATUS_NAMES[video.status]],
    ["올린 시각", formatDateTime(video.createdAt)],
    ["업로드 완료 시각", video.uploadedAt === null ? "-" : formatDateTime(video.uploadedAt)],
  ] as const;
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-4 text-sm">
      {facts.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-muted">{term}</dt>
          <dd className="break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
