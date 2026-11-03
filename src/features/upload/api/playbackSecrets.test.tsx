import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handlers,
  MEDIA_API,
  mediaHandlers,
  playbackBody,
  STORAGE,
  videoBody,
} from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

const VIDEO_ID = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
// 로그·저장소에서 찾기 쉬운 서명 값
const PLAY_SIGNATURE = "PLAY-SIGNATURE-SECRET-7a8b";
const DOWNLOAD_SIGNATURE = "DOWNLOAD-SIGNATURE-SECRET-9c0d";

const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;

function storageText(storage: Storage) {
  return Array.from({ length: storage.length }, (_, i) => {
    const key = storage.key(i) ?? "";
    return `${key}=${storage.getItem(key) ?? ""}`;
  }).join("\n");
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("재생 주소의 서명 값", () => {
  it("[SPEC-006 NFR-3] 재생·내려받기 주소의 서명을 브라우저 저장소와 콘솔에 남기지 않는다", async () => {
    const consoleSpies = CONSOLE_METHODS.map((method) => vi.spyOn(console, method));
    server.use(
      handlers.me(),
      http.get(`${MEDIA_API}/:id`, () =>
        HttpResponse.json(videoBody({ id: VIDEO_ID, fileName: "a.mp4", status: "UPLOADED" })),
      ),
      http.get(`${MEDIA_API}/:id/playback`, () =>
        HttpResponse.json(
          playbackBody({
            url: `${STORAGE}/sources/v/original?X-Amz-Signature=${PLAY_SIGNATURE}`,
            downloadUrl: `${STORAGE}/sources/v/original?X-Amz-Signature=${DOWNLOAD_SIGNATURE}`,
          }),
        ),
      ),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute(`/analysis/videos/${VIDEO_ID}`);

    // 재생 실패 안내까지 거쳐 두 주소를 모두 화면에 쓴 뒤 목록으로 떠난다.
    fireEvent.error(await screen.findByLabelText("a.mp4 재생"));
    await screen.findByText(/이 브라우저에서 재생할 수 없는 영상입니다/);
    await user.click(screen.getByRole("link", { name: "목록으로 돌아가기" }));
    await screen.findByRole("heading", { name: "영상 분석" });

    const stored = storageText(localStorage) + storageText(sessionStorage);
    const logged = consoleSpies.flatMap((spy) => spy.mock.calls).map((args) => args.join(" "));
    for (const secret of [PLAY_SIGNATURE, DOWNLOAD_SIGNATURE]) {
      expect(stored).not.toContain(secret);
      expect(logged.join("\n")).not.toContain(secret);
    }
  });
});
