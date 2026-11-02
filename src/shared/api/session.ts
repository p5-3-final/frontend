import { z } from "zod";
import { API_BASE_URL } from "./config";

/**
 * 로그인 세션. ADR-0004에 따라 접근 토큰은 이 모듈의 메모리에만 두고, 재발급 토큰은 서버가 준
 * HttpOnly 쿠키를 그대로 쓴다. React는 {@link subscribeSession}으로 상태 변화를 구독한다.
 */
export type SessionStatus = "checking" | "authenticated" | "anonymous";

const REFRESH_PATH = "/api/v1/auth/refresh";

// 계약 auth-service.yaml TokenResponse
const tokenResponseSchema = z.object({ accessToken: z.string() });

let accessToken: string | undefined;
let status: SessionStatus = "checking";
let refreshing: Promise<boolean> | undefined;
const listeners = new Set<() => void>();

function update(nextToken: string | undefined, nextStatus: SessionStatus) {
  accessToken = nextToken;
  status = nextStatus;
  listeners.forEach((listener) => {
    listener();
  });
}

export function getAccessToken(): string | undefined {
  return accessToken;
}

export function getSessionStatus(): SessionStatus {
  return status;
}

/** 상태가 바뀔 때마다 listener를 부른다. 반환한 함수로 구독을 끝낸다. */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 로그인·재발급으로 받은 접근 토큰으로 세션을 시작한다. */
export function startSession(token: string): void {
  update(token, "authenticated");
}

/** 메모리의 접근 토큰을 지우고 로그아웃 상태로 바꾼다. */
export function endSession(): void {
  update(undefined, "anonymous");
}

/**
 * 재발급 쿠키로 새 접근 토큰을 받는다. 성공하면 true다.
 *
 * 재발급 토큰은 쓸 때마다 바뀌어서, 같은 토큰으로 두 번 요청하면 서버가 재사용으로 보고 로그인 계열 전체를 끊는다
 * (SPEC-001 R-23). 그래서 진행 중인 요청이 있으면 새로 보내지 않고 그 결과를 같이 쓴다.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= requestRefresh().finally(() => {
    refreshing = undefined;
  });
  return refreshing;
}

async function requestRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
    });
    const body = tokenResponseSchema.safeParse(response.ok ? await response.json() : undefined);
    if (!body.success) {
      endSession();
      return false;
    }
    startSession(body.data.accessToken);
    return true;
  } catch {
    // 네트워크 오류도 재발급 실패로 본다. 로그인 화면에서 다시 시작하게 한다.
    endSession();
    return false;
  }
}

/** 테스트에서 모듈 상태를 처음으로 되돌린다. */
export function resetSessionForTest(): void {
  accessToken = undefined;
  status = "checking";
  refreshing = undefined;
  listeners.clear();
}
