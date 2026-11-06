import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers, videoBody, videoPageBody } from "../../mocks/handlers";
import { SESSIONS_API, sessionHandlers } from "../../mocks/media";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

describe("영상 분석 화면의 업로드", () => {
  it("[SPEC-005 R-7] 업로드를 마치면 목록을 다시 불러와 올린 영상을 보여 준다", async () => {
    let uploaded = false;
    // server.use는 앞에 둔 핸들러가 먼저 적용되므로 기본 media 핸들러를 맨 뒤에 둔다.
    server.use(
      handlers.me(),
      http.get(MEDIA_API, () =>
        HttpResponse.json(
          videoPageBody(
            uploaded ? [videoBody({ id: "a.mp4", fileName: "a.mp4", status: "UPLOADED" })] : [],
          ),
        ),
      ),
      http.post(`${MEDIA_API}/:id/complete`, () => {
        uploaded = true;
        return HttpResponse.json(videoBody({ id: "a.mp4", fileName: "a.mp4", status: "UPLOADED" }));
      }),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    await screen.findByText("올린 영상이 없습니다.");

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "a.mp4"),
    ]);

    const list = await screen.findByRole("list", { name: "내 영상" });
    expect(within(list).getByText("a.mp4")).toBeVisible();
  });

  it("[SPEC-005 R-13] 다른 메뉴로 갔다 와도 업로드가 계속되고 진행 상황이 보인다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(handlers.me(), ...mediaHandlers({ storageGate: gate }));
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    await screen.findByText("올린 영상이 없습니다.");
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "a.mp4"),
    ]);
    await screen.findByRole("progressbar", { name: "a.mp4 업로드 진행률" });

    await user.click(screen.getAllByRole("link", { name: "이벤트" })[0] ?? document.body);
    await screen.findByRole("heading", { name: "이벤트" });
    release();
    await user.click(screen.getAllByRole("link", { name: "영상 분석" })[0] ?? document.body);

    expect(await screen.findByText("업로드 완료")).toBeVisible();
  });
});

describe("영상 분석 화면의 새 세션 업로드", () => {
  it("[SPEC-034 R-7] 새 세션과 이름을 고르면 첫 파일의 자리 요청 전에 세션을 만들고 그 ID로 올린다", async () => {
    const order: string[] = [];
    const videoBodies: unknown[] = [];
    let sessionBody: unknown;
    server.use(
      http.post(SESSIONS_API, async ({ request }) => {
        order.push("createWorkSession");
        sessionBody = await request.clone().json();
        return undefined;
      }),
      http.post(MEDIA_API, async ({ request }) => {
        order.push("createVideo");
        videoBodies.push(await request.clone().json());
        return undefined;
      }),
      handlers.me(),
      ...sessionHandlers({ sessions: [] }),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    await screen.findByText("올린 영상이 없습니다.");

    await user.selectOptions(screen.getByRole("combobox", { name: "작업 세션" }), "새 세션 만들기");
    await user.type(screen.getByLabelText("새 세션 이름"), "3번 라인 방호벽 교체");
    await user.click(screen.getByRole("radio", { name: "작업 전" }));
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "before.mp4"),
      new File([new Uint8Array(10)], "before-2.mp4"),
    ]);
    await waitFor(() => {
      expect(screen.getAllByText("업로드 완료")).toHaveLength(2);
    });
    await user.click(screen.getByRole("radio", { name: "작업 후" }));
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "after.mp4"),
    ]);
    await waitFor(() => {
      expect(screen.getAllByText("업로드 완료")).toHaveLength(3);
    });

    expect(sessionBody).toEqual({ name: "3번 라인 방호벽 교체" });
    expect(order).toEqual(["createWorkSession", "createVideo", "createVideo", "createVideo"]);
    const field = (body: unknown, key: string): unknown =>
      typeof body === "object" && body !== null && key in body
        ? Object.entries(body).find(([name]) => name === key)?.[1]
        : undefined;
    const sessionIds = videoBodies.map((body) => field(body, "sessionId"));
    expect(new Set(sessionIds).size).toBe(1);
    expect(sessionIds[0]).toMatch(/^0192f0e0-/);
    expect(videoBodies.map((body) => field(body, "role"))).toEqual(["BEFORE", "BEFORE", "AFTER"]);
    expect(screen.getByRole("combobox", { name: "작업 세션" })).toHaveDisplayValue(
      "3번 라인 방호벽 교체",
    );
  });

  it("[SPEC-034 R-7] 새 세션 이름이 비면 올리지 않고 이유를 보인다", async () => {
    let created = 0;
    server.use(
      http.post(SESSIONS_API, () => {
        created++;
        return undefined;
      }),
      handlers.me(),
      ...sessionHandlers({ sessions: [] }),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    await screen.findByText("올린 영상이 없습니다.");

    await user.selectOptions(screen.getByRole("combobox", { name: "작업 세션" }), "새 세션 만들기");
    await user.click(screen.getByRole("radio", { name: "작업 전" }));
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      new File([new Uint8Array(10)], "a.mp4"),
    ]);

    expect(await screen.findByText("세션 이름을 입력해 주세요.")).toBeVisible();
    expect(created).toBe(0);
  });
});
