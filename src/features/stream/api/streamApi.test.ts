import { describe, expect, it } from "vitest";
import { STREAM_SESSION_ID, streamHandlers } from "../../../../mocks/stream";
import { recordRequests } from "../../../../tests/analysisDetail";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import {
  getSession,
  getSessionPlayback,
  getSessionState,
  listSessionAlerts,
  listSessionEvents,
} from "./streamApi";

describe("streamApi", () => {
  it("[SPEC-031 R-19] 계약 예시의 세션·재생 주소·상태를 읽는다", async () => {
    server.use(...streamHandlers());
    startSession("access-1");

    expect((await getSession(STREAM_SESSION_ID)).status).toBe("LIVE");
    expect((await getSessionPlayback(STREAM_SESSION_ID)).mode).toBe("live");
    expect((await getSessionState(STREAM_SESSION_ID)).sequence).toBe(16);
  });

  it("[SPEC-031 R-19] 타임라인과 알림을 쪽 크기 100으로 묻는다", async () => {
    const recorder = recordRequests();
    server.use(...streamHandlers());
    startSession("access-1");

    expect((await listSessionEvents(STREAM_SESSION_ID)).items[0]?.eventType).toBe("fall");
    expect((await listSessionAlerts(STREAM_SESSION_ID)).items[0]?.status).toBe("confirmed");
    const sizes = recorder.requests
      .filter((url) => /\/(events|alerts)$/.test(url.pathname))
      .map((url) => url.searchParams.get("size"));
    expect(sizes).toEqual(["100", "100"]);
    recorder.stop();
  });
});
