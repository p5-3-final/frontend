// jsdom은 ResizeObserver를 구현하지 않는다. 관찰 콜백만 모아 두고 테스트가 `resizeObservedForTest()`로 부른다.
class TestResizeObserver {
  static readonly instances = new Set<TestResizeObserver>();
  constructor(readonly callback: ResizeObserverCallback) {}
  observe() {
    TestResizeObserver.instances.add(this);
  }
  unobserve() {
    TestResizeObserver.instances.delete(this);
  }
  disconnect() {
    TestResizeObserver.instances.delete(this);
  }
}

export function installResizeObserver() {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: TestResizeObserver,
  });
}

/** 관찰 중인 모든 요소의 크기가 바뀐 것처럼 콜백을 부른다. */
export function resizeObservedForTest() {
  for (const observer of TestResizeObserver.instances) {
    observer.callback([], observer);
  }
}
