import type { Page, Route } from "@playwright/test";
import {
  answerBody,
  groundingClipBody,
  momentSearchBody,
  type AnswerResultBody,
  type MomentSearchResultBody,
} from "../../mocks/search";
import { E2E_VIDEO_ID } from "./fakeAnalysis";

const API = "http://localhost:8080/api/v1";
const STORAGE = "http://localhost:8333/vlm-media";
/** 썸네일 주소 앞부분. 화면 밖 썸네일을 받지 않는지(NFR-1) 이 주소로 센다. */
export const THUMBNAIL_PREFIX = `${STORAGE}/thumbs/`;
// 1×1 회색 PNG
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNoAAAAggCBd81ytgAAAABJRU5ErkJggg==",
  "base64",
);

export interface FakeSearchState {
  sourceSearch: MomentSearchResultBody;
  answer: AnswerResultBody;
  /** 받은 기록(feedback) 종류 */
  feedback: string[];
  /** 이미지 검색 요청의 Content-Type과 본문 일부 */
  imageUploads: { contentType: string; body: string }[];
  thumbnailRequests: string[];
}

/** n번째 결과의 썸네일 주소 */
export function thumbnailUrl(index: number): string {
  return `${THUMBNAIL_PREFIX}${String(index)}.png?X-Amz-Signature=thumb-${String(index)}`;
}

/**
 * E2E용 가짜 search-service와 내 영상 목록. 영상·재생은 `useFakeAnalysis`가 맡으므로 그 뒤에 부른다
 * (나중에 등록한 route가 먼저 적용된다). 결과 썸네일은 1×1 PNG로 답하고 요청을 센다.
 */
export async function useFakeSearch(page: Page, initial: Partial<FakeSearchState> = {}) {
  const state: FakeSearchState = {
    sourceSearch: initial.sourceSearch ?? momentSearchBody(),
    answer: initial.answer ?? answerBody(),
    feedback: [],
    imageUploads: [],
    thumbnailRequests: [],
  };

  await page.route(`${THUMBNAIL_PREFIX}**`, async (route) => {
    state.thumbnailRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      contentType: "image/png",
      body: PIXEL,
    });
  });

  await page.route(
    (url) => url.pathname === "/api/v1/media/videos",
    async (route) => {
      await route.fulfill({
        json: {
          items: [
            {
              id: E2E_VIDEO_ID,
              ownerId: "00000000-0000-4000-8000-000000000001",
              fileName: "crane.webm",
              sizeBytes: 1000,
              contentType: "video/mp4",
              status: "READY",
              createdAt: "2026-11-06T09:00:00Z",
              uploadedAt: "2026-11-06T09:01:00Z",
              session: null,
              retentionConsent: false,
            },
          ],
          page: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
        },
      });
    },
  );

  await page.route(`${API}/search/**`, async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1/search", "");
    if (path.endsWith("/feedback")) {
      const body: unknown = request.postDataJSON();
      state.feedback.push(
        typeof body === "object" && body !== null && "kind" in body ? String(body.kind) : "",
      );
      await route.fulfill({ status: 204 });
      return;
    }
    if (path === "/moments/by-image") {
      state.imageUploads.push({
        contentType: (await request.headerValue("content-type")) ?? "",
        body: request.postDataBuffer()?.toString("latin1").slice(0, 2000) ?? "",
      });
      await route.fulfill({
        json: momentSearchBody({
          query: "",
          canonicalQuery: "",
          parseMethod: "image",
          targets: [],
          precise: false,
          results: state.sourceSearch.results.slice(0, 1).map((moment) => ({
            ...moment,
            matchedBy: ["image"],
            grounding: { ...moment.grounding, status: "NONE" },
          })),
        }),
      });
      return;
    }
    if (path.startsWith("/groundings/")) {
      await route.fulfill({
        json: groundingClipBody({
          groundingId: path.split("/").at(-1) ?? "",
          clipUrl: `${STORAGE}/derived/grounding.webm?X-Amz-Signature=clip`,
        }),
      });
      return;
    }
    if (path.endsWith("/answer")) {
      await route.fulfill({ json: state.answer });
      return;
    }
    await route.fulfill({ json: state.sourceSearch });
  });

  return state;
}
