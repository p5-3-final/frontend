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

/** 테스트용 저장소(SeaweedFS·S3) 주소 */
export const STORAGE = "http://localhost:8333/vlm-media";

// 실제 저장소처럼 교차 출처 업로드를 허용하고 ETag를 노출한다. jsdom의 XMLHttpRequest는 CORS를 지킨다.
export const STORAGE_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "ETag",
};

/** 저장소의 CORS 사전 요청(OPTIONS) 응답 */
export const storagePreflight = () =>
  http.options(`${STORAGE}/*`, () => new HttpResponse(null, { headers: STORAGE_CORS_HEADERS }));

/** CORS 헤더를 붙인 저장소 응답 */
export function storageResponse(status: number, headers: Record<string, string> = {}) {
  return new HttpResponse(null, { status, headers: { ...STORAGE_CORS_HEADERS, ...headers } });
}
