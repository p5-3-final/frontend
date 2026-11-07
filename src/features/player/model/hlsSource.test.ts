import { describe, expect, it, vi } from "vitest";
import { attachSource, isHlsUrl, type HlsEngine } from "./hlsSource";

const HLS = "http://localhost:8333/vlm-media/sources/s/live/hls/index.m3u8?X-Amz-Signature=hls-sig";
const MP4 = "http://localhost:8333/vlm-media/sources/v/original?X-Amz-Signature=play-sig";

function fakeEngine(supported = true) {
  const load = vi.fn<(src: string, video: HTMLMediaElement) => void>();
  const destroy = vi.fn();
  let fatal: () => void = () => {};
  const engine: HlsEngine = {
    isSupported: () => supported,
    create: (onFatal) => {
      fatal = onFatal;
      return { load, destroy };
    },
  };
  return {
    engine,
    load,
    destroy,
    raiseFatal: () => {
      fatal();
    },
  };
}

// Chromium 156도 HLS를 "maybe"로 답하지만 라이브 재생은 되지 않아, 기본 재생 응답과 관계없이 판단해야 한다.
function videoElement() {
  const video = document.createElement("video");
  video.canPlayType = (type: string) => (type === "application/vnd.apple.mpegurl" ? "maybe" : "");
  return video;
}

describe("isHlsUrl", () => {
  it("[SPEC-031 R-19] 서명 쿼리가 붙은 .m3u8 주소를 HLS로 본다", () => {
    expect(isHlsUrl(HLS)).toBe(true);
    expect(isHlsUrl(MP4)).toBe(false);
    expect(isHlsUrl("not a url")).toBe(false);
  });
});

describe("attachSource", () => {
  it("[SPEC-031 R-19] HLS가 아니면 라이브러리를 읽지 않고 주소를 그대로 둔다", async () => {
    const loadEngine = vi.fn();
    const video = videoElement();

    await attachSource(video, MP4, { onFatalError: vi.fn(), loadEngine });

    expect(video.getAttribute("src")).toBe(MP4);
    expect(loadEngine).not.toHaveBeenCalled();
  });

  it("[SPEC-031 R-19] MediaSource가 없으면(구형 iOS Safari) 라이브러리를 읽지 않고 기본 재생을 쓴다", async () => {
    const loadEngine = vi.fn();
    const video = videoElement();

    await attachSource(video, HLS, {
      onFatalError: vi.fn(),
      loadEngine,
      hasMediaSource: () => false,
    });

    expect(video.getAttribute("src")).toBe(HLS);
    expect(loadEngine).not.toHaveBeenCalled();
  });

  it("[SPEC-031 R-19] 기본 재생 응답이 maybe여도 hls.js를 지원하면 붙이고, 해제하면 destroy한다", async () => {
    const fake = fakeEngine();
    const video = videoElement();

    const detach = await attachSource(video, HLS, {
      onFatalError: vi.fn(),
      loadEngine: () => Promise.resolve(fake.engine),
      hasMediaSource: () => true,
    });

    expect(fake.load).toHaveBeenCalledWith(HLS, video);
    expect(video.hasAttribute("src")).toBe(false);
    detach();
    expect(fake.destroy).toHaveBeenCalledTimes(1);
  });

  it("[SPEC-031 R-19] hls.js도 지원하지 않으면 주소를 그대로 두어 재생 불가 안내로 이어지게 한다", async () => {
    const fake = fakeEngine(false);
    const video = videoElement();

    await attachSource(video, HLS, {
      onFatalError: vi.fn(),
      loadEngine: () => Promise.resolve(fake.engine),
      hasMediaSource: () => true,
    });

    expect(fake.load).not.toHaveBeenCalled();
    expect(video.getAttribute("src")).toBe(HLS);
  });

  it("[SPEC-031 R-19] 복구할 수 없는 재생 오류를 알린다", async () => {
    const fake = fakeEngine();
    const onFatalError = vi.fn();

    await attachSource(videoElement(), HLS, {
      onFatalError,
      loadEngine: () => Promise.resolve(fake.engine),
      hasMediaSource: () => true,
    });
    fake.raiseFatal();

    expect(onFatalError).toHaveBeenCalledTimes(1);
  });

  it("[SPEC-031 R-19] 라이브러리를 읽는 중에 해제하면 붙이지 않는다", async () => {
    const fake = fakeEngine();
    const signal = new AbortController();
    const pending = attachSource(videoElement(), HLS, {
      onFatalError: vi.fn(),
      loadEngine: () => Promise.resolve(fake.engine),
      hasMediaSource: () => true,
      signal: signal.signal,
    });
    signal.abort();
    await pending;

    expect(fake.load).not.toHaveBeenCalled();
  });
});
