/** 플레이어 화면 상태. 진행 막대·시각 표시가 읽는다. */
export interface PlayerSnapshot {
  currentMs: number;
  durationMs: number;
  paused: boolean;
}

/**
 * 플레이어 조작 창구. 페이지가 하나 만들어 플레이어와 분석 결과 패널에 함께 넘긴다.
 * `<video>`는 React 밖의 외부 시스템이라 상태는 `subscribe`·`getSnapshot`으로 읽는다(`useSyncExternalStore`).
 */
export interface PlayerController {
  /** 재생 위치를 ms로 옮긴다. 메타데이터를 읽기 전이면 기억했다가 읽은 뒤 옮긴다. */
  seek: (ms: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentMs: () => number;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PlayerSnapshot;
  /** 플레이어가 자기 `<video>`를 연결한다. 화면에서 빠지면 null을 넘긴다. */
  attach: (element: HTMLVideoElement | null) => void;
}

const MEDIA_EVENTS = ["timeupdate", "durationchange", "loadedmetadata", "play", "pause", "seeked"];

/** `<video>` 하나를 감싸는 조작 창구를 만든다. */
export function createPlayerController(): PlayerController {
  let element: HTMLVideoElement | null = null;
  let pendingSeekMs: number | null = null;
  let snapshot: PlayerSnapshot = { currentMs: 0, durationMs: 0, paused: true };
  const listeners = new Set<() => void>();

  const read = (): PlayerSnapshot => {
    if (element === null) {
      // 플레이어가 아직 없으면 옮길 위치를 현재 위치로 보인다(주소로 바로 연 경우).
      return { ...snapshot, currentMs: pendingSeekMs ?? snapshot.currentMs };
    }
    const duration = Number.isFinite(element.duration) ? element.duration : 0;
    return {
      currentMs: Math.round(element.currentTime * 1000),
      durationMs: Math.round(duration * 1000),
      paused: element.paused,
    };
  };

  const notify = () => {
    const next = read();
    if (
      next.currentMs === snapshot.currentMs &&
      next.durationMs === snapshot.durationMs &&
      next.paused === snapshot.paused
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) {
      listener();
    }
  };

  const applyPendingSeek = () => {
    if (element === null || pendingSeekMs === null) {
      return;
    }
    element.currentTime = pendingSeekMs / 1000;
    pendingSeekMs = null;
    notify();
  };

  const handleMediaEvent = (event: Event) => {
    if (event.type === "loadedmetadata") {
      applyPendingSeek();
    }
    notify();
  };

  return {
    seek(ms) {
      const target = Math.max(0, ms);
      // 주소로 바로 연 경우(?event=, ?t=) 메타데이터 전에는 위치를 옮겨도 브라우저가 0으로 되돌린다.
      if (element === null || element.readyState < HTMLMediaElement.HAVE_METADATA) {
        pendingSeekMs = target;
        if (element !== null) {
          element.currentTime = target / 1000;
        }
        notify();
        return;
      }
      element.currentTime = target / 1000;
      notify();
    },
    play() {
      // 자동 재생이 막히면 사용자가 재생 버튼을 다시 누르면 된다.
      element?.play().catch(() => undefined);
    },
    pause() {
      element?.pause();
    },
    getCurrentMs: () => read().currentMs,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    attach(next) {
      if (element === next) {
        return;
      }
      for (const type of MEDIA_EVENTS) {
        element?.removeEventListener(type, handleMediaEvent);
      }
      element = next;
      for (const type of MEDIA_EVENTS) {
        element?.addEventListener(type, handleMediaEvent);
      }
      if (element !== null && pendingSeekMs !== null) {
        element.currentTime = pendingSeekMs / 1000;
      }
      notify();
    },
  };
}
