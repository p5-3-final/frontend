import type { Page } from "@playwright/test";
import {
  alertBody,
  liveEventBody,
  playbackBody,
  sessionBody,
  sessionStateBody,
  STREAM_API,
  type AlertBody,
  type LiveEventBody,
  type SessionBody,
  type SessionStateBody,
} from "../../mocks/stream";

export interface FakeStreamState {
  session: SessionBody;
  state: SessionStateBody;
  events: LiveEventBody[];
  alerts: AlertBody[];
}

/**
 * E2E용 가짜 stream-service 세션 조회(SPEC-036 계약). `state`를 바꾸면 다음 요청부터 그 값으로 답한다.
 * 세션이 CLOSED·FAILED면 라이브 조회는 계약대로 410 STREAM_SESSION_ARCHIVED다.
 */
export async function useFakeStream(page: Page, initial: Partial<FakeStreamState> = {}) {
  const state: FakeStreamState = {
    session: initial.session ?? sessionBody(),
    state: initial.state ?? sessionStateBody(),
    events: initial.events ?? [liveEventBody()],
    alerts: initial.alerts ?? [alertBody()],
  };
  const page0 = <T>(items: T[]) => ({
    items,
    page: { page: 0, size: 100, totalElements: items.length, totalPages: 1 },
  });

  await page.route(`${STREAM_API}/sessions/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const archived = state.session.status === "CLOSED" || state.session.status === "FAILED";
    if (path.endsWith("/playback")) {
      await route.fulfill({ json: playbackBody() });
      return;
    }
    if (path.endsWith("/alerts")) {
      await route.fulfill({ json: page0(state.alerts) });
      return;
    }
    if (path.endsWith("/state") || path.endsWith("/events")) {
      await route.fulfill(
        archived
          ? {
              status: 410,
              contentType: "application/problem+json",
              body: JSON.stringify({
                type: "about:blank",
                title: "Gone",
                status: 410,
                code: "STREAM_SESSION_ARCHIVED",
              }),
            }
          : { json: path.endsWith("/state") ? state.state : page0(state.events) },
      );
      return;
    }
    await route.fulfill({ json: state.session });
  });

  return state;
}
