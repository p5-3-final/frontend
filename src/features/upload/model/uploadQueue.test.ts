import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  MEDIA_API,
  singleUpload,
  STORAGE,
  storagePreflight,
  storageResponse,
  videoBody,
} from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { endSession, startSession } from "../../../shared/api/session";
import { addFiles, getUploads, onVideosChanged } from "./uploadQueue";

/** 요청 순서를 기록하는 media API와 저장소. 파일 이름을 영상 ID로 쓴다. */
function mediaServer() {
  const events: string[] = [];
  server.use(
    storagePreflight(),
    http.post(MEDIA_API, async ({ request }) => {
      const body = await request.json();
      const fileName =
        typeof body === "object" && body !== null && "fileName" in body
          ? String(body.fileName)
          : "";
      events.push(`create ${fileName}`);
      return HttpResponse.json(
        { video: videoBody({ id: fileName, fileName }), upload: singleUpload() },
        { status: 201 },
      );
    }),
    http.post(`${STORAGE}/`, () => storageResponse(204)),
    http.post(`${MEDIA_API}/:id/complete`, ({ params }) => {
      const id = String(params.id);
      events.push(`complete ${id}`);
      return HttpResponse.json(videoBody({ id, fileName: id, status: "UPLOADED" }));
    }),
  );
  return events;
}

const fileOf = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe("uploadQueue", () => {
  it("[SPEC-005 R-1] 고른 파일을 고른 순서대로 대기열에 넣는다", async () => {
    mediaServer();

    addFiles([fileOf("a.mp4"), fileOf("b.mov")]);

    expect(getUploads().map((item) => item.fileName)).toEqual(["a.mp4", "b.mov"]);
    expect(getUploads().map((item) => item.status)).toEqual(["uploading", "waiting"]);
    await vi.waitFor(() => {
      expect(getUploads().every((item) => item.status === "done")).toBe(true);
    });
  });

  it("[SPEC-005 R-4] 한 번에 하나씩, 앞 파일이 끝나면 다음 파일을 올린다", async () => {
    const events = mediaServer();

    addFiles([fileOf("a.mp4"), fileOf("b.mov")]);
    addFiles([fileOf("c.mkv")]);

    await vi.waitFor(() => {
      expect(getUploads().every((item) => item.status === "done")).toBe(true);
    });
    expect(events).toEqual([
      "create a.mp4",
      "complete a.mp4",
      "create b.mov",
      "complete b.mov",
      "create c.mkv",
      "complete c.mkv",
    ]);
  });

  it("[SPEC-005 R-7] 다 올린 파일은 완료로 표시하고 목록이 바뀌었음을 알린다", async () => {
    mediaServer();
    const listener = vi.fn();
    onVideosChanged(listener);

    addFiles([fileOf("a.mp4", 10)]);

    await vi.waitFor(() => {
      expect(getUploads()[0]).toMatchObject({ status: "done", videoId: "a.mp4", loadedBytes: 10 });
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("[SPEC-005 R-2] [SPEC-005 R-3] 형식·크기가 맞지 않는 파일은 요청하지 않고 이유와 함께 남긴다", async () => {
    const events = mediaServer();

    addFiles([fileOf("a.gif"), fileOf("b.mp4", 0), fileOf("c.mp4")]);

    await vi.waitFor(() => {
      expect(getUploads()[2]?.status).toBe("done");
    });
    expect(getUploads().slice(0, 2)).toMatchObject([
      { status: "rejected", message: "mp4, mov, mkv, avi 영상만 올릴 수 있습니다." },
      { status: "rejected", message: "파일 크기는 1바이트 이상 5GB 이하여야 합니다." },
    ]);
    expect(events).toEqual(["create c.mp4", "complete c.mp4"]);
  });

  it("[SPEC-005 R-13] 로그아웃하면 진행 중인 업로드를 멈추고 대기열을 비운다", () => {
    mediaServer();
    startSession("access-1");
    addFiles([fileOf("a.mp4"), fileOf("b.mp4")]);

    endSession();

    expect(getUploads()).toEqual([]);
  });
});

describe("uploadQueue 작업 세션", () => {
  it("[SPEC-034 R-6] 업로드 대상(세션·역할)을 주면 업로드 자리 요청에 sessionId·role을 싣는다", async () => {
    // server.use는 앞에 넣으므로 기록 핸들러를 기본 media 응답 뒤에 등록한다.
    mediaServer();
    const bodies: unknown[] = [];
    server.use(
      http.post(MEDIA_API, async ({ request }) => {
        bodies.push(await request.clone().json());
        return undefined;
      }),
    );
    const target = { sessionId: "0192f0e0-5a6b-7c8d-9e0f-1a2b3c4d5e6f", role: "AFTER" } as const;

    addFiles([fileOf("a.mp4"), fileOf("b.mov")], target);
    await vi.waitFor(() => {
      expect(getUploads().every((item) => item.status === "done")).toBe(true);
    });

    expect(bodies).toEqual([
      expect.objectContaining({ fileName: "a.mp4", ...target }),
      expect.objectContaining({ fileName: "b.mov", ...target }),
    ]);
  });

  it("[SPEC-034 R-6] 대상이 없으면 sessionId·role을 보내지 않는다", async () => {
    // server.use는 앞에 넣으므로 기록 핸들러를 기본 media 응답 뒤에 등록한다.
    mediaServer();
    const bodies: unknown[] = [];
    server.use(
      http.post(MEDIA_API, async ({ request }) => {
        bodies.push(await request.clone().json());
        return undefined;
      }),
    );

    addFiles([fileOf("a.mp4")]);
    await vi.waitFor(() => {
      expect(getUploads()[0]?.status).toBe("done");
    });

    expect(bodies[0]).not.toHaveProperty("sessionId");
    expect(bodies[0]).not.toHaveProperty("role");
  });

  it("[SPEC-034 R-6] 세션이 가득 차면(MEDIA_SESSION_FULL) 그 파일은 실패로 끝나고 이유를 보인다", async () => {
    server.use(
      http.post(MEDIA_API, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Conflict", status: 409, code: "MEDIA_SESSION_FULL" },
          { status: 409 },
        ),
      ),
    );

    addFiles([fileOf("a.mp4")], {
      sessionId: "0192f0e0-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
      role: "BEFORE",
    });

    await vi.waitFor(() => {
      expect(getUploads()[0]).toMatchObject({
        status: "failed",
        message: "세션에는 영상을 100개까지 넣을 수 있습니다.",
      });
    });
  });
});
