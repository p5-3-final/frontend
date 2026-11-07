import type { CameraSession } from "./schemas";

/**
 * 카메라 세션 이력을 24시간 회전으로 이어진 묶음으로 나눈다(SPEC-034 R-14).
 * `sessions`는 서버가 준 최근 것부터의 순서다. 묶음 안도 최근 것부터이고, 앞 세션은 `previousSourceId`로 찾는다.
 * 앞 세션이 목록 밖이면(쪽 밖·지워짐) 그 세션에서 묶음이 끝난다.
 */
export function buildSessionChains(sessions: readonly CameraSession[]): CameraSession[][] {
  const bySource = new Map(sessions.map((session) => [session.sourceId, session]));
  const continued = new Set(
    sessions.flatMap((session) =>
      session.previousSourceId !== null && bySource.has(session.previousSourceId)
        ? [session.previousSourceId]
        : [],
    ),
  );
  const placed = new Set<string>();
  const follow = (head: CameraSession): CameraSession[] => {
    const chain: CameraSession[] = [];
    for (
      let current: CameraSession | undefined = head;
      current !== undefined && !placed.has(current.sourceId);
      current =
        current.previousSourceId === null ? undefined : bySource.get(current.previousSourceId)
    ) {
      placed.add(current.sourceId);
      chain.push(current);
    }
    return chain;
  };
  const chains = sessions.filter((session) => !continued.has(session.sourceId)).map(follow);
  // 서로를 가리키는 잘못된 데이터는 머리가 없어 위에서 빠진다. 남은 세션도 한 번씩 보인다.
  const leftovers = sessions.filter((session) => !placed.has(session.sourceId)).map(follow);
  return [...chains, ...leftovers].filter((chain) => chain.length > 0);
}
