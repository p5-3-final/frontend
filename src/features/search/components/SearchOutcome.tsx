import { LoaderCircle, RotateCw } from "lucide-react";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import type { MomentSearchResult } from "../model/schemas";
import type { SearchErrorView } from "../model/searchError";
import { MomentResults } from "./MomentResults";

export interface SearchOutcomeProps {
  result: MomentSearchResult | undefined;
  isPending: boolean;
  /** 입력 옆에 보이는 오류(input)는 여기서 그리지 않는다. */
  errorView: SearchErrorView | undefined;
  onRetry: () => void;
}

/** 검색 요청의 상태별 화면: 검색 중, 안내(404), 다시 시도(5xx·네트워크), 결과(SPEC-033 R-13). 문장·이미지 검색이 함께 쓴다. */
export function SearchOutcome({ result, isPending, errorView, onRetry }: SearchOutcomeProps) {
  if (isPending) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-accent" />
        검색 중입니다.
      </p>
    );
  }
  if (errorView?.kind === "notice") {
    return <Alert>{errorView.message}</Alert>;
  }
  if (errorView?.kind === "retry") {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert>{errorView.message}</Alert>
        <Button variant="secondary" onClick={onRetry}>
          <RotateCw aria-hidden="true" className="size-4" />
          다시 시도
        </Button>
      </div>
    );
  }
  return result === undefined ? null : <MomentResults result={result} />;
}
