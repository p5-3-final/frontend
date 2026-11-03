import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MEDIA_API,
  mediaHandlers,
  STORAGE,
  storageResponse,
  videoBody,
} from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { addFiles, getUploads } from "../model/uploadQueue";

// 로그·저장소에서 찾기 쉬운 서명 값
const POLICY = "POLICY-SECRET-1a2b";
const SIGNATURE = "SIGNATURE-SECRET-3c4d";
const PART_SIGNATURE = "PART-SIGNATURE-SECRET-5e6f";

const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;

function storageEntries(storage: Storage) {
  return Array.from({ length: storage.length }, (_, i) => {
    const key = storage.key(i) ?? "";
    return [key, storage.getItem(key)];
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("업로드 주소의 서명 값", () => {
  it("[SPEC-005 NFR-2] 서명 주소와 폼 값을 대기열 상태, 브라우저 저장소, 콘솔에 남기지 않는다", async () => {
    const consoleSpies = CONSOLE_METHODS.map((method) => vi.spyOn(console, method));
    server.use(
      http.post(MEDIA_API, async ({ request }) => {
        const body = await request.json();
        const multipart =
          typeof body === "object" &&
          body !== null &&
          "fileName" in body &&
          body.fileName === "big.mp4";
        const upload = multipart
          ? {
              method: "MULTIPART",
              partSizeBytes: 4,
              parts: [1, 2].map((partNumber) => ({
                partNumber,
                url: `${STORAGE}/sources/v/original?partNumber=${String(partNumber)}&X-Amz-Signature=${PART_SIGNATURE}`,
              })),
              expiresAt: "2026-11-03T01:00:00Z",
            }
          : {
              method: "SINGLE",
              url: `${STORAGE}/`,
              fields: { key: "sources/v/original", policy: POLICY, "x-amz-signature": SIGNATURE },
              expiresAt: "2026-11-03T01:00:00Z",
            };
        return HttpResponse.json({ video: videoBody(), upload }, { status: 201 });
      }),
      http.put(`${STORAGE}/sources/v/original`, () => storageResponse(200, { ETag: '"e"' })),
      ...mediaHandlers(),
    );

    addFiles([
      new File([new Uint8Array(10)], "small.mp4"),
      new File([new Uint8Array(6)], "big.mp4"),
    ]);
    await vi.waitFor(() => {
      expect(getUploads().every((item) => item.status === "done")).toBe(true);
    });

    const remembered = [
      JSON.stringify(getUploads()),
      JSON.stringify(storageEntries(localStorage)),
      JSON.stringify(storageEntries(sessionStorage)),
      ...consoleSpies.flatMap((spy) => spy.mock.calls.map((call) => JSON.stringify(call))),
    ].join("\n");
    for (const secret of [POLICY, SIGNATURE, PART_SIGNATURE]) {
      expect(remembered).not.toContain(secret);
    }
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
