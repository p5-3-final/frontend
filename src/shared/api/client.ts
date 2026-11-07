import type { z } from "zod";
import { API_BASE_URL } from "./config";
import { toApiError } from "./problem";
import { getAccessToken, refreshSession } from "./session";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON으로 보낼 값. `FormData`면 그대로 보낸다(multipart 경계 문자열은 브라우저가 붙인다). */
  body?: unknown;
  /** 요청을 중단할 때 쓴다(예: 업로드 취소). */
  signal?: AbortSignal;
  /** 쿼리 문자열. 값이 undefined인 키는 보내지 않는다(거르기를 고르지 않은 경우). */
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
}

function withQuery(path: string, query: RequestOptions["query"]): string {
  if (query === undefined) {
    return path;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search === "" ? path : `${path}?${search}`;
}

/**
 * api-gateway에 요청하고 응답 본문을 schema로 검증해 돌려준다. 실패 응답은 `ApiError`로 던진다.
 *
 * 로그인 상태면 접근 토큰을 붙이고, 재발급 쿠키가 필요한 인증 API를 위해 항상 자격 증명(쿠키)을 함께 보낸다.
 * 접근 토큰이 만료되면 재발급받아 한 번 다시 보낸다(SPEC-002 R-9). 재발급이 실패하면 세션은 로그아웃 상태가 된다(R-10).
 */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  const response = await send(path, options);
  return schema.parse(await response.json());
}

/** 본문이 없는 응답(204 등)을 기대하는 요청. */
export async function apiRequestNoContent(path: string, options?: RequestOptions): Promise<void> {
  await send(path, options);
}

function toBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }
  return body instanceof FormData ? body : JSON.stringify(body);
}

async function send(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<Response> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token !== undefined) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const isForm = options.body instanceof FormData;
  if (options.body !== undefined && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${withQuery(path, options.query)}`, {
    method: options.method ?? "GET",
    headers,
    body: toBody(options.body),
    credentials: "include",
    signal: options.signal,
  });
  if (response.ok) {
    return response;
  }
  const error = await toApiError(response);
  if (!retried && error.code === "AUTH_TOKEN_EXPIRED" && (await refreshSession())) {
    return send(path, options, true);
  }
  throw error;
}
