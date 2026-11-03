import { Film } from "lucide-react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { formatBytes, formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { ApiError } from "../../../shared/api/problem";
import { Alert } from "../../../shared/ui/Alert";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Pagination } from "../../../shared/ui/Pagination";
import { useVideos } from "../api/useVideos";
import { useUploadQueue } from "../hooks/useUploadQueue";
import type { Video } from "../model/schemas";
import { VIDEO_STATUS_NAMES } from "../model/videoStatus";

// URL의 ?page는 사용자가 바꿀 수 있는 입력이라 0 이상 정수만 받고, 아니면 첫 쪽을 보여 준다.
const pageParamSchema = z.coerce.number().int().min(0).catch(0);

/** 내 영상 목록. 최신순 20개씩 보여 주고 쪽을 URL에 둔다(SPEC-005 R-15~R-18). */
export function VideoList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageParamSchema.parse(searchParams.get("page") ?? 0);
  const { data, error, isPending } = useVideos(page);
  const uploads = useUploadQueue();
  // 이 화면에서 올리고 있는 영상은 "끝나지 않은 업로드" 안내를 보여 주지 않는다(R-17).
  const uploadingIds = new Set(
    uploads
      .filter((item) => item.status === "waiting" || item.status === "uploading")
      .map((item) => item.videoId),
  );

  if (isPending) {
    return <p className="text-sm text-muted">영상 목록을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  if (data.items.length === 0) {
    // R-18: 대기열에 파일이 있으면 빈 안내 대신 대기열만 보이게 둔다.
    return uploads.length === 0 ? (
      <EmptyState
        icon={Film}
        message="올린 영상이 없습니다."
        description="영상 업로드 버튼을 누르거나 파일을 이곳에 끌어다 놓으세요. mp4, mov, mkv, avi를 5GB까지 올릴 수 있습니다."
      />
    ) : null;
  }
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="내 영상" className="flex flex-col gap-2">
        {data.items.map((video) => (
          <VideoRow key={video.id} video={video} unfinished={!uploadingIds.has(video.id)} />
        ))}
      </ul>
      <Pagination
        page={page}
        totalPages={data.page.totalPages}
        onChange={(next) => {
          setSearchParams(next === 0 ? {} : { page: String(next) });
        }}
      />
    </div>
  );
}

function VideoRow({ video, unfinished }: { video: Video; unfinished: boolean }) {
  return (
    <li className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-3 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_12rem] lg:items-center">
      <span className="min-w-0 font-medium break-all">{video.fileName}</span>
      <span className="text-sm text-muted">{formatBytes(video.sizeBytes)}</span>
      <span className="text-sm">{VIDEO_STATUS_NAMES[video.status]}</span>
      <span className="text-sm text-muted">{formatDateTime(video.createdAt)}</span>
      {video.status === "UPLOADING" && unfinished && (
        <p className="text-sm text-warning lg:col-span-4">
          업로드가 끝나지 않았습니다. 24시간이 지나면 만료됩니다.
        </p>
      )}
    </li>
  );
}
