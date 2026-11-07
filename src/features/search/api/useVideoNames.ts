import { useQueries } from "@tanstack/react-query";
import { videoDetailQuery } from "../../upload";

export type VideoName =
  { status: "pending" } | { status: "error" } | { status: "success"; fileName: string };

/**
 * 결과에 나온 영상의 이름(SPEC-033 R-7). 검색 응답에 이름이 없어 고유 sourceId마다 getVideo를 부른다.
 * 영상 상세와 같은 query key를 써서 이미 받은 영상은 다시 묻지 않는다. 결과 50개면 최대 50번 묻는다.
 */
export function useVideoNames(sourceIds: readonly string[], enabled: boolean) {
  const unique = [...new Set(sourceIds)];
  return useQueries({
    queries: unique.map((sourceId) => ({ ...videoDetailQuery(sourceId), enabled })),
    combine: (results) =>
      new Map<string, VideoName>(
        results.map((result, index): [string, VideoName] => [
          unique[index] ?? "",
          result.data !== undefined
            ? { status: "success", fileName: result.data.fileName }
            : { status: result.isError ? "error" : "pending" },
        ]),
      ),
  });
}
