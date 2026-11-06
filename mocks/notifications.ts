// SPEC-031 알림 연결(SSE 티켓 + notification-service 스트림) MSW 핸들러.
// 테스트가 연결마다 메시지를 밀어 넣거나 스트림을 닫을 수 있게 ReadableStream으로 응답한다.
import { http, HttpResponse } from "msw";

export const SSE_TICKET_API = "http://localhost:8080/api/v1/auth/sse-tickets";
export const NOTIFY_STREAM_API = "http://localhost:8080/api/v1/notify/stream";

/** 알림 메시지(SSE data) 한 건. 형식은 notifications/v1/notification-message.schema.json이다. */
export interface NotificationBody {
  type: string;
  sourceId: string | null;
  occurredAt: string;
  data: Record<string, unknown>;
}

export interface StreamConnection {
  ticket: string | null;
  lastEventId: string | null;
  authorization: string | null;
  /** 이 연결에 SSE 이벤트 하나를 보낸다. */
  send: (message: NotificationBody, id?: string) => void;
  /** 원문 그대로 보낸다(조각난 청크, 주석 줄 확인용). */
  sendRaw: (text: string) => void;
  /** 서버가 연결을 끊는다. */
  close: () => void;
}

export interface SseServer {
  handlers: ReturnType<typeof http.get>[];
  ticketRequests: { authorization: string | null }[];
  connections: StreamConnection[];
  /** 티켓 발급 응답을 바꾼다. 예: `() => new HttpResponse(null, { status: 503 })` */
  failTicketWith: (response: (() => Response) | null) => void;
}

/** 알림 메시지 본문. 필요한 값만 바꿔 쓴다. */
export function jobStatusBody(
  sourceId: string,
  data: Partial<{ progressPercent: number; status: string; terminal: boolean }> = {},
): NotificationBody {
  return {
    type: "job.status",
    sourceId,
    occurredAt: "2026-11-06T10:00:00Z",
    data: {
      jobId: "0192f0d5-0000-7000-8000-000000000001",
      status: "RUNNING",
      progressPercent: 40,
      successPercent: 100,
      terminal: false,
      ...data,
    },
  };
}

export function sourceCompletedBody(sourceId: string): NotificationBody {
  return {
    type: "source.completed",
    sourceId,
    occurredAt: "2026-11-06T10:05:00Z",
    data: {
      jobId: "0192f0d5-0000-7000-8000-000000000001",
      summaryStatus: "generated",
      confirmedEvents: 2,
      activeRisksAtEnd: 1,
    },
  };
}

export function pingBody(): NotificationBody {
  return { type: "ping", sourceId: null, occurredAt: "2026-11-06T10:00:15Z", data: {} };
}

/** 티켓 발급과 스트림 연결을 기록하는 가짜 서버. 티켓 값은 발급 순서대로 `ticket-1`, `ticket-2`, … 이다. */
export function sseServer(): SseServer {
  const ticketRequests: SseServer["ticketRequests"] = [];
  const connections: StreamConnection[] = [];
  let ticketFailure: (() => Response) | null = null;
  const encoder = new TextEncoder();
  const handlers = [
    http.post(SSE_TICKET_API, ({ request }) => {
      ticketRequests.push({ authorization: request.headers.get("Authorization") });
      if (ticketFailure !== null) {
        return ticketFailure();
      }
      return HttpResponse.json(
        { ticket: `ticket-${String(ticketRequests.length)}`, expiresIn: 30 },
        { status: 201 },
      );
    }),
    http.get(NOTIFY_STREAM_API, ({ request }) => {
      let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
      let closed = false;
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          controller = c;
          // MSW는 첫 조각이 나올 때까지 fetch 응답을 넘기지 않는다. 실제 서버가 헤더를 먼저 보내는 것과 맞추려고 주석 줄을 먼저 보낸다.
          c.enqueue(encoder.encode(": connected\n\n"));
        },
        cancel() {
          closed = true;
        },
      });
      const write = (text: string) => {
        if (!closed) {
          controller?.enqueue(encoder.encode(text));
        }
      };
      connections.push({
        ticket: new URL(request.url).searchParams.get("ticket"),
        lastEventId: request.headers.get("Last-Event-ID"),
        authorization: request.headers.get("Authorization"),
        send: (message, id) => {
          const idLine = id === undefined ? "" : `id: ${id}\n`;
          write(`${idLine}event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`);
        },
        sendRaw: write,
        close: () => {
          if (!closed) {
            closed = true;
            controller?.close();
          }
        },
      });
      return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } });
    }),
  ];
  return {
    handlers,
    ticketRequests,
    connections,
    failTicketWith: (response) => {
      ticketFailure = response;
    },
  };
}
