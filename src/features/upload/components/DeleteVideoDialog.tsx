import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { useDeleteVideo } from "../api/useDeleteVideo";
import type { Video } from "../model/schemas";

export interface DeleteVideoDialogProps {
  video: Video;
  onClose: () => void;
  /** 지운 뒤 할 일. 없으면 창만 닫는다(SPEC-006 R-13: 상세 화면은 목록으로 이동). */
  onDeleted?: () => void;
}

/** 영상 삭제 확인 창(SPEC-005 R-19). 실패하면 창 안에 이유를 보여 준다(R-20). */
export function DeleteVideoDialog({ video, onClose, onDeleted = onClose }: DeleteVideoDialogProps) {
  const { mutate, isPending, error } = useDeleteVideo();
  return (
    <ConfirmDialog
      title="영상 삭제"
      confirmLabel="삭제"
      pending={isPending}
      error={
        error === null
          ? undefined
          : messageForCode(error instanceof ApiError ? error.code : undefined)
      }
      onConfirm={() => {
        mutate(video.id, { onSuccess: onDeleted });
      }}
      onCancel={onClose}
    >
      <p>
        <strong className="font-semibold break-all text-content">{video.fileName}</strong>을(를)
        지울까요? 이 영상의 분석 결과도 함께 지워지고 되돌릴 수 없습니다.
      </p>
    </ConfirmDialog>
  );
}
