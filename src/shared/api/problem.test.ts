import { describe, expect, it } from "vitest";
import { toApiError } from "./problem";

function problemResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

describe("toApiError", () => {
  it("[SPEC-002 NFR-3] ProblemDetail의 상태, code, 필드 오류, 추적 ID를 담는다", async () => {
    const error = await toApiError(
      problemResponse(400, {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        code: "AUTH_INVALID_REQUEST",
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        errors: [{ field: "email", message: "올바른 형식의 이메일 주소여야 합니다" }],
      }),
    );

    expect(error.status).toBe(400);
    expect(error.code).toBe("AUTH_INVALID_REQUEST");
    expect(error.fieldErrors).toEqual([
      { field: "email", message: "올바른 형식의 이메일 주소여야 합니다" },
    ]);
    expect(error.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("[SPEC-002 NFR-3] ProblemDetail이 아닌 본문이면 code 없이 상태만 담는다", async () => {
    const error = await toApiError(
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }),
    );

    expect(error.status).toBe(502);
    expect(error.code).toBeUndefined();
    expect(error.fieldErrors).toEqual([]);
  });
});
