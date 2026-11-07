import { RetainedVideoList, RetentionDefaultToggle } from "../features/settings";
import { Panel } from "../shared/ui/Panel";

/** 설정: 학습용 보존 기본값과 보존 중인 삭제 영상(SPEC-034 R-9, R-10) */
export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">설정</h1>
      <Panel title="학습용 보존">
        <RetentionDefaultToggle />
      </Panel>
      <Panel title="보존 중인 삭제 영상">
        <RetainedVideoList />
      </Panel>
    </div>
  );
}
