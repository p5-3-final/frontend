/** 작업을 대기열에 넣고 자리가 나면 실행한다. 반환값은 작업의 결과다. */
export type ConcurrencyLimiter = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * 동시에 `max`개까지만 실행하는 대기열을 만든다. 넣은 순서대로 실행하고, 작업이 성공하든 실패하든 끝나면 다음 작업을 꺼낸다.
 * 세션 상세가 영상 20개의 분석 요청을 한꺼번에 보내지 않게 한다(SPEC-034 NFR-1).
 */
export function limitConcurrency(max: number): ConcurrencyLimiter {
  let running = 0;
  const waiting: (() => void)[] = [];

  const next = () => {
    running--;
    waiting.shift()?.();
  };

  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const start = () => {
        running++;
        let result: Promise<T>;
        try {
          result = task();
        } catch (error: unknown) {
          // 동기로 던진 작업도 자리를 비우게 거절된 Promise로 바꾼다.
          result = Promise.reject(error instanceof Error ? error : new Error(String(error)));
        }
        result.then(resolve, reject).finally(next);
      };
      if (running < max) {
        start();
      } else {
        waiting.push(start);
      }
    });
}
