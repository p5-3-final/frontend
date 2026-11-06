import { ApiError } from "../../../shared/api/problem";
import { GENERIC_ERROR_MESSAGE, messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";

export interface LoadErrorProps {
  error: Error;
  /** code가 없거나 모르는 오류(5xx·네트워크)일 때의 문구 */
  failedMessage: string;
  onRetry: () => void;
}

/**
 * media 조회 오류 안내(SPEC-034 R-12). 4xx는 다시 시도해도 같아서 code 문구만, 그 밖(5xx·네트워크)은 "다시 시도"를 둔다.
 */
export function LoadError({ error, failedMessage, onRetry }: LoadErrorProps) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return <Alert>{messageForCode(error.code)}</Alert>;
  }
  const message = error instanceof ApiError ? messageForCode(error.code) : GENERIC_ERROR_MESSAGE;
  return (
    <div className="flex flex-col items-start gap-2">
      <Alert>{message === GENERIC_ERROR_MESSAGE ? failedMessage : message}</Alert>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
