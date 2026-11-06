import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "../../../tests/server";
import { apiRequest, apiRequestNoContent } from "./client";
import { ApiError } from "./problem";
import { getAccessToken, getSessionStatus, resetSessionForTest, startSession } from "./session";

const ME_URL = "http://localhost:8080/api/v1/auth/me";
const REFRESH_URL = "http://localhost:8080/api/v1/auth/refresh";
const meSchema = z.object({ nickname: z.string() });

afterEach(() => {
  resetSessionForTest();
});

describe("apiRequest", () => {
  it("[SPEC-031 R-3] query 값을 쿼리 문자열로 붙이고 undefined 값은 뺀다", async () => {
    let search = "";
    server.use(
      http.get(ME_URL, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ nickname: "테스터" });
      }),
    );

    await apiRequest("/api/v1/auth/me", meSchema, {
      query: { severity: "high", page: 0, includeMerged: false, eventType: undefined },
    });

    expect(search).toBe("?severity=high&page=0&includeMerged=false");
  });

  it("[SPEC-033 R-8] FormData 본문은 JSON으로 바꾸지 않고 Content-Type을 브라우저에 맡긴다", async () => {
    let contentType: string | null = null;
    let sourceId: FormDataEntryValue | null = null;
    server.use(
      http.post(ME_URL, async ({ request }) => {
        contentType = request.headers.get("Content-Type");
        sourceId = (await request.formData()).get("sourceId");
        return HttpResponse.json({ nickname: "테스터" });
      }),
    );
    const body = new FormData();
    body.set("sourceId", "s-1");

    await apiRequest("/api/v1/auth/me", meSchema, { method: "POST", body });

    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(sourceId).toBe("s-1");
  });

  it("로그인 상태면 접근 토큰을 Authorization 헤더로 보낸다", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(ME_URL, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({ nickname: "테스터" });
      }),
    );
    startSession("access-1");

    await expect(apiRequest("/api/v1/auth/me", meSchema)).resolves.toEqual({ nickname: "테스터" });
    expect(authorization).toBe("Bearer access-1");
  });

  it("로그인 전이면 Authorization 헤더를 보내지 않는다", async () => {
    let authorization: string | null = "unset";
    server.use(
      http.get(ME_URL, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({ nickname: "테스터" });
      }),
    );

    await apiRequest("/api/v1/auth/me", meSchema);

    expect(authorization).toBeNull();
  });

  it("본문을 JSON으로 보낸다", async () => {
    let received: unknown;
    server.use(
      http.post("http://localhost:8080/api/v1/auth/login", async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await apiRequestNoContent("/api/v1/auth/login", {
      method: "POST",
      body: { email: "user@example.com" },
    });

    expect(received).toEqual({ email: "user@example.com" });
  });

  it("[SPEC-002 NFR-3] 실패 응답이면 ProblemDetail의 code를 담은 ApiError를 던진다", async () => {
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Unauthorized", status: 401, code: "AUTH_TOKEN_MISSING" },
          { status: 401 },
        ),
      ),
    );

    const error: unknown = await apiRequest("/api/v1/auth/me", meSchema).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "AUTH_TOKEN_MISSING" });
  });

  it("응답 본문이 기대한 형식이 아니면 오류를 던진다", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json({ unexpected: true })));

    await expect(apiRequest("/api/v1/auth/me", meSchema)).rejects.toThrow();
  });

  it("[SPEC-002 R-9] 접근 토큰이 만료되면 재발급받고 같은 요청을 새 토큰으로 한 번 다시 보낸다", async () => {
    const authorizations: (string | null)[] = [];
    server.use(
      http.get(ME_URL, ({ request }) => {
        authorizations.push(request.headers.get("Authorization"));
        return authorizations.length === 1
          ? HttpResponse.json(
              {
                type: "about:blank",
                title: "Unauthorized",
                status: 401,
                code: "AUTH_TOKEN_EXPIRED",
              },
              { status: 401 },
            )
          : HttpResponse.json({ nickname: "테스터" });
      }),
      http.post(REFRESH_URL, () =>
        HttpResponse.json({ accessToken: "access-2", tokenType: "Bearer", expiresIn: 900 }),
      ),
    );
    startSession("access-1");

    await expect(apiRequest("/api/v1/auth/me", meSchema)).resolves.toEqual({ nickname: "테스터" });
    expect(authorizations).toEqual(["Bearer access-1", "Bearer access-2"]);
  });

  it("[SPEC-002 R-9] 다시 보낸 요청도 만료로 거절되면 더 반복하지 않고 오류를 던진다", async () => {
    let calls = 0;
    server.use(
      http.get(ME_URL, () => {
        calls += 1;
        return HttpResponse.json(
          { type: "about:blank", title: "Unauthorized", status: 401, code: "AUTH_TOKEN_EXPIRED" },
          { status: 401 },
        );
      }),
      http.post(REFRESH_URL, () =>
        HttpResponse.json({ accessToken: "access-2", tokenType: "Bearer", expiresIn: 900 }),
      ),
    );
    startSession("access-1");

    await expect(apiRequest("/api/v1/auth/me", meSchema)).rejects.toBeInstanceOf(ApiError);
    expect(calls).toBe(2);
  });

  it("[SPEC-002 R-10] 재발급도 실패하면 로그아웃 상태로 바꾸고 오류를 던진다", async () => {
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Unauthorized", status: 401, code: "AUTH_TOKEN_EXPIRED" },
          { status: 401 },
        ),
      ),
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Unauthorized", status: 401, code: "AUTH_REFRESH_INVALID" },
          { status: 401 },
        ),
      ),
    );
    startSession("access-1");

    await expect(apiRequest("/api/v1/auth/me", meSchema)).rejects.toBeInstanceOf(ApiError);
    expect(getSessionStatus()).toBe("anonymous");
    expect(getAccessToken()).toBeUndefined();
  });
});
