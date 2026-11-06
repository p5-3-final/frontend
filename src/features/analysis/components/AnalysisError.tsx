import { ApiError } from "../../../shared/api/problem";
import {
  ANALYSIS_LOAD_FAILED_MESSAGE,
  ANALYSIS_NOT_FOUND_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  messageForCode,
} from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";

export interface AnalysisErrorProps {
  error: Error;
  onRetry: () => void;
}

/**
 * 분석 패널의 오류 안내(SPEC-031 R-17). 404는 다시 시도해도 같아서 안내만, 그 밖(5xx·네트워크)은 "다시 시도"를 둔다.
 * 패널마다 따로 그려 위험 API 하나가 실패해도 다른 패널은 보인다.
 */
export function AnalysisError({ error, onRetry }: AnalysisErrorProps) {
  if (error instanceof ApiError && error.status === 404) {
    const message = messageForCode(error.code);
    return (
      <Alert>{message === GENERIC_ERROR_MESSAGE ? ANALYSIS_NOT_FOUND_MESSAGE : message}</Alert>
    );
  }
  const message = error instanceof ApiError ? messageForCode(error.code) : GENERIC_ERROR_MESSAGE;
  return (
    <div className="flex flex-col items-start gap-2">
      <Alert>{message === GENERIC_ERROR_MESSAGE ? ANALYSIS_LOAD_FAILED_MESSAGE : message}</Alert>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
