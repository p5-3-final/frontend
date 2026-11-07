import { Plus } from "lucide-react";
import { useState } from "react";
import { CameraForm, CameraList } from "../features/cameras";
import { Button } from "../shared/ui/Button";
import { HistoryTabs } from "./HistoryTabs";

/** 분석 이력의 카메라 탭: 카메라 목록과 등록(SPEC-034 R-13) */
export function CamerasPage() {
  const [creating, setCreating] = useState(false);
  const startCreating = () => {
    setCreating(true);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">분석 이력</h1>
        <Button onClick={startCreating}>
          <Plus aria-hidden="true" className="size-4" />
          카메라 등록
        </Button>
      </div>
      <HistoryTabs />
      {creating && (
        <CameraForm
          onDone={() => {
            setCreating(false);
          }}
        />
      )}
      <CameraList onCreate={startCreating} />
    </div>
  );
}
