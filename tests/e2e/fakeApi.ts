import type { Page } from "@playwright/test";

const API = "http://localhost:8080/api/v1/auth";

interface FakeUser {
  email: string;
  password: string;
  nickname: string;
}

/**
 * E2E용 가짜 auth API. 가입한 사용자와 재발급 쿠키가 있는지만 기억한다.
 * 실제 backend와의 연결은 로컬 compose 시연으로 확인한다(plan 6절).
 */
export async function useFakeApi(page: Page, options: { loggedIn?: boolean } = {}) {
  const users = new Map<string, FakeUser>();
  let refreshCookie = options.loggedIn ?? false;
  const seeded: FakeUser = { email: "user@example.com", password: "secret123", nickname: "테스터" };
  users.set(seeded.email, seeded);
  let current: FakeUser | undefined = refreshCookie ? seeded : undefined;

  const token = { accessToken: "access", tokenType: "Bearer", expiresIn: 900 };
  const problem = (status: number, code: string) => ({
    status,
    contentType: "application/problem+json",
    body: JSON.stringify({ type: "about:blank", title: "Error", status, code }),
  });

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1/auth", "");
    const body: unknown = request.postData() === null ? undefined : request.postDataJSON();
    const input =
      typeof body === "object" && body !== null ? Object.fromEntries(Object.entries(body)) : {};
    const text = (key: string) => (typeof input[key] === "string" ? input[key] : "");

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204 });
      return;
    }
    if (path === "/signup") {
      const user = { email: text("email"), password: text("password"), nickname: text("nickname") };
      if (users.has(user.email)) {
        await route.fulfill(problem(409, "AUTH_EMAIL_DUPLICATED"));
        return;
      }
      users.set(user.email, user);
      await route.fulfill({
        status: 201,
        json: {
          id: "00000000-0000-4000-8000-000000000001",
          email: user.email,
          nickname: user.nickname,
          roles: ["USER"],
        },
      });
      return;
    }
    if (path === "/login") {
      const user = users.get(text("email"));
      if (user === undefined || user.password !== text("password")) {
        await route.fulfill(problem(401, "AUTH_INVALID_CREDENTIALS"));
        return;
      }
      current = user;
      refreshCookie = true;
      await route.fulfill({ json: token });
      return;
    }
    if (path === "/refresh") {
      await route.fulfill(refreshCookie ? { json: token } : problem(401, "AUTH_REFRESH_INVALID"));
      return;
    }
    if (path === "/me") {
      if (current === undefined || request.headers().authorization !== "Bearer access") {
        await route.fulfill(problem(401, "AUTH_TOKEN_MISSING"));
        return;
      }
      await route.fulfill({
        json: {
          id: "00000000-0000-4000-8000-000000000001",
          email: current.email,
          nickname: current.nickname,
          roles: ["USER"],
        },
      });
      return;
    }
    if (path === "/logout") {
      refreshCookie = false;
      current = undefined;
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill(problem(404, "GATEWAY_ROUTE_NOT_FOUND"));
  });
}
