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
// SPEC-031 R-13: 1초부터 두 배씩, 최대 30초
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
// 서버가 15초마다 ping을 보낸다(notification-service.yaml). 세 번 연속 못 받으면 끊긴 것으로 본다.
const IDLE_TIMEOUT_MS = 45_000;

type Listener = (message: NotificationMessage) => void;

let started = false;
let status: ConnectionStatus = "idle";
let lastEventId: string | undefined;
let abort: AbortController | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let attempt = 0;
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

function watchIdle(reader: ReadableStreamDefaultReader<Uint8Array>) {
  clearTimeout(idleTimer);
  // 본문 읽기를 끝내면 아래 read()가 done을 돌려주고 끊김과 같게 다시 연결한다.
  idleTimer = setTimeout(() => {
    reader.cancel().catch(() => undefined);
  }, IDLE_TIMEOUT_MS);
}

async function readStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(handleSse);
  watchIdle(reader);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    // 무엇이든 받았으면 연결이 살아 있다. 다음 끊김의 대기는 다시 1초부터다.
    attempt = 0;
    watchIdle(reader);
    parser.push(decoder.decode(value, { stream: true }));
  }
}

function scheduleReconnect() {
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
  attempt++;
  setStatus("reconnecting");
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    void connect();
  }, delay);
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
    // 티켓 발급 실패, 네트워크 오류, 무응답으로 끊은 경우 모두 아래에서 다시 연결한다.
  }
  clearTimeout(idleTimer);
  // 로그아웃으로 닫았으면 abort가 이미 바뀌었다. 그때는 다시 연결하지 않는다(R-14).
  if (abort !== controller) {
    return;
  }
  abort = null;
  // 티켓 재발급까지 실패해 세션이 끝났으면 다시 연결하지 않는다.
  if (getSessionStatus() !== "authenticated") {
    setStatus("idle");
    return;
  }
  scheduleReconnect();
}

/** 연결과 대기를 모두 끝내고 이어 받기 정보를 버린다. 다른 사용자가 같은 탭에서 로그인할 수 있다(R-14). */
function close() {
  const current = abort;
  abort = null;
  current?.abort();
  clearTimeout(reconnectTimer);
  clearTimeout(idleTimer);
  reconnectTimer = undefined;
  attempt = 0;
  lastEventId = undefined;
  buffer = [];
  setStatus("idle");
}

function handleSessionChange() {
  if (getSessionStatus() === "anonymous") {
    close();
    return;
  }
  if (getSessionStatus() === "authenticated" && abort === null && reconnectTimer === undefined) {
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
  close();
  started = false;
  listeners.clear();
  statusListeners.clear();
}
