import type { Page, Route } from "@playwright/test";
import { z } from "zod";
import { zoneDefinitionSchema } from "../../src/features/analysis/model/inspectSchemas";
import {
  askAcceptedBody,
  inspectResultBody,
  overlayBody,
  overlayTrackBody,
  questionResultBody,
  trackBody,
  zoneListBody,
  type InspectResultBody,
  type OverlayTrackBody,
  type ZoneListBody,
} from "../../mocks/inspect";

const ANALYSIS = "http://localhost:8080/api/v1/analysis";
const putSchema = z.object({ items: z.array(zoneDefinitionSchema) });

export interface FakeInspectState {
  inspect: InspectResultBody;
  /** 오버레이 구간마다 돌려줄 트랙 */
  overlayTracks: (fromMs: number, toMs: number) => OverlayTrackBody[];
  zones: ZoneListBody;
  /** 클릭 조회 응답을 보내기 직전에 부른다(응답 시각 측정용). */
  beforeInspect?: () => Promise<void>;
}

/**
 * E2E용 SPEC-032 API(오버레이·클릭 조회·트랙·질문·구역). `useFakeAnalysis` 뒤에 부르면 이 경로들은 여기서 답한다
 * (Playwright는 나중에 등록한 route를 먼저 쓴다). 트랙은 처음엔 속성 분석 중이고, 알림 뒤 조회하면 READY다.
 */
export async function useFakeInspect(page: Page, initial: Partial<FakeInspectState> = {}) {
  const state: FakeInspectState = {
    inspect: initial.inspect ?? inspectResultBody(),
    overlayTracks:
      initial.overlayTracks ??
      ((fromMs, toMs) => (fromMs <= 40000 && 40000 < toMs ? [overlayTrackBody()] : [])),
    zones: initial.zones ?? zoneListBody(),
    beforeInspect: initial.beforeInspect,
  };
  let created = 0;

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  await page.route(`${ANALYSIS}/sources/*/overlay**`, async (route) => {
    const url = new URL(route.request().url());
    const fromMs = Number(url.searchParams.get("fromMs"));
    const toMs = Number(url.searchParams.get("toMs"));
    await json(route, overlayBody(state.overlayTracks(fromMs, toMs), fromMs, toMs));
  });
  await page.route(`${ANALYSIS}/sources/*/inspect**`, async (route) => {
    const url = new URL(route.request().url());
    await state.beforeInspect?.();
    await json(route, {
      ...state.inspect,
      tMs: Number(url.searchParams.get("tMs")),
      x: Number(url.searchParams.get("x")),
      y: Number(url.searchParams.get("y")),
    });
  });
  await page.route(`${ANALYSIS}/tracks/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/ask")) {
      await json(route, askAcceptedBody(), 202);
      return;
    }
    if (path.includes("/questions/")) {
      await json(route, questionResultBody());
      return;
    }
    await json(route, trackBody());
  });
  await page.route(`${ANALYSIS}/sources/*/zones`, async (route) => {
    const request = route.request();
    if (request.method() !== "PUT") {
      await json(route, state.zones);
      return;
    }
    const body = putSchema.parse(request.postDataJSON());
    const items = body.items.map((item) => {
      if (item.zoneId !== null) {
        return item;
      }
      created++;
      return { ...item, zoneId: `0192f100-0000-7000-8000-${String(created).padStart(12, "0")}` };
    });
    state.zones = {
      ...state.zones,
      items,
      updatedAt: "2026-11-06T12:00:00Z",
      reanalysisNeeded: true,
    };
    await json(route, state.zones);
  });
  return state;
}
