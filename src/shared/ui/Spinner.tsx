import { LoaderCircle } from "lucide-react";

export interface SpinnerProps {
  /** 스크린 리더가 읽을 진행 상황 */
  label: string;
}

/** 화면 전체를 채우는 로딩 표시 */
export function Spinner({ label }: SpinnerProps) {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center bg-surface">
      <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-accent" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
