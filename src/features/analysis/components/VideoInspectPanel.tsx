import { Button } from "../../../shared/ui/Button";
import { useVideoInspect } from "../hooks/useVideoInspect";
import { SOURCE_ZONE_KINDS } from "../model/inspectSchemas";
import { AnalysisError } from "./AnalysisError";
import { InspectResults } from "./InspectResults";
import { ZoneEditorPanel } from "./ZoneEditorPanel";

/** 플레이어 아래의 도구 막대와 클릭 조회 결과·구역 편집 패널(SPEC-032). */
export function VideoInspectPanel() {
  const inspect = useVideoInspect();
  return (
    <div className="flex flex-col gap-3">
      <div role="toolbar" aria-label="영상 도구" className="flex flex-wrap gap-2">
        {!inspect.editingZones && (
          <>
            <Button
              variant="secondary"
              className="h-9 aria-pressed:border-accent aria-pressed:text-accent"
              aria-pressed={inspect.overlayOn}
              onClick={() => {
                inspect.setOverlayOn(!inspect.overlayOn);
              }}
            >
              오버레이
            </Button>
            <Button variant="secondary" className="h-9" onClick={inspect.openZoneEditor}>
              위험구역 편집
            </Button>
          </>
        )}
      </div>
      {inspect.editingZones ? <ZoneSection /> : <InspectSection />}
    </div>
  );
}

function InspectSection() {
  const { sourceId, controller, inspect, closeInspect } = useVideoInspect();
  return (
    <InspectResults
      sourceId={sourceId}
      inspect={inspect}
      controller={controller}
      onClose={closeInspect}
    />
  );
}

function ZoneSection() {
  const { zoneEditor, closeZoneEditor } = useVideoInspect();
  if (zoneEditor.loadError !== null) {
    return <AnalysisError error={zoneEditor.loadError} onRetry={closeZoneEditor} />;
  }
  if (zoneEditor.draft === null) {
    return <p className="text-sm text-muted">구역을 불러오는 중입니다.</p>;
  }
  return (
    <ZoneEditorPanel
      draft={zoneEditor.draft}
      onAction={zoneEditor.dispatch}
      kinds={SOURCE_ZONE_KINDS}
      onSave={zoneEditor.save}
      saving={zoneEditor.saving}
      notice={zoneEditor.notice}
      onClose={closeZoneEditor}
    />
  );
}
