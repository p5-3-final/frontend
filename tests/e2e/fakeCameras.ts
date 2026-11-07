import type { Page, Route } from "@playwright/test";
import {
  cameraBody,
  sessionBody,
  STREAM_API,
  type CameraBody,
  type SessionBody,
} from "../../mocks/stream";

export interface FakeCamerasState {
  cameras: CameraBody[];
  sessions: SessionBody[];
}

function problem(status: number, code: string) {
  return {
    status,
    contentType: "application/problem+json",
    body: JSON.stringify({ type: "about:blank", title: "Error", status, code }),
  };
}

const page0 = <T>(items: T[]) => ({
  items,
  page: { page: 0, size: 100, totalElements: items.length, totalPages: 1 },
});

/**
 * E2E용 가짜 카메라·세션 관리 API(SPEC-036 계약). 세션 라이브 조회는 `useFakeStream`이 맡으므로
 * 그것보다 뒤에 등록하고, 이 가짜가 모르는 요청은 앞 가짜로 넘긴다.
 * `goLive()`는 수집기가 첫 창을 받아 세션이 LIVE가 된 상황을 흉내 낸다.
 */
export async function useFakeCameras(page: Page, initial: Partial<FakeCamerasState> = {}) {
  const state: FakeCamerasState = {
    cameras: initial.cameras ?? [],
    sessions: initial.sessions ?? [],
  };
  let nextId = 0;
  const setStatus = (sessionId: string, status: SessionBody["status"]) => {
    state.sessions = state.sessions.map((item) =>
      item.sessionId === sessionId ? { ...item, status } : item,
    );
    state.cameras = state.cameras.map((camera) =>
      camera.activeSessionId === sessionId
        ? { ...camera, status: status === "CLOSED" ? "IDLE" : status }
        : camera,
    );
  };

  await page.route(`${STREAM_API}/cameras**`, async (route: Route) => {
    const request = route.request();
    const [, cameraId, sub] = new URL(request.url()).pathname
      .replace("/api/v1/stream/cameras", "")
      .split("/");
    if (cameraId === undefined || cameraId === "") {
      if (request.method() === "POST") {
        const body: unknown = request.postDataJSON();
        const input =
          typeof body === "object" && body !== null ? Object.fromEntries(Object.entries(body)) : {};
        nextId++;
        const camera = cameraBody({
          cameraId: `0192fb00-0000-7000-8000-${String(nextId + 500).padStart(12, "0")}`,
          name: String(input.name),
          rtspSecretRef: String(input.rtspSecretRef),
          profileVersion: String(input.profileVersion),
          status: "IDLE",
          activeSessionId: null,
        });
        state.cameras.push(camera);
        await route.fulfill({ status: 201, json: camera });
        return;
      }
      await route.fulfill({ json: page0(state.cameras) });
      return;
    }
    const camera = state.cameras.find((item) => item.cameraId === cameraId);
    if (camera === undefined) {
      await route.fulfill(problem(404, "STREAM_NOT_FOUND"));
      return;
    }
    if (sub === "sessions" && request.method() === "POST") {
      nextId++;
      const id = `0192fb00-0000-7000-8000-${String(nextId + 600).padStart(12, "0")}`;
      const session = sessionBody({
        sessionId: id,
        sourceId: id,
        cameraId,
        status: "STARTING",
        previousSourceId: null,
        startedAt: new Date().toISOString(),
      });
      state.sessions = [session, ...state.sessions];
      state.cameras = state.cameras.map((item) =>
        item.cameraId === cameraId ? { ...item, status: "STARTING", activeSessionId: id } : item,
      );
      await route.fulfill({ status: 201, json: session });
      return;
    }
    if (sub === "sessions") {
      await route.fulfill({
        json: page0(state.sessions.filter((item) => item.cameraId === cameraId)),
      });
      return;
    }
    await route.fulfill({ json: camera });
  });

  await page.route(`${STREAM_API}/sessions/*`, async (route: Route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }
    const sessionId = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    setStatus(sessionId, "STOPPING");
    const session = state.sessions.find((item) => item.sessionId === sessionId);
    await route.fulfill({ status: 202, json: session });
  });

  return {
    state,
    goLive: (sessionId: string) => {
      setStatus(sessionId, "LIVE");
    },
  };
}
