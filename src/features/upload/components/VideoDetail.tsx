import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { formatBytes, formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { useVideo } from "../api/useVideo";
import { VIDEO_LIST_PATH } from "../model/paths";
import { videoQueryKeys } from "../model/queryKeys";
import type { Video } from "../model/schemas";
import { isPlayable, NOT_PLAYABLE_REASONS, VIDEO_STATUS_NAMES } from "../model/videoStatus";
import { DeleteVideoDialog } from "./DeleteVideoDialog";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const deletedRef = useRef(false);

  // SPEC-006 R-13: 지운 영상의 상세 캐시는 이 화면이 사라질 때 버린다.
  // 화면에 있는 동안 버리면 이 화면이 지운 영상을 다시 불러와 "찾을 수 없음"이 잠깐 보인다.
  useEffect(
    () => () => {
      if (deletedRef.current) {
        queryClient.removeQueries({ queryKey: videoQueryKeys.detail(videoId) });
      }
    },
    [queryClient, videoId],
  );

  if (isPending) {
    return <p className="text-sm text-muted">영상 정보를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    // R-12: MEDIA_VIDEO_NOT_FOUND도 공통 문구 표에 있어 code로 문구를 고른다.
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 text-xl font-bold break-all">{video.fileName}</h1>
        <Button
          variant="secondary"
          aria-label={`${video.fileName} 삭제`}
          onClick={() => {
            setDeleting(true);
          }}
          className="shrink-0"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          삭제
        </Button>
      </div>
      {isPlayable(video.status) ? (
        <OriginalPlayer video={video} />
      ) : (
        <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
          {NOT_PLAYABLE_REASONS[video.status]}
        </p>
      )}
      <VideoFacts video={video} />
      {deleting && (
        <DeleteVideoDialog
          video={video}
          onClose={() => {
            setDeleting(false);
          }}
          onDeleted={() => {
            // SPEC-006 R-13: 지운 영상의 상세에 머물 이유가 없어 목록으로 가고, 뒤로 가기로 돌아오지 않게 바꿔 넣는다.
            deletedRef.current = true;
            void navigate(VIDEO_LIST_PATH, { replace: true });
          }}
        />
      )}
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
