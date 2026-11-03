import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MEDIA_API,
  mediaHandlers,
  problem,
  STORAGE,
  storageResponse,
} from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import {
  addFiles,
  cancelUpload,
  getUploads,
  retryUpload,
  setRetryDelaysForTest,
} from "./uploadQueue";

const fileOf = (name: string, size = 10) => new File([new Uint8Array(size)], name);

const statusOf = (fileName: string) =>
  getUploads().find((item) => item.fileName === fileName)?.status;

describe("업로드 실패와 취소", () => {
  beforeEach(() => {
    setRetryDelaysForTest([0, 0, 0]);
  });

  it("[SPEC-005 R-10] 저장소 업로드가 재시도까지 실패하면 실패로 표시하고 다음 파일로 넘어간다", async () => {
    // 파일은 하나씩 올라가므로 처음 4번(1번 + 재시도 3번)이 bad.mp4의 요청이다.
    let storageCalls = 0;
    server.use(
      http.post(`${STORAGE}/`, () => {
        storageCalls++;
        return storageCalls <= 4 ? storageResponse(503) : storageResponse(204);
      }),
      ...mediaHandlers(),
    );

    addFiles([fileOf("bad.mp4"), fileOf("good.mp4")]);

    await vi.waitFor(() => {
      expect(statusOf("good.mp4")).toBe("done");
    });
    expect(getUploads()[0]).toMatchObject({
      status: "failed",
      message: "파일을 저장소에 올리지 못했습니다. 다시 시도해 주세요.",
    });
  });

  it("[SPEC-005 R-10] 완료 요청이 실패하면 오류 code의 문구로 실패를 표시한다", async () => {
    server.use(
      http.post(`${MEDIA_API}/:id/complete`, () => problem(409, "MEDIA_UPLOAD_INCOMPLETE")),
      ...mediaHandlers(),
    );

    addFiles([fileOf("a.mp4")]);

    await vi.waitFor(() => {
      expect(getUploads()[0]).toMatchObject({
        status: "failed",
        message: "파일이 모두 올라가지 않았습니다. 다시 시도해 주세요.",
      });
    });
  });

  it("[SPEC-005 R-11] 다시 시도하면 대기열 끝에서 새 업로드 자리를 받아 처음부터 올린다", async () => {
    let creates = 0;
    let storageCalls = 0;
    server.use(
      http.post(MEDIA_API, () => {
        creates++;
        return undefined;
      }),
      http.post(`${STORAGE}/`, () => {
        storageCalls++;
        return storageCalls <= 4 ? storageResponse(503) : storageResponse(204);
      }),
      ...mediaHandlers(),
    );
    addFiles([fileOf("a.mp4")]);
    await vi.waitFor(() => {
      expect(statusOf("a.mp4")).toBe("failed");
    });
    addFiles([fileOf("b.mp4")]);
    const failedId = getUploads()[0]?.id ?? "";

    retryUpload(failedId);

    await vi.waitFor(() => {
      expect(getUploads().every((item) => item.status === "done")).toBe(true);
    });
    expect(getUploads().map((item) => item.fileName)).toEqual(["b.mp4", "a.mp4"]);
    expect(creates).toBe(3);
  });

  it("[SPEC-005 R-12] 올리고 있는 파일을 취소하면 멈추고 받은 영상을 지우고 다음 파일로 넘어간다", async () => {
    const deleted: string[] = [];
    let storageCalls = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.delete(`${MEDIA_API}/:id`, ({ params }) => {
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
      // 첫 파일(slow.mp4)의 저장소 요청만 gate가 열릴 때까지 붙잡는다.
      http.post(`${STORAGE}/`, async () => {
        storageCalls++;
        if (storageCalls === 1) {
          await gate;
        }
        return storageResponse(204);
      }),
      ...mediaHandlers(),
    );
    addFiles([fileOf("slow.mp4"), fileOf("next.mp4")]);
    await vi.waitFor(() => {
      expect(storageCalls).toBe(1);
    });
    expect(getUploads()[0]).toMatchObject({ status: "uploading", videoId: "slow.mp4" });

    cancelUpload(getUploads()[0]?.id ?? "");
    release();

    await vi.waitFor(() => {
      expect(statusOf("next.mp4")).toBe("done");
    });
    expect(getUploads().map((item) => item.fileName)).toEqual(["next.mp4"]);
    await vi.waitFor(() => {
      expect(deleted).toEqual(["slow.mp4"]);
    });
  });

  it("[SPEC-005 R-12] 기다리는 파일을 취소하면 요청 없이 대기열에서 뺀다", async () => {
    const created: string[] = [];
    server.use(
      http.post(MEDIA_API, async ({ request }) => {
        // 다음 핸들러가 본문을 다시 읽으므로 복제본을 읽는다.
        created.push(JSON.stringify(await request.clone().json()));
        return undefined;
      }),
      ...mediaHandlers(),
    );
    addFiles([fileOf("a.mp4"), fileOf("b.mp4")]);

    cancelUpload(getUploads()[1]?.id ?? "");

    await vi.waitFor(() => {
      expect(statusOf("a.mp4")).toBe("done");
    });
    expect(getUploads().map((item) => item.fileName)).toEqual(["a.mp4"]);
    expect(created).toHaveLength(1);
  });
});
