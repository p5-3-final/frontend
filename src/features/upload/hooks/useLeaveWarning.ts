import { useEffect } from "react";
import { useUploadQueue } from "./useUploadQueue";

/**
 * 올리거나 기다리는 파일이 있는 동안 탭을 닫거나 새로고침하면 브라우저가 떠날지 묻게 한다(SPEC-005 R-14).
 * 새로고침하면 메모리의 대기열이 사라지고 이어 올리기를 지원하지 않기 때문이다. 앱 안의 화면 이동은 막지 않는다.
 */
export function useLeaveWarning(): void {
  const uploads = useUploadQueue();
  const busy = uploads.some((item) => item.status === "waiting" || item.status === "uploading");

  useEffect(() => {
    if (!busy) {
      return undefined;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [busy]);
}
