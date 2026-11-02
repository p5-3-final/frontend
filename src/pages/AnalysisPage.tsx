import { CloudUpload, Film } from "lucide-react";
import { Button } from "../shared/ui/Button";
import { EmptyState } from "../shared/ui/EmptyState";

/** 로그인 후 첫 화면. 영상 업로드가 생기기 전까지는 빈 상태만 보여 준다(SPEC-002 R-16). */
export function AnalysisPage() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">영상 분석</h1>
        {/* 업로드 기능은 별도 spec에서 연다. 위치를 미리 보여 주되 누를 수 없게 둔다. */}
        <Button disabled>
          <CloudUpload aria-hidden="true" className="size-5" />
          영상 업로드
        </Button>
      </div>
      <EmptyState
        icon={Film}
        message="아직 분석한 영상이 없습니다."
        description="영상 업로드 기능이 준비되면 영상을 올려 위험 구간을 분석할 수 있습니다."
      />
    </section>
  );
}
