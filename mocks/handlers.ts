import { http, HttpResponse } from "msw";
import type { components } from "../src/api/generated/auth-service";
import type { components as MediaComponents } from "../src/api/generated/media-service";

type User = components["schemas"]["UserResponse"];
type TokenResponse = components["schemas"]["TokenResponse"];
type ProblemDetail = components["schemas"]["ProblemDetail"];
type MediaSchemas = MediaComponents["schemas"];

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

type Video = MediaSchemas["VideoResponse"];
type UploadInstruction = MediaSchemas["UploadInstruction"];

export const MEDIA_API = "http://localhost:8080/api/v1/media/videos";

/** 계약 VideoResponse 예시. 필요한 필드만 바꿔 쓴다. */
export function videoBody(overrides: Partial<Video> = {}): Video {
  return {
    id: "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
    ownerId: TEST_USER.id,
    fileName: "a.mp4",
    sizeBytes: 1000,
    contentType: "video/mp4",
    status: "UPLOADING",
    createdAt: "2026-11-03T00:00:00Z",
    uploadedAt: null,
    ...overrides,
  };
}

/** 단일 업로드 방법. 실제 POST 정책처럼 폼 필드 여러 개를 준다. */
export function singleUpload(): UploadInstruction {
  return {
    method: "SINGLE",
    url: `${STORAGE}/`,
    fields: {
      key: "sources/v/original",
      "Content-Type": "video/mp4",
      policy: "p",
      "x-amz-signature": "s",
    },
    expiresAt: "2026-11-03T01:00:00Z",
  };
}

/** 멀티파트 업로드 방법. 조각 수는 파일 크기를 조각 크기로 나눠 올림한 값이다. */
export function multipartUpload(sizeBytes: number, partSizeBytes: number): UploadInstruction {
  const count = Math.ceil(sizeBytes / partSizeBytes);
  return {
    method: "MULTIPART",
    partSizeBytes,
    parts: Array.from({ length: count }, (_, i) => ({
      partNumber: i + 1,
      url: `${STORAGE}/sources/v/original?partNumber=${String(i + 1)}&uploadId=u1`,
    })),
    expiresAt: "2026-11-03T01:00:00Z",
  };
}

/** 계약 VideoPage. 기본은 빈 목록이다. */
export function videoPageBody(items: Video[] = [], page = 0, totalElements = items.length) {
  return {
    items,
    page: { page, size: 20, totalElements, totalPages: Math.ceil(totalElements / 20) },
  };
}

/**
 * 업로드가 처음부터 끝까지 성공하는 media API와 저장소. 업로드 자리를 요청한 파일 이름을 영상 ID로 쓴다.
 * `storageGate`를 주면 저장소 응답이 그 Promise가 끝날 때까지 기다린다(업로드 중 화면 확인용).
 */
export function mediaHandlers(options: { storageGate?: Promise<void> } = {}) {
  return [
    storagePreflight(),
    http.get(MEDIA_API, () => HttpResponse.json(videoPageBody())),
    http.post(MEDIA_API, async ({ request }) => {
      const body = await request.json();
      const fileName =
        typeof body === "object" && body !== null && "fileName" in body
          ? String(body.fileName)
          : "unknown";
      return HttpResponse.json(
        { video: videoBody({ id: fileName, fileName }), upload: singleUpload() },
        { status: 201 },
      );
    }),
    http.post(`${STORAGE}/`, async () => {
      await options.storageGate;
      return storageResponse(204);
    }),
    http.post(`${MEDIA_API}/:id/complete`, ({ params }) =>
      HttpResponse.json(
        videoBody({ id: String(params.id), fileName: String(params.id), status: "UPLOADED" }),
      ),
    ),
  ];
}
