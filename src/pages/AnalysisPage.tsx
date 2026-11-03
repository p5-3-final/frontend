import { UploadButton, UploadDropzone, UploadQueuePanel, VideoList } from "../features/upload";

/** 로그인 후 첫 화면. 영상을 올리고 내 영상을 본다(SPEC-005). */
export function AnalysisPage() {
  return (
    <UploadDropzone>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">영상 분석</h1>
        <UploadButton />
      </div>
      <UploadQueuePanel />
      <VideoList />
    </UploadDropzone>
  );
}
