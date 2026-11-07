import { SessionRolePicker, useSessionRolePicker } from "../features/sessions";
import { UploadButton, UploadDropzone, UploadQueuePanel, VideoList } from "../features/upload";

/**
 * 로그인 후 첫 화면. 영상을 올리고 내 영상을 본다(SPEC-005).
 * 세션·역할 고르기(sessions)가 정한 대상을 업로드 버튼·끌어 놓기(upload)에 넘긴다(SPEC-034 R-6).
 * 그래서 upload는 sessions를 모른다.
 */
export function AnalysisPage() {
  const picker = useSessionRolePicker();
  return (
    <UploadDropzone resolveTarget={picker.resolveTarget}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">영상 분석</h1>
        <UploadButton resolveTarget={picker.resolveTarget} />
      </div>
      <SessionRolePicker picker={picker} />
      <UploadQueuePanel />
      <VideoList />
    </UploadDropzone>
  );
}
