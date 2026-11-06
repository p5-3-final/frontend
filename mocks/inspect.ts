// SPEC-032 analysis-service 공개 API(오버레이·클릭 조회·트랙·질문·구역) 픽스처와 MSW 핸들러.
// 응답은 계약 예시를 생성 타입으로 옮긴 것이다. 계약이 바뀌면 생성 타입이 바뀌어 여기서 typecheck가 실패한다.
import { http, HttpResponse } from "msw";
import { z } from "zod";
import type { components } from "../src/api/generated/analysis-service";
import { problem } from "./handlers";

type Schemas = components["schemas"];
// 계약이 `attributes`·`answer`를 `type: object`로만 둬 생성 타입이 `Record<string, never>`라 열린 객체로 바꾼다.
export type TrackBody = Omit<Schemas["TrackAttributes"], "attributes"> & {
  attributes: Record<string, unknown> | null;
};
export type InspectResultBody = Omit<Schemas["InspectResult"], "track"> & {
  track: TrackBody | null;
};
export type QuestionResultBody = Omit<Schemas["QuestionResult"], "answer"> & {
  answer: Record<string, unknown> | null;
};
export type ZoneDefinitionBody = Schemas["ZoneDefinition"];
export type ZoneListBody = Schemas["ZoneList"];
export type OverlayTrackBody = Schemas["OverlayTrack"];

const ANALYSIS_API = "http://localhost:8080/api/v1/analysis";
const SOURCE_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
export const INSPECT_TRACK_ID = "0192f200-0000-5000-8000-000000000001";
export const INSPECT_REQUEST_ID = "0192f210-0000-7000-8000-000000000001";
export const QUESTION_REQUEST_ID = "0192f210-0000-7000-8000-000000000002";
export const INSPECT_ZONE_ID = "0192f100-0000-7000-8000-0000000000f1";

/** 계약 getSourceOverlay 예시. 구간은 요청한 값을 그대로 쓴다. */
export function overlayBody(
  tracks: OverlayTrackBody[] = [overlayTrackBody()],
  fromMs = 40000,
  toMs = 50000,
): Schemas["Overlay"] {
  return { sourceId: SOURCE_ID, fromMs, toMs, tracks };
}

export function overlayTrackBody(overrides: Partial<OverlayTrackBody> = {}): OverlayTrackBody {
  return {
    trackId: INSPECT_TRACK_ID,
    className: "person",
    hasEvent: true,
    boxes: [{ ptsMs: 40000, box: { x: 0.41, y: 0.22, w: 0.08, h: 0.31 } }],
    ...overrides,
  };
}

/** 계약 events/_track-attribute.schema.json 예시 */
export function trackAttributeBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    verificationStatus: "confirmed",
    helmet: "not_worn",
    vest: "worn",
    role: "worker",
    equipment: [],
    description: "주황색 안전조끼를 입고 안전모를 쓰지 않은 작업자",
    ...overrides,
  };
}

/** 계약 getTrack 예시(READY) */
export function trackBody(overrides: Partial<TrackBody> = {}): TrackBody {
  return {
    trackId: INSPECT_TRACK_ID,
    className: "person",
    startMs: 40000,
    endMs: 125000,
    attributeStatus: "READY",
    attributes: trackAttributeBody(),
    requestId: INSPECT_REQUEST_ID,
    ...overrides,
  };
}

/** 계약 inspectPoint 예시(속성 분석 요청됨) */
export function inspectResultBody(overrides: Partial<InspectResultBody> = {}): InspectResultBody {
  return {
    tMs: 41000,
    x: 0.44,
    y: 0.3,
    hit: true,
    box: { x: 0.41, y: 0.22, w: 0.08, h: 0.31 },
    track: trackBody({ attributeStatus: "REQUESTED", attributes: null }),
    ...overrides,
  };
}

export function missInspectBody(): InspectResultBody {
  return inspectResultBody({ hit: false, box: null, track: null });
}

export function askAcceptedBody(requestId = QUESTION_REQUEST_ID): Schemas["AskAccepted"] {
  return { requestId, status: "REQUESTED" };
}

/** 계약 getTrackQuestion 예시 */
export function questionResultBody(
  overrides: Partial<QuestionResultBody> = {},
): QuestionResultBody {
  return {
    requestId: QUESTION_REQUEST_ID,
    trackId: INSPECT_TRACK_ID,
    question: "이 사람이 들고 있는 것은 무엇인가요?",
    status: "READY",
    answer: {
      verificationStatus: "confirmed",
      answerable: true,
      answer: "철근 묶음을 들고 있습니다.",
    },
    askedAt: "2026-11-06T11:00:00Z",
    ...overrides,
  };
}

export function zoneBody(overrides: Partial<ZoneDefinitionBody> = {}): ZoneDefinitionBody {
  return {
    zoneId: INSPECT_ZONE_ID,
    name: "A동 크레인 하부",
    kind: "hazard",
    polygon: [
      { x: 0.1, y: 0.5 },
      { x: 0.4, y: 0.5 },
      { x: 0.4, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ],
    ...overrides,
  };
}

/** 계약 getSourceZones 예시 */
export function zoneListBody(
  items: ZoneDefinitionBody[] = [zoneBody()],
  reanalysisNeeded = false,
): ZoneListBody {
  return { sourceId: SOURCE_ID, items, updatedAt: "2026-11-06T09:00:00Z", reanalysisNeeded };
}

const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
const putZonesSchema = z.object({
  items: z
    .array(
      z.object({
        zoneId: z.string().nullable(),
        name: z.string().min(1).max(100),
        kind: z.enum(["hazard", "aisle", "general"]),
        polygon: z.array(pointSchema).min(3).max(32),
      }),
    )
    .max(20),
}) satisfies z.ZodType<Schemas["PutZonesRequest"]>;

export interface InspectFixture {
  /** 오버레이 구간마다 돌려줄 트랙. 기본은 계약 예시 트랙(40초)이다. */
  overlayTracks?: (fromMs: number, toMs: number) => OverlayTrackBody[];
  inspect?: InspectResultBody;
  track?: TrackBody;
  question?: QuestionResultBody;
  zones?: ZoneDefinitionBody[];
  reanalysisNeeded?: boolean;
}

/**
 * 영상 하나의 SPEC-032 API. 구역 저장(putSourceZones)은 받은 목록에 ID를 붙여 다음 조회에도 보이게 한다.
 * 일부만 바꾸려면 `server.use(바꿀 핸들러, ...inspectHandlers())`처럼 앞에 둔다.
 */
export function inspectHandlers(fixture: InspectFixture = {}) {
  let zones = zoneListBody(fixture.zones, fixture.reanalysisNeeded ?? false);
  let nextZone = 0;
  return [
    http.get(`${ANALYSIS_API}/sources/:sourceId/overlay`, ({ request }) => {
      const url = new URL(request.url);
      const fromMs = Number(url.searchParams.get("fromMs"));
      const toMs = Number(url.searchParams.get("toMs"));
      const tracks =
        fixture.overlayTracks?.(fromMs, toMs) ??
        (fromMs <= 40000 && 40000 < toMs ? [overlayTrackBody()] : []);
      return HttpResponse.json(overlayBody(tracks, fromMs, toMs));
    }),
    http.get(`${ANALYSIS_API}/sources/:sourceId/inspect`, ({ request }) => {
      const url = new URL(request.url);
      const body = fixture.inspect ?? inspectResultBody();
      return HttpResponse.json({
        ...body,
        tMs: Number(url.searchParams.get("tMs")),
        x: Number(url.searchParams.get("x")),
        y: Number(url.searchParams.get("y")),
      });
    }),
    http.get(`${ANALYSIS_API}/tracks/:trackId`, () =>
      HttpResponse.json(fixture.track ?? trackBody()),
    ),
    http.post(`${ANALYSIS_API}/tracks/:trackId/ask`, () =>
      HttpResponse.json(askAcceptedBody(), { status: 202 }),
    ),
    http.get(`${ANALYSIS_API}/tracks/:trackId/questions/:requestId`, ({ params }) =>
      HttpResponse.json({
        ...(fixture.question ?? questionResultBody()),
        requestId: String(params.requestId),
      }),
    ),
    http.get(`${ANALYSIS_API}/sources/:sourceId/zones`, () => HttpResponse.json(zones)),
    http.put(`${ANALYSIS_API}/sources/:sourceId/zones`, async ({ request }) => {
      const body = putZonesSchema.safeParse(await request.json());
      if (!body.success) {
        return problem(400, "ANALYSIS_ZONE_INVALID");
      }
      const items = body.data.items.map((item) => {
        if (item.zoneId !== null) {
          return item;
        }
        nextZone++;
        return { ...item, zoneId: `0192f100-0000-7000-8000-${String(nextZone).padStart(12, "0")}` };
      });
      zones = { ...zones, items, updatedAt: "2026-11-06T12:00:00Z", reanalysisNeeded: true };
      return HttpResponse.json(zones);
    }),
  ];
}
