import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { STORAGE, storagePreflight, storageResponse } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { postForm, putPart, StorageError } from "./storageTransport";

const PART_URL = `${STORAGE}/sources/v1/original?partNumber=1&uploadId=u1`;
const NO_WAIT = { retryDelaysMs: [0, 0, 0] };

/** 정한 응답을 차례로 돌려주고, 받은 요청 수를 센다. 응답이 모자라면 마지막 응답을 반복한다. */
function storageResponses(method: "put" | "post", url: string, responses: (() => Response)[]) {
  const counter: { count: number; headers: Headers[] } = { count: 0, headers: [] };
  server.use(
    storagePreflight(),
    http[method](url, ({ request }) => {
      counter.headers.push(request.headers);
      const respond = responses[Math.min(counter.count, responses.length - 1)] ?? serverError;
      counter.count++;
      return respond();
    }),
  );
  return counter;
}

const ok = () => storageResponse(200, { ETag: '"etag-1"' });
const serverError = () => storageResponse(503);

describe("putPart", () => {
  it("[SPEC-005 R-6] 조각을 PUT하고 응답의 ETag를 돌려준다", async () => {
    storageResponses("put", PART_URL, [ok]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).resolves.toBe('"etag-1"');
  });

  it("[SPEC-005 R-6] 저장소 CORS가 ETag를 노출하지 않으면 실패한다", async () => {
    storageResponses("put", PART_URL, [
      () =>
        new HttpResponse(null, {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*", ETag: '"etag-1"' },
        }),
    ]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).rejects.toBeInstanceOf(
      StorageError,
    );
  });

  it("[SPEC-005 R-9] 5xx면 다시 보내 성공하면 끝난다", async () => {
    const counter = storageResponses("put", PART_URL, [serverError, serverError, ok]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).resolves.toBe('"etag-1"');
    expect(counter.count).toBe(3);
  });

  it("[SPEC-005 R-9] 네트워크 오류도 다시 보낸다", async () => {
    const counter = storageResponses("put", PART_URL, [() => HttpResponse.error(), ok]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).resolves.toBe('"etag-1"');
    expect(counter.count).toBe(2);
  });

  it("[SPEC-005 R-9] 최대 3번까지만 다시 보내고 실패한다", async () => {
    const counter = storageResponses("put", PART_URL, [serverError]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).rejects.toBeInstanceOf(
      StorageError,
    );
    expect(counter.count).toBe(4);
  });

  it("[SPEC-005 R-9] 4xx는 다시 보내도 같아서 바로 실패한다", async () => {
    const counter = storageResponses("put", PART_URL, [() => storageResponse(403)]);

    await expect(putPart(PART_URL, new Blob(["abc"]), NO_WAIT)).rejects.toMatchObject({
      status: 403,
    });
    expect(counter.count).toBe(1);
  });

  it("[SPEC-005 R-12] 중단하면 AbortError로 끝나고 다시 보내지 않는다", async () => {
    const controller = new AbortController();
    const counter = storageResponses("put", PART_URL, [
      () => {
        controller.abort();
        return serverError();
      },
    ]);

    await expect(
      putPart(PART_URL, new Blob(["abc"]), { ...NO_WAIT, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(counter.count).toBe(1);
  });

  it("[SPEC-005 NFR-4] 끝나면 보낸 바이트 전체를 진행률로 알린다", async () => {
    storageResponses("put", PART_URL, [ok]);
    const onProgress = vi.fn();

    await putPart(PART_URL, new Blob(["abcde"]), { ...NO_WAIT, onProgress });

    expect(onProgress).toHaveBeenLastCalledWith(5);
  });

  it("[SPEC-005 NFR-1] 저장소 요청에는 인증 헤더를 붙이지 않는다", async () => {
    const counter = storageResponses("put", PART_URL, [ok]);

    await putPart(PART_URL, new Blob(["abc"]), NO_WAIT);

    expect(counter.headers[0]?.get("Authorization")).toBeNull();
  });
});

describe("postForm", () => {
  it("[SPEC-005 R-9] 단일 업로드 POST도 5xx면 다시 보낸다", async () => {
    const counter = storageResponses("post", `${STORAGE}/`, [
      serverError,
      () => storageResponse(204),
    ]);

    await postForm(`${STORAGE}/`, { key: "k" }, new Blob(["abc"]), NO_WAIT);

    expect(counter.count).toBe(2);
  });
});
