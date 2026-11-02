import { http, HttpResponse } from "msw";
import type { components } from "../src/api/generated/auth-service";

type User = components["schemas"]["UserResponse"];
type TokenResponse = components["schemas"]["TokenResponse"];
type ProblemDetail = components["schemas"]["ProblemDetail"];

export const API = "http://localhost:8080/api/v1/auth";

export const TEST_USER: User = {
  id: "27e8fd1d-d3ae-42f2-bb55-ff6f9c8661dc",
  email: "user@example.com",
  nickname: "테스터",
  roles: ["USER"],
};

export function tokenBody(accessToken = "access-1"): TokenResponse {
  return { accessToken, tokenType: "Bearer", expiresIn: 900 };
}

/** 계약 _common.yaml ProblemDetail 형식의 오류 응답 */
export function problem(status: number, code: string) {
  const body: ProblemDetail = { type: "about:blank", title: "Error", status, code };
  return HttpResponse.json(body, { status });
}

export const handlers = {
  me: (user: User = TEST_USER) => http.get(`${API}/me`, () => HttpResponse.json(user)),
  logIn: (accessToken = "access-1") =>
    http.post(`${API}/login`, () => HttpResponse.json(tokenBody(accessToken))),
  logInFails: (status: number, code: string) =>
    http.post(`${API}/login`, () => problem(status, code)),
  refresh: (accessToken = "access-1") =>
    http.post(`${API}/refresh`, () => HttpResponse.json(tokenBody(accessToken))),
  refreshFails: () => http.post(`${API}/refresh`, () => problem(401, "AUTH_REFRESH_INVALID")),
  logOut: () => http.post(`${API}/logout`, () => new HttpResponse(null, { status: 204 })),
};
