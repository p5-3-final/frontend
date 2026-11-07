import { Archive } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { formatDateTime } from "../../../shared/lib/format";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Pagination } from "../../../shared/ui/Pagination";
import { useRetainedVideos } from "../api/useRetainedVideos";
import { useRevokeRetained } from "../api/useRevokeRetained";
import type { RetainedVideo } from "../model/schemas";

// URL의 ?page는 사용자가 바꿀 수 있는 입력이라 0 이상 정수만 받고, 아니면 첫 쪽을 보여 준다.
const pageParamSchema = z.coerce.number().int().min(0).catch(0);

/** 철회 확인 대상. "all"이면 전체 철회다. */
type Revoking = { videoId: string } | "all";

/** 보존 중인 삭제 영상 목록과 철회(SPEC-034 R-10). 철회는 확인 창 뒤에 요청한다. */
export function RetainedVideoList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageParamSchema.parse(searchParams.get("page") ?? 0);
  const { data, error, isPending } = useRetainedVideos(page);
  const revoke = useRevokeRetained();
  const [revoking, setRevoking] = useState<Revoking>();
  const [notice, setNotice] = useState<string>();

  const handleConfirm = () => {
    if (revoking === undefined) {
      return;
    }
    setNotice(undefined);
    revoke.mutate(revoking === "all" ? undefined : revoking.videoId, {
      onSuccess: () => {
        setRevoking(undefined);
      },
      onError: (failure) => {
        // 이미 없는 영상은 창에 머물 이유가 없어 닫고 목록 위에 알린다.
        if (failure instanceof ApiError && failure.status === 404) {
          setRevoking(undefined);
          setNotice(messageForCode(failure.code));
        }
      },
    });
  };

  if (isPending) {
    return <p className="text-sm text-muted">보존 중인 영상을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  const total = data.page.totalElements;
  return (
    <div className="flex flex-col gap-3">
      {notice !== undefined && <Alert>{notice}</Alert>}
      {data.items.length === 0 ? (
        <EmptyState
          icon={Archive}
          message="보존 중인 삭제 영상이 없습니다."
          description="학습용 보존에 동의한 영상을 지우면 1년간 이곳에 남고, 언제든 철회할 수 있습니다."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">보존 중인 영상 {total}개</p>
            <Button
              variant="secondary"
              onClick={() => {
                setRevoking("all");
              }}
            >
              전체 철회
            </Button>
          </div>
          <ul aria-label="보존 중인 삭제 영상" className="flex flex-col gap-2">
            {data.items.map((video) => (
              <RetainedRow
                key={video.videoId}
                video={video}
                onRevoke={() => {
                  setRevoking({ videoId: video.videoId });
                }}
              />
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={data.page.totalPages}
            onChange={(next) => {
              setSearchParams(next === 0 ? {} : { page: String(next) });
            }}
          />
        </>
      )}
      {revoking !== undefined && (
        <ConfirmDialog
          title={revoking === "all" ? "학습용 보존 전체 철회" : "학습용 보존 철회"}
          confirmLabel={revoking === "all" ? "전체 철회" : "철회"}
          pending={revoke.isPending}
          error={
            revoke.isError
              ? messageForCode(revoke.error instanceof ApiError ? revoke.error.code : undefined)
              : undefined
          }
          onConfirm={handleConfirm}
          onCancel={() => {
            revoke.reset();
            setRevoking(undefined);
          }}
        >
          {revoking === "all"
            ? `보존 중인 영상 ${String(total)}개의 학습용 데이터를 모두 지웁니다. 되돌릴 수 없습니다.`
            : `영상 ${revoking.videoId}의 학습용 데이터를 지웁니다. 되돌릴 수 없습니다.`}
        </ConfirmDialog>
      )}
    </div>
  );
}

function RetainedRow({ video, onRevoke }: { video: RetainedVideo; onRevoke: () => void }) {
  return (
    <li className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-center">
      <span className="min-w-0 font-mono text-sm break-all">{video.videoId}</span>
      <span className="text-sm">
        <span className="text-muted">삭제 </span>
        {formatDateTime(video.deletedAt)}
      </span>
      <span className="text-sm">
        <span className="text-muted">보존 만료 </span>
        {formatDateTime(video.retainUntil)}
      </span>
      <Button variant="secondary" aria-label={`${video.videoId} 철회`} onClick={onRevoke}>
        철회
      </Button>
    </li>
  );
}
