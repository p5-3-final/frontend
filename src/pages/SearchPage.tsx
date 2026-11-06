import { SearchScreen } from "../features/search";

/** 사이드바 "검색"(SPEC-033). 문장·이미지로 장면을 찾고 결과에서 영상 상세로 간다. */
export function SearchPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">검색</h1>
      <SearchScreen />
    </div>
  );
}
