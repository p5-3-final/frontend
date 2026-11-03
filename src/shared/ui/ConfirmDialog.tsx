import { useEffect, useId, useRef, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** 확인 요청이 진행 중이면 확인 버튼을 막는다. */
  pending?: boolean;
  /** 확인이 실패했을 때 창 안에 보여 줄 안내 */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 되돌릴 수 없는 동작 전에 묻는 모달 창. 내장 `<dialog>`의 `showModal`이 포커스 가두기와 Escape 닫기를 해 준다.
 * 화면에 그릴 때 열리고, 닫으려면 부모가 이 컴포넌트를 그리지 않으면 된다.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // showModal은 DOM API라서 그린 뒤에 부른다.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open === true) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape로 닫힐 때도 부모 상태가 바뀌도록 브라우저가 직접 닫지 않게 한다.
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-panel p-6 text-content backdrop:bg-surface/70"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      <div className="mt-3 text-sm text-muted">{children}</div>
      {error !== undefined && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button variant="danger" disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
