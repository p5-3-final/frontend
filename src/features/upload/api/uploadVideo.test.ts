import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  MEDIA_API,
  multipartUpload,
  singleUpload,
  STORAGE,
  storagePreflight,
  storageResponse,
  videoBody,
} from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { StorageError } from "./storageTransport";
import { uploadVideo } from "./uploadVideo";

const NO_WAIT = { retryDelaysMs: [0, 0, 0] };

interface Recorded {
  gatewayRequests: { method: string; contentType: string | null }[];
  completeBody: unknown;
  formKeys: string[];
  partSizes: number[];
  maxConcurrentParts: number;
}

/** media API와 저장소를 등록하고, 오간 요청을 기록한다. */
function mediaServer(upload: ReturnType<typeof singleUpload>, partDelayMs = 0): Recorded {
  const recorded: Recorded = {
    gatewayRequests: [],
    completeBody: undefined,
    formKeys: [],
    partSizes: [],
    maxConcurrentParts: 0,
  };
  let inFlight = 0;
  server.use(
    storagePreflight(),
    http.post(MEDIA_API, ({ request }) => {
      recorded.gatewayRequests.push({
        method: "create",
        contentType: request.headers.get("Content-Type"),
      });
      return HttpResponse.json({ video: videoBody(), upload }, { status: 201 });
    }),
    http.post(`${MEDIA_API}/:id/complete`, async ({ request }) => {
      recorded.gatewayRequests.push({
        method: "complete",
        contentType: request.headers.get("Content-Type"),
      });
      const text = await request.text();
      recorded.completeBody = text === "" ? undefined : JSON.parse(text);
      return HttpResponse.json(
        videoBody({ status: "UPLOADED", uploadedAt: "2026-11-03T00:01:00Z" }),
      );
    }),
    http.post(`${STORAGE}/`, async ({ request }) => {
      // request.formData()는 쓰지 않는다. jsdom이 전역 File을 바꿔 두어 Node 24 이상의 undici가 파싱 중 단언에 실패한다(#28).
      // 확인할 것은 필드 순서뿐이라 multipart 원문에서 필드 이름을 차례로 읽는다.
      const body = await request.text();
      recorded.formKeys = [
        ...body.matchAll(/Content-Disposition: form-data; name="([^"]+)"/gi),
      ].map((match) => match[1] ?? "");
      return storageResponse(204);
    }),
    http.put(`${STORAGE}/sources/v/original`, async ({ request }) => {
      inFlight++;
      recorded.maxConcurrentParts = Math.max(recorded.maxConcurrentParts, inFlight);
      const partNumber = new URL(request.url).searchParams.get("partNumber") ?? "?";
      recorded.partSizes[Number(partNumber) - 1] = (await request.arrayBuffer()).byteLength;
      await new Promise((resolve) => setTimeout(resolve, partDelayMs));
      inFlight--;
      return storageResponse(200, { ETag: `"etag-${partNumber}"` });
    }),
  );
  return recorded;
}

const fileOf = (size: number, name = "a.mp4") => new File([new Uint8Array(size)], name);

describe("uploadVideo", () => {
  it("[SPEC-005 R-5] 단일 업로드는 받은 폼 필드를 모두 넣고 파일을 마지막에 넣어 POST한다", async () => {
    const recorded = mediaServer(singleUpload());

    await uploadVideo(fileOf(1000), "video/mp4", NO_WAIT);

    expect(recorded.formKeys).toEqual(["key", "Content-Type", "policy", "x-amz-signature", "file"]);
  });

  it("[SPEC-005 R-7] 다 올리면 완료를 요청하고 완료된 영상을 돌려준다", async () => {
    const recorded = mediaServer(singleUpload());

    const video = await uploadVideo(fileOf(1000), "video/mp4", NO_WAIT);

    expect(video.status).toBe("UPLOADED");
    expect(recorded.gatewayRequests.map((r) => r.method)).toEqual(["create", "complete"]);
    expect(recorded.completeBody).toBeUndefined();
  });

  it("[SPEC-005 R-6] 멀티파트는 조각 크기로 나눠 PUT하고 ETag를 번호순으로 모아 완료한다", async () => {
    const recorded = mediaServer(multipartUpload(11, 4));

    await uploadVideo(fileOf(11), "video/mp4", NO_WAIT);

    expect(recorded.partSizes).toEqual([4, 4, 3]);
    expect(recorded.completeBody).toEqual({
      parts: [
        { partNumber: 1, eTag: '"etag-1"' },
        { partNumber: 2, eTag: '"etag-2"' },
        { partNumber: 3, eTag: '"etag-3"' },
      ],
    });
  });

  it("[SPEC-005 R-6] 조각은 동시에 3개까지만 보낸다", async () => {
    const recorded = mediaServer(multipartUpload(7, 1), 20);

    await uploadVideo(fileOf(7), "video/mp4", NO_WAIT);

    expect(recorded.maxConcurrentParts).toBe(3);
    expect(recorded.partSizes).toHaveLength(7);
  });

  it("[SPEC-005 NFR-1] 파일 바이트는 api-gateway로 보내지 않는다", async () => {
    const recorded = mediaServer(multipartUpload(11, 4));

    await uploadVideo(fileOf(11), "video/mp4", NO_WAIT);

    expect(recorded.gatewayRequests.every((r) => r.contentType !== null)).toBe(true);
    expect(
      recorded.gatewayRequests.every((r) => r.contentType?.startsWith("application/json")),
    ).toBe(true);
  });

  it("[SPEC-005 R-10] 조각 하나가 실패하면 나머지 조각은 보내지 않고 실패한다", async () => {
    let puts = 0;
    // mediaServer보다 나중에 등록해야 이 PUT 핸들러가 먼저 적용된다.
    mediaServer(multipartUpload(20, 1));
    server.use(
      http.put(`${STORAGE}/sources/v/original`, async ({ request }) => {
        puts++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        const partNumber = new URL(request.url).searchParams.get("partNumber");
        return partNumber === "1" ? storageResponse(403) : storageResponse(200, { ETag: '"e"' });
      }),
    );

    await expect(uploadVideo(fileOf(20), "video/mp4", NO_WAIT)).rejects.toBeInstanceOf(
      StorageError,
    );
    // 멈추지 않았다면 남은 조각이 다 나갈 만큼 기다린 뒤 센다(조각당 10ms, 동시 3개).
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(puts).toBeLessThan(20);
  });

  it("[SPEC-005 R-8] 진행률을 파일 전체 기준으로 알리고 끝나면 전체 크기가 된다", async () => {
    mediaServer(multipartUpload(11, 4));
    const onProgress = vi.fn();

    await uploadVideo(fileOf(11), "video/mp4", { ...NO_WAIT, onProgress });

    expect(onProgress).toHaveBeenLastCalledWith(11, 11);
    for (const [loaded] of onProgress.mock.calls) {
      expect(loaded).toBeLessThanOrEqual(11);
    }
  });

  it("[SPEC-005 R-12] 업로드 자리를 받으면 영상 ID를 알린다", async () => {
    mediaServer(singleUpload());
    const onCreated = vi.fn();

    await uploadVideo(fileOf(1000), "video/mp4", { ...NO_WAIT, onCreated });

    expect(onCreated).toHaveBeenCalledWith(videoBody().id);
  });
});
