import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Switch } from "../../../shared/ui/Switch";
import { useMe } from "../../auth";
import { useUpdateRetentionConsent } from "../api/useUpdateRetentionConsent";
import type { Video } from "../model/schemas";

export interface RetentionConsentToggleProps {
  video: Video;
}

/**
 * 영상별 학습용 보존 동의(SPEC-034 R-11). 계약상 소유자만 바꿀 수 있어 ADMIN이어도 소유자가 아니면 그리지 않는다.
 * 보존 여부는 영상을 지울 때의 값으로 정해진다(SPEC-018 R-5).
 */
export function RetentionConsentToggle({ video }: RetentionConsentToggleProps) {
  const me = useMe();
  const update = useUpdateRetentionConsent(video.id);
  if (me.data?.id !== video.ownerId) {
    return null;
  }
  const errorCode = update.error instanceof ApiError ? update.error.code : undefined;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4">
      <Switch
        label="이 영상 학습용 보존 동의"
        description="켜 두면 이 영상을 지울 때 모델 개선용으로 1년간 보존합니다."
        checked={video.retentionConsent}
        disabled={update.isPending}
        onChange={(consent) => {
          update.mutate(consent);
        }}
      />
      {update.isSuccess && <Alert tone="success">영상을 지울 때의 값이 적용됩니다.</Alert>}
      {update.isError && <Alert>{messageForCode(errorCode)}</Alert>}
    </div>
  );
}
