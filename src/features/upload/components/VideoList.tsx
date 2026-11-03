import { Film, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
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
import { videoDetailPath } from "../model/paths";
import { VIDEO_STATUS_NAMES } from "../model/videoStatus";
import { DeleteVideoDialog } from "./DeleteVideoDialog";

// URL의 ?page는 사용자가 바꿀 수 있는 입력이라 0 이상 정수만 받고, 아니면 첫 쪽을 보여 준다.
const pageParamSchema = z.coerce.number().int().min(0).catch(0);

/** 내 영상 목록. 최신순 20개씩 보여 주고 쪽을 URL에 둔다(SPEC-005 R-15~R-18). */
export function VideoList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageParamSchema.parse(searchParams.get("page") ?? 0);
  const [deleting, setDeleting] = useState<Video>();

  // 삭제 확인 창은 목록 본문과 형제로 같은 자리에 둔다. 삭제 뒤 목록이 비어 본문이 바뀌어도 창이 다시 마운트되지 않아
  // 창 안의 오류 안내(R-20)가 남는다.
  return (
    <>
      <VideoListBody
        page={page}
        onPageChange={(next) => {
          setSearchParams(next === 0 ? {} : { page: String(next) });
        }}
        onDelete={setDeleting}
      />
      {deleting !== undefined && (
        <DeleteVideoDialog
          video={deleting}
          onClose={() => {
            setDeleting(undefined);
          }}
        />
      )}
    </>
  );
}

interface VideoListBodyProps {
  page: number;
  onPageChange: (page: number) => void;
  onDelete: (video: Video) => void;
}

function VideoListBody({ page, onPageChange, onDelete }: VideoListBodyProps) {
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
          <VideoRow
            key={video.id}
            video={video}
            unfinished={!uploadingIds.has(video.id)}
            onDelete={() => {
              onDelete(video);
            }}
          />
        ))}
      </ul>
      <Pagination page={page} totalPages={data.page.totalPages} onChange={onPageChange} />
    </div>
  );
}

interface VideoRowProps {
  video: Video;
  unfinished: boolean;
  onDelete: () => void;
}

function VideoRow({ video, unfinished, onDelete }: VideoRowProps) {
  return (
    <li className="relative grid gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-3 pr-14 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_12rem] lg:items-center">
      {/* 행 안에 삭제 버튼이 있어 행 전체가 아닌 파일 이름만 링크로 둔다(링크 안 버튼은 접근성 위반). */}
      <Link
        to={videoDetailPath(video.id)}
        className="min-w-0 font-medium break-all text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {video.fileName}
      </Link>
      <span className="text-sm text-muted">{formatBytes(video.sizeBytes)}</span>
      <span className="text-sm">{VIDEO_STATUS_NAMES[video.status]}</span>
      <span className="text-sm text-muted">{formatDateTime(video.createdAt)}</span>
      <button
        type="button"
        aria-label={`${video.fileName} 삭제`}
        title="삭제"
        onClick={onDelete}
        className="absolute top-2 right-2 inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>
      {video.status === "UPLOADING" && unfinished && (
        <p className="text-sm text-warning lg:col-span-4">
          업로드가 끝나지 않았습니다. 24시간이 지나면 만료됩니다.
        </p>
      )}
    </li>
  );
}
