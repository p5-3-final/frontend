import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateSessionForm, SessionList } from "../features/sessions";
import { Button } from "../shared/ui/Button";
import { HistoryTabs } from "./HistoryTabs";

/** 분석 이력: 작업 세션 목록(SPEC-034 R-1, R-2) */
export function HistoryPage() {
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
          세션 만들기
        </Button>
      </div>
      <HistoryTabs />
      {creating && (
        <CreateSessionForm
          onCancel={() => {
            setCreating(false);
          }}
        />
      )}
      <SessionList onCreate={startCreating} />
    </div>
  );
}
