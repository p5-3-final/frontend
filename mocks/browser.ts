// 개발용 mock 모드(VITE_API_MOCKING=true, plan 4절 "개발용 mock 모드", D-25).
// analysis·notification·stream은 다른 담당자 서비스라 아직 없으므로, 단위 테스트와 같은 계약 예시 핸들러로 응답한다.
// auth·media는 실제 서비스(api-gateway)로 보낸다(onUnhandledFrame: "bypass").
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import {
  ANALYSIS_API,
  analysisHandlers,
  notAnalyzedSummaryBody,
  sourceSummaryBody,
} from "./analysis";
import { INSPECT_REQUEST_ID, INSPECT_TRACK_ID } from "./inspect";
import {
  jobStatusBody,
  NOTIFY_STREAM_API,
  SSE_TICKET_API,
  sourceCompletedBody,
  trackAnalyzedBody,
  type NotificationBody,
} from "./notifications";
import { cameraZoneHandlers } from "./cameraZones";
import { streamHandlers } from "./stream";

// 시연: 처음 연 영상은 분석 중으로 시작해 몇 초 뒤 완료 알림을 받고 결과가 그려진다(spec 7절 성공 지표).
const DEMO_STEP_MS = 1500;
const analyzed = new Set<string>();
let started = new Set<string>();
// SPEC-032 시연: 클릭 조회·질문을 받으면 다음 알림 주기에 track.analyzed를 보낸다.
let pendingTrackEvents: NotificationBody[] = [];
let lastInspectedSource = "";
let questionCount = 0;

function sse(type: string, id: number, body: unknown): string {
  return `id: ${String(id)}\nevent: ${type}\ndata: ${JSON.stringify(body)}\n\n`;
}

const demoHandlers = [
  // 응답은 뒤의 기본 핸들러가 준다. 여기서는 알림만 예약한다(아무것도 돌려주지 않으면 다음 핸들러로 넘어간다).
  http.get(`${ANALYSIS_API}/sources/:sourceId/inspect`, ({ params }) => {
    lastInspectedSource = String(params.sourceId);
    pendingTrackEvents = [
      ...pendingTrackEvents,
      trackAnalyzedBody(String(params.sourceId), {
        requestId: INSPECT_REQUEST_ID,
        trackId: INSPECT_TRACK_ID,
        reason: "click",
      }),
    ];
  }),
  // 질문마다 다른 requestId를 준다. 결과 조회는 기본 핸들러가 받은 requestId를 그대로 돌려준다.
  http.post(`${ANALYSIS_API}/tracks/:trackId/ask`, () => {
    questionCount++;
    const requestId = `0192f210-0000-7000-8000-${String(questionCount).padStart(12, "0")}`;
    pendingTrackEvents = [
      ...pendingTrackEvents,
      trackAnalyzedBody(lastInspectedSource, {
        requestId,
        trackId: INSPECT_TRACK_ID,
        reason: "question",
      }),
    ];
    return HttpResponse.json({ requestId, status: "REQUESTED" }, { status: 202 });
  }),
  http.get(`${ANALYSIS_API}/sources/:sourceId/summary`, ({ params }) => {
    const sourceId = String(params.sourceId);
    started = new Set([...started, sourceId]);
    return HttpResponse.json(
      analyzed.has(sourceId) ? sourceSummaryBody({ sourceId }) : notAnalyzedSummaryBody(sourceId),
    );
  }),
  http.post(SSE_TICKET_API, () =>
    HttpResponse.json({ ticket: "mock-ticket", expiresIn: 30 }, { status: 201 }),
  ),
  http.get(NOTIFY_STREAM_API, () => {
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setInterval> | undefined;
    let id = 0;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": connected\n\n"));
        const progress = new Map<string, number>();
        timer = setInterval(() => {
          for (const message of pendingTrackEvents) {
            id++;
            controller.enqueue(encoder.encode(sse(message.type, id, message)));
          }
          pendingTrackEvents = [];
          for (const sourceId of started) {
            if (analyzed.has(sourceId)) {
              continue;
            }
            const percent = Math.min(100, (progress.get(sourceId) ?? 0) + 25);
            progress.set(sourceId, percent);
            const done = percent >= 100;
            id++;
            controller.enqueue(
              encoder.encode(
                sse(
                  "job.status",
                  id,
                  jobStatusBody(sourceId, {
                    progressPercent: percent,
                    status: done ? "COMPLETED" : "RUNNING",
                    terminal: done,
                  }),
                ),
              ),
            );
            if (done) {
              analyzed.add(sourceId);
              id++;
              controller.enqueue(
                encoder.encode(sse("source.completed", id, sourceCompletedBody(sourceId))),
              );
            }
          }
        }, DEMO_STEP_MS);
      },
      cancel() {
        clearInterval(timer);
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream", "Transfer-Encoding": "chunked" },
    });
  }),
];

/** 앞에 둔 핸들러가 먼저 적용된다. 시연 핸들러가 기본 분석 응답보다 앞이다. */
export const worker = setupWorker(
  ...demoHandlers,
  ...analysisHandlers(),
  ...streamHandlers(),
  ...cameraZoneHandlers(),
);
