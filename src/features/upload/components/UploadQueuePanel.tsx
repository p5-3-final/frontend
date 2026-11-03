import { RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { formatBytes } from "../../../shared/lib/format";
import { ProgressBar } from "../../../shared/ui/ProgressBar";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { cancelUpload, dismissUpload, retryUpload, type UploadItem } from "../model/uploadQueue";

/** 업로드 대기열. 파일마다 상태와 진행률, 취소·다시 시도·닫기를 보여 준다(SPEC-005 R-8, R-10~R-12). */
export function UploadQueuePanel() {
  const uploads = useUploadQueue();
  if (uploads.length === 0) {
    return null;
  }
  // SPEC-005 NFR-5: 가장 최근에 끝난 파일의 결과를 화면 낭독기가 읽게 한다. 대기열은 처리 순서대로라 뒤쪽이 최근이다.
  const latest = uploads.findLast((item) => item.status === "done" || item.status === "failed");
  const announcement =
    latest === undefined
      ? ""
      : `${latest.fileName} 업로드 ${latest.status === "done" ? "완료" : "실패"}`;
  return (
    <div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">{formatBytes(item.sizeBytes)}</span>
                <UploadActions item={item} />
              </div>
            </div>
            <UploadState item={item} />
          </li>
        ))}
      </ul>
    </div>
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

function UploadActions({ item }: { item: UploadItem }) {
  if (item.status === "waiting" || item.status === "uploading") {
    return (
      <IconButton
        label={`${item.fileName} 업로드 취소`}
        onClick={() => {
          cancelUpload(item.id);
        }}
      >
        <X aria-hidden="true" className="size-4" />
      </IconButton>
    );
  }
  return (
    <>
      {item.status === "failed" && (
        <IconButton
          label={`${item.fileName} 다시 시도`}
          onClick={() => {
            retryUpload(item.id);
          }}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </IconButton>
      )}
      <IconButton
        label={`${item.fileName} 닫기`}
        onClick={() => {
          dismissUpload(item.id);
        }}
      >
        <X aria-hidden="true" className="size-4" />
      </IconButton>
    </>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-panel-raised hover:text-content focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
