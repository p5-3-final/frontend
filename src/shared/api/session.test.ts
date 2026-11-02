import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../tests/server";
import {
  endSession,
  getAccessToken,
  getSessionStatus,
  refreshSession,
  resetSessionForTest,
  startSession,
} from "./session";

const REFRESH_URL = "http://localhost:8080/api/v1/auth/refresh";

function tokenResponse(accessToken: string) {
  return HttpResponse.json({ accessToken, tokenType: "Bearer", expiresIn: 900 });
}

function storedValues(storage: Storage): string {
  return Array.from({ length: storage.length }, (_, i) => {
    const key = storage.key(i) ?? "";
    return `${key}=${storage.getItem(key) ?? ""}`;
  }).join(";");
}

afterEach(() => {
  vi.restoreAllMocks();
  resetSessionForTest();
  localStorage.clear();
  sessionStorage.clear();
});

describe("session", () => {
  it("[SPEC-002 R-8] 재발급에 성공하면 접근 토큰을 메모리에 두고 로그인 상태가 된다", async () => {
    server.use(http.post(REFRESH_URL, () => tokenResponse("access-1")));

    await expect(refreshSession()).resolves.toBe(true);

    expect(getAccessToken()).toBe("access-1");
    expect(getSessionStatus()).toBe("authenticated");
  });

  it("[SPEC-002 R-8] 재발급이 거절되면 로그아웃 상태가 된다", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Unauthorized", status: 401, code: "AUTH_REFRESH_INVALID" },
          { status: 401 },
        ),
      ),
    );

    await expect(refreshSession()).resolves.toBe(false);

    expect(getAccessToken()).toBeUndefined();
    expect(getSessionStatus()).toBe("anonymous");
  });

  it("[SPEC-002 R-8] 동시에 재발급을 요청해도 서버에는 한 번만 보낸다", async () => {
    let calls = 0;
    server.use(
      http.post(REFRESH_URL, () => {
        calls += 1;
        return tokenResponse("access-1");
      }),
    );

    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(results).toEqual([true, true, true]);
    expect(calls).toBe(1);
  });

  it("[SPEC-002 R-8] 재발급 요청은 재발급 쿠키를 함께 보낸다", async () => {
    server.use(http.post(REFRESH_URL, () => tokenResponse("access-1")));
    // Node의 fetch는 요청 객체에 credentials를 남기지 않아서, 브라우저에 넘기는 옵션으로 확인한다.
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await refreshSession();

    expect(fetchSpy).toHaveBeenCalledWith(
      REFRESH_URL,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("[SPEC-002 NFR-1] 로그인해도 토큰을 브라우저 저장소와 스크립트가 읽는 쿠키에 남기지 않는다", () => {
    startSession("access-secret");

    expect(getAccessToken()).toBe("access-secret");
    expect(storedValues(localStorage)).not.toContain("access-secret");
    expect(storedValues(sessionStorage)).not.toContain("access-secret");
    expect(document.cookie).not.toContain("access-secret");
  });

  it("[SPEC-002 R-12] 세션을 끝내면 토큰을 지우고 로그아웃 상태가 된다", () => {
    startSession("access-1");

    endSession();

    expect(getAccessToken()).toBeUndefined();
    expect(getSessionStatus()).toBe("anonymous");
  });
});
