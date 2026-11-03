import type { Page, Route } from "@playwright/test";

const MEDIA = "http://localhost:8080/api/v1/media/videos";
const STORAGE = "http://localhost:8333/vlm-media";
// 실제 저장소처럼 교차 출처 업로드를 허용하고 ETag를 노출한다.
const STORAGE_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "ETag",
};
// E2E는 작은 파일로 두 방식을 모두 확인하려고 기준값을 낮춘다(실제: 100MB, 64MiB).
const SINGLE_MAX_BYTES = 100;
const PART_SIZE_BYTES = 50;

interface FakeVideo {
  id: string;
  ownerId: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  status: "UPLOADING" | "UPLOADED";
  createdAt: string;
  uploadedAt: string | null;
}

/**
 * E2E용 가짜 media API와 저장소. 만든 영상과 저장소가 받은 요청을 기억한다.
 * 실제 media-service·SeaweedFS와의 연결은 로컬 compose 시연으로 확인한다(plan 6절).
 */
export async function useFakeMedia(page: Page) {
  const videos: FakeVideo[] = [];
  const storage: { posts: number; gets: number; partSizes: number[] } = {
    posts: 0,
    gets: 0,
    partSizes: [],
  };
  let nextId = 0;

  await page.route(`${STORAGE}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: STORAGE_CORS });
      return;
    }
    if (request.method() === "GET") {
      // 영상처럼 보이지만 디코딩할 수 없는 바이트. Playwright Chromium은 H.264도 재생하지 못해 어차피 재생 실패 안내가 보인다.
      storage.gets++;
      await route.fulfill({
        status: 200,
        headers: { ...STORAGE_CORS, "Content-Type": "video/mp4" },
        body: Buffer.alloc(64, 1),
      });
      return;
    }
    if (request.method() === "POST") {
      storage.posts++;
      await route.fulfill({ status: 204, headers: STORAGE_CORS });
      return;
    }
    const partNumber = new URL(request.url()).searchParams.get("partNumber") ?? "0";
    storage.partSizes.push(request.postDataBuffer()?.length ?? 0);
    await route.fulfill({
      status: 200,
      headers: { ...STORAGE_CORS, ETag: `"etag-${partNumber}"` },
    });
  });

  await page.route(`${MEDIA}**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const [, id, action] = url.pathname.replace("/api/v1/media/videos", "").split("/");
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204 });
      return;
    }
    if (request.method() === "GET" && id === undefined) {
      const items = [...videos].reverse();
      await route.fulfill({
        json: {
          items,
          page: {
            page: 0,
            size: 20,
            totalElements: items.length,
            totalPages: items.length > 0 ? 1 : 0,
          },
        },
      });
      return;
    }
    if (request.method() === "POST" && id === undefined) {
      const body: unknown = request.postDataJSON();
      const input =
        typeof body === "object" && body !== null ? Object.fromEntries(Object.entries(body)) : {};
      nextId++;
      const video: FakeVideo = {
        id: `00000000-0000-4000-8000-${String(nextId).padStart(12, "0")}`,
        ownerId: "00000000-0000-4000-8000-000000000001",
        fileName: String(input.fileName),
        sizeBytes: Number(input.sizeBytes),
        contentType: String(input.contentType),
        status: "UPLOADING",
        createdAt: new Date(Date.UTC(2026, 10, 3, 0, nextId)).toISOString(),
        uploadedAt: null,
      };
      videos.push(video);
      const expiresAt = "2026-11-03T01:00:00Z";
      const upload =
        video.sizeBytes <= SINGLE_MAX_BYTES
          ? {
              method: "SINGLE",
              url: `${STORAGE}/`,
              fields: { key: `sources/${video.id}/original`, policy: "p", "x-amz-signature": "s" },
              expiresAt,
            }
          : {
              method: "MULTIPART",
              partSizeBytes: PART_SIZE_BYTES,
              parts: Array.from(
                { length: Math.ceil(video.sizeBytes / PART_SIZE_BYTES) },
                (_, i) => ({
                  partNumber: i + 1,
                  url: `${STORAGE}/sources/${video.id}/original?partNumber=${String(i + 1)}&uploadId=u`,
                }),
              ),
              expiresAt,
            };
      await route.fulfill({ status: 201, json: { video, upload } });
      return;
    }
    const video = videos.find((candidate) => candidate.id === id);
    if (video === undefined) {
      await route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "about:blank",
          title: "Not Found",
          status: 404,
          code: "MEDIA_VIDEO_NOT_FOUND",
        }),
      });
      return;
    }
    if (request.method() === "GET" && action === undefined) {
      await route.fulfill({ json: video });
      return;
    }
    if (request.method() === "GET" && action === "playback") {
      const original = `${STORAGE}/sources/${video.id}/original`;
      await route.fulfill({
        json: {
          url: `${original}?X-Amz-Signature=play`,
          downloadUrl: `${original}?response-content-disposition=attachment&X-Amz-Signature=download`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      });
      return;
    }
    if (request.method() === "POST" && action === "complete") {
      video.status = "UPLOADED";
      video.uploadedAt = video.createdAt;
      await route.fulfill({ json: video });
      return;
    }
    if (request.method() === "DELETE") {
      videos.splice(videos.indexOf(video), 1);
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ status: 405 });
  });

  return { storage };
}
