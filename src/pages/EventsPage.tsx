import { AllEventsList } from "../features/analysis";

/** "이벤트" 메뉴. 내 영상 전체의 이벤트를 거르고 영상 상세로 간다(SPEC-031 R-11). */
export function EventsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">이벤트</h1>
      <AllEventsList />
    </div>
  );
}
