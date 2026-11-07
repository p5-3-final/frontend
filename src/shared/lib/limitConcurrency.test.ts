import { describe, expect, it } from "vitest";
import { limitConcurrency } from "./limitConcurrency";

function deferred() {
  let resolve: () => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("limitConcurrency", () => {
  it("[SPEC-034 NFR-1] 동시에 n개까지만 실행하고, 하나가 끝나면 다음을 실행한다", async () => {
    const run = limitConcurrency(2);
    const gates = [deferred(), deferred(), deferred()];
    let running = 0;
    let maxRunning = 0;
    const started: number[] = [];
    const results = gates.map((gate, index) =>
      run(async () => {
        started.push(index);
        running++;
        maxRunning = Math.max(maxRunning, running);
        await gate.promise;
        running--;
        return index;
      }),
    );
    await Promise.resolve();
    expect(started).toEqual([0, 1]);

    gates[0]?.resolve();
    await expect(results[0]).resolves.toBe(0);
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2]);
    gates[1]?.resolve();
    gates[2]?.resolve();
    await expect(Promise.all(results)).resolves.toEqual([0, 1, 2]);
    expect(maxRunning).toBe(2);
  });

  it("[SPEC-034 NFR-1] 실패한 작업도 자리를 비워 다음 작업이 실행된다", async () => {
    const run = limitConcurrency(1);
    const failing = run(() => Promise.reject(new Error("boom")));
    const next = run(() => Promise.resolve("ok"));

    await expect(failing).rejects.toThrow("boom");
    await expect(next).resolves.toBe("ok");
  });
});
