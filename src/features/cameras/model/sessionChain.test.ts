import { describe, expect, it } from "vitest";
import { sessionBody } from "../../../../mocks/stream";
import { buildSessionChains } from "./sessionChain";

const id = (n: number) => `0192fb00-0000-7000-8000-${String(n).padStart(12, "0")}`;
const session = (n: number, previous: number | null) =>
  sessionBody({
    sessionId: id(n),
    sourceId: id(n),
    previousSourceId: previous === null ? null : id(previous),
  });
const ids = (chains: ReturnType<typeof buildSessionChains>) =>
  chains.map((chain) => chain.map((item) => item.sessionId));

describe("buildSessionChains", () => {
  it("[SPEC-034 R-14] 24시간 회전으로 이어진 세션을 previousSourceId로 한 줄에 묶는다(최근 것부터)", () => {
    // 3이 2를, 2가 1을 이었다. 4는 따로 시작한 세션이다.
    const chains = buildSessionChains([
      session(4, null),
      session(3, 2),
      session(2, 1),
      session(1, null),
    ]);

    expect(ids(chains)).toEqual([[id(4)], [id(3), id(2), id(1)]]);
  });

  it("[SPEC-034 R-14] 앞 세션이 목록 밖이면 그 세션에서 끝난 것으로 둔다", () => {
    expect(ids(buildSessionChains([session(3, 2)]))).toEqual([[id(3)]]);
  });

  it("[SPEC-034 R-14] 잘못된 순환 참조가 있어도 세션을 한 번씩만 놓는다", () => {
    const chains = buildSessionChains([session(1, 2), session(2, 1)]);

    expect(
      chains
        .flat()
        .map((item) => item.sessionId)
        .sort(),
    ).toEqual([id(1), id(2)]);
  });
});
