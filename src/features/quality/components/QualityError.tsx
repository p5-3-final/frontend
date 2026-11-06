import { ApiError } from "../../../shared/api/problem";
import {
  GENERIC_ERROR_MESSAGE,
  QUALITY_FORBIDDEN_MESSAGE,
  QUALITY_LOAD_FAILED_MESSAGE,
  messageForCode,
} from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";

export interface QualityErrorProps {
  error: Error;
  onRetry: () => void;
}

/**
 * 품질 API 오류 안내(SPEC-035 R-20). 403은 권한 없음, 4xx는 code 문구만, 5xx·네트워크 오류는 "다시 시도"를 둔다.
 */
export function QualityError({ error, onRetry }: QualityErrorProps) {
  if (error instanceof ApiError && error.status === 403) {
    return <Alert>{QUALITY_FORBIDDEN_MESSAGE}</Alert>;
  }
  if (error instanceof ApiError && error.status < 500) {
    return <Alert>{messageForCode(error.code)}</Alert>;
  }
  const message = error instanceof ApiError ? messageForCode(error.code) : GENERIC_ERROR_MESSAGE;
  return (
    <div className="flex flex-col items-start gap-2">
      <Alert>{message === GENERIC_ERROR_MESSAGE ? QUALITY_LOAD_FAILED_MESSAGE : message}</Alert>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
