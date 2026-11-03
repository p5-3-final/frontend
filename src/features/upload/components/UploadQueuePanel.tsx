import { formatBytes } from "../../../shared/lib/format";
import { ProgressBar } from "../../../shared/ui/ProgressBar";
import { useUploadQueue } from "../hooks/useUploadQueue";
import type { UploadItem } from "../model/uploadQueue";

/** 업로드 대기열. 파일마다 상태와 진행률을 보여 준다(SPEC-005 R-8). */
export function UploadQueuePanel() {
  const uploads = useUploadQueue();
  if (uploads.length === 0) {
    return null;
  }
  return (
    <ul aria-label="업로드 대기열" className="flex flex-col gap-2">
      {uploads.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span data-testid="upload-file-name" className="min-w-0 font-medium break-all">
              {item.fileName}
            </span>
            <span className="text-sm text-muted">{formatBytes(item.sizeBytes)}</span>
          </div>
          <UploadState item={item} />
        </li>
      ))}
    </ul>
  );
}

function UploadState({ item }: { item: UploadItem }) {
  switch (item.status) {
    case "waiting":
      return <p className="text-sm text-muted">대기 중</p>;
    case "uploading": {
      const percent = item.sizeBytes === 0 ? 0 : (item.loadedBytes / item.sizeBytes) * 100;
      return (
        <div className="flex items-center gap-3">
          <ProgressBar percent={percent} label={`${item.fileName} 업로드 진행률`} />
          <span className="w-12 shrink-0 text-right text-sm text-muted">
            {Math.round(percent)}%
          </span>
        </div>
      );
    }
    case "done":
      return <p className="text-sm text-success">업로드 완료</p>;
    case "failed":
    case "rejected":
      return <p className="text-sm text-danger">{item.message}</p>;
  }
}
