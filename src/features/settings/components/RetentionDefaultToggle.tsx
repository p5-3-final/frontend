import { Alert } from "../../../shared/ui/Alert";
import { Switch } from "../../../shared/ui/Switch";
import { useRetentionSettings } from "../api/useRetentionSettings";
import { useUpdateRetentionSettings } from "../api/useUpdateRetentionSettings";

/** 학습용 보존 기본값 켜고 끄기(SPEC-034 R-9). 이미 올린 영상의 동의는 바뀌지 않는다(SPEC-018 R-2). */
export function RetentionDefaultToggle() {
  const settings = useRetentionSettings();
  const update = useUpdateRetentionSettings();

  if (settings.isPending) {
    return <p className="text-sm text-muted">보존 설정을 불러오는 중입니다.</p>;
  }
  if (settings.isError) {
    return <Alert>보존 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</Alert>;
  }
  return (
    <div className="flex flex-col gap-3">
      <Switch
        label="학습용 보존 기본 동의"
        description="켜면 새로 올리는 영상을 지울 때 모델 개선용으로 1년간 보존합니다. 영상마다 영상 상세에서 바꿀 수 있습니다."
        checked={settings.data.defaultConsent}
        disabled={update.isPending}
        onChange={(defaultConsent) => {
          update.mutate({ defaultConsent });
        }}
      />
      {update.isSuccess && <Alert tone="success">이후에 올리는 영상에 적용됩니다.</Alert>}
      {update.isError && <Alert>보존 기본값을 저장하지 못했습니다. 다시 시도해 주세요.</Alert>}
    </div>
  );
}
