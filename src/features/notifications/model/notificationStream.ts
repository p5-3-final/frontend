import { API_BASE_URL } from "../../../shared/api/config";
import { getSessionStatus, subscribeSession } from "../../../shared/api/session";
import { issueSseTicket } from "../api/sseTicket";
import { createSseParser, type SseMessage } from "./parseSse";
import { notificationMessageSchema, type NotificationMessage } from "./schemas";

/**
 * 탭에 하나뿐인 알림 연결(SPEC-031 R-12, NFR-2). 로그인 세션을 구독해 로그인하면 연결하고,
 * 화면은 {@link subscribeNotifications}로 메시지만 받는다. 연결 상태와 버퍼는 이 모듈 메모리에만 둔다.
 */
export type ConnectionStatus = "idle" | "connecting" | "open" | "reconnecting";

const STREAM_PATH = "/api/v1/notify/stream";
// SPEC-032·033: HTTP 응답보다 알림이 먼저 오는 경우(클릭 조회 응답 전에 track.analyzed)를 놓치지 않게 최근 메시지를 둔다.
const BUFFER_LIMIT = 100;
const BUFFER_TTL_MS = 60_000;

type Listener = (message: NotificationMessage) => void;

let started = false;
let status: ConnectionStatus = "idle";
let lastEventId: string | undefined;
let abort: AbortController | null = null;
const listeners = new Set<Listener>();
let buffer: { receivedAt: number; message: NotificationMessage }[] = [];
const statusListeners = new Set<() => void>();

function setStatus(next: ConnectionStatus) {
  if (status === next) {
    return;
  }
  status = next;
  for (const listener of statusListeners) {
    listener();
  }
}

function handleSse(message: SseMessage) {
  lastEventId = message.id ?? lastEventId;
  let json: unknown;
  try {
    json = JSON.parse(message.data);
  } catch {
    return;
  }
  // 형식이 틀린 메시지는 화면이 잘못 해석하지 않게 버린다(생산자 확인 전 계약).
  const parsed = notificationMessageSchema.safeParse(json);
  if (!parsed.success || parsed.data.type === "ping") {
    return;
  }
  const now = Date.now();
  buffer = [
    ...buffer.filter((item) => now - item.receivedAt < BUFFER_TTL_MS),
    { receivedAt: now, message: parsed.data },
  ].slice(-BUFFER_LIMIT);
  for (const listener of listeners) {
    listener(parsed.data);
  }
}

async function readStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(handleSse);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    parser.push(decoder.decode(value, { stream: true }));
  }
}

async function connect() {
  const controller = new AbortController();
  abort = controller;
  setStatus("connecting");
  try {
    const ticket = await issueSseTicket(controller.signal);
    const headers = new Headers({ Accept: "text/event-stream" });
    if (lastEventId !== undefined) {
      headers.set("Last-Event-ID", lastEventId);
    }
    const url = `${API_BASE_URL}${STREAM_PATH}?${new URLSearchParams({ ticket }).toString()}`;
    const response = await fetch(url, { headers, signal: controller.signal, cache: "no-store" });
    if (response.ok && response.body !== null) {
      setStatus("open");
      await readStream(response.body);
    }
  } catch {
    // 끊김은 아래에서 상태로만 처리한다.
  }
  if (abort === controller) {
    abort = null;
    setStatus("idle");
  }
}

function handleSessionChange() {
  if (getSessionStatus() === "authenticated" && abort === null) {
    void connect();
  }
}

/** 알림 연결을 시작한다. 여러 번 불러도 연결은 하나다. 로그인 세션을 따라 연결하고 끊는다. */
export function startNotifications(): void {
  if (started) {
    return;
  }
  started = true;
  subscribeSession(handleSessionChange);
  handleSessionChange();
}

export interface SubscribeOptions {
  /** 구독 전에 받아 둔 최근 메시지(60초 안, 최대 100건)를 먼저 넘긴다. */
  replayBuffered?: boolean;
}

/** 알림 메시지를 받는다. 반환한 함수로 구독을 끝낸다. 구독을 끝내도 연결은 유지된다(R-12). */
export function subscribeNotifications(
  listener: Listener,
  options: SubscribeOptions = {},
): () => void {
  if (options.replayBuffered === true) {
    const now = Date.now();
    for (const item of buffer) {
      if (now - item.receivedAt < BUFFER_TTL_MS) {
        listener(item.message);
      }
    }
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConnectionStatus(): ConnectionStatus {
  return status;
}

export function subscribeConnectionStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** 테스트에서 연결을 끊고 모듈 상태를 처음으로 되돌린다. */
export function resetNotificationsForTest(): void {
  abort?.abort();
  abort = null;
  started = false;
  status = "idle";
  lastEventId = undefined;
  buffer = [];
  listeners.clear();
  statusListeners.clear();
}
