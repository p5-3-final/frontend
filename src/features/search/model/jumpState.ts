import { z } from "zod";

/** 검색 결과에서 영상 상세로 갈 때 이동 상태(`location.state`)에 넣는 값(SPEC-033 R-11). */
export interface SearchJumpState {
  searchMomentId: string;
}

const jumpStateSchema = z.object({ searchMomentId: z.guid() });

/** 이동 상태에서 검색 결과 ID를 읽는다. 다른 화면에서 왔거나 형식이 틀리면 undefined다. */
export function readSearchMomentId(state: unknown): string | undefined {
  const parsed = jumpStateSchema.safeParse(state);
  return parsed.success ? parsed.data.searchMomentId : undefined;
}
