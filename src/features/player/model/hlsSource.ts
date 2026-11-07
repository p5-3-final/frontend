/** 플레이어가 쓰는 HLS 재생기 기능만 추린 것. 테스트는 가짜를 넘긴다. */
export interface HlsEngine {
  isSupported: () => boolean;
  /** 재생기를 만든다. 복구할 수 없는 오류가 나면 `onFatal`을 부른다. */
  create: (onFatal: () => void) => {
    load: (src: string, video: HTMLMediaElement) => void;
    destroy: () => void;
  };
}

/** hls.js가 쓰는 MediaSource(또는 iOS의 ManagedMediaSource)가 있는지 */
function browserHasMediaSource(): boolean {
  return "MediaSource" in window || "ManagedMediaSource" in window;
}

/** 서명 쿼리를 뺀 경로가 `.m3u8`로 끝나면 HLS 재생 목록이다. */
export function isHlsUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

// 기본 재생 경로와 첫 화면 번들에 hls.js(gzip 약 180KB, 별도 청크)가 들어가지 않게 HLS 주소일 때만 읽는다.
async function loadHlsJs(): Promise<HlsEngine> {
  const { default: Hls } = await import("hls.js");
  return {
    isSupported: () => Hls.isSupported(),
    create: (onFatal) => {
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onFatal();
        }
      });
      return {
        load: (src, video) => {
          hls.loadSource(src);
          hls.attachMedia(video);
        },
        destroy: () => {
          hls.destroy();
        },
      };
    },
  };
}

export interface AttachSourceOptions {
  /** hls.js가 복구할 수 없는 오류를 냈을 때. `<video>`의 error 이벤트 대신 쓴다. */
  onFatalError: () => void;
  /** 화면에서 빠지면 중단한다. 라이브러리를 읽는 중에 중단하면 붙이지 않는다. */
  signal?: AbortSignal;
  loadEngine?: () => Promise<HlsEngine>;
  hasMediaSource?: () => boolean;
}

/**
 * `<video>`에 재생 주소를 붙이고 떼는 함수를 돌려준다(SPEC-031 R-19).
 * HLS가 아니면 `src`를 그대로 쓴다. HLS는 MediaSource가 있으면 hls.js로 재생한다.
 * `canPlayType`을 먼저 보지 않는 이유: Chromium 156도 HLS를 "maybe"로 답하지만 라이브 HLS는 기본 재생되지 않는다(SPEC-031 R-19 보고).
 * MediaSource가 없는 브라우저(구형 iOS Safari)는 기본 재생을 쓴다. hls.js도 지원하지 않으면 `src`를 그대로 두어
 * `<video>`의 error로 재생 불가 안내가 보이게 한다.
 */
export async function attachSource(
  video: HTMLMediaElement,
  src: string,
  {
    onFatalError,
    signal,
    loadEngine = loadHlsJs,
    hasMediaSource = browserHasMediaSource,
  }: AttachSourceOptions,
): Promise<() => void> {
  const noop = () => undefined;
  if (!isHlsUrl(src) || !hasMediaSource()) {
    video.src = src;
    return noop;
  }
  const engine = await loadEngine();
  if (signal?.aborted === true) {
    return noop;
  }
  if (!engine.isSupported()) {
    video.src = src;
    return noop;
  }
  const player = engine.create(onFatalError);
  player.load(src, video);
  return player.destroy;
}
