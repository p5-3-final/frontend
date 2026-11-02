import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "../../../tests/server";
import { apiRequest, apiRequestNoContent } from "./client";
import { ApiError } from "./problem";
import { resetSessionForTest, startSession } from "./session";

const ME_URL = "http://localhost:8080/api/v1/auth/me";
const meSchema = z.object({ nickname: z.string() });

afterEach(() => {
  resetSessionForTest();
});

describe("apiRequest", () => {
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
});
