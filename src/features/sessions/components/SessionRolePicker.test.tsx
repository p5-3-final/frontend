import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { handlers, MEDIA_API, mediaHandlers } from "../../../../mocks/handlers";
import { sessionHandlers, workSessionBody, WORK_SESSION_ID } from "../../../../mocks/media";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

const fileOf = (name: string) => new File([new Uint8Array(10)], name);

/** 업로드 화면을 열고 createVideo 본문을 기록한다. */
async function openUpload(path = "/analysis") {
  const bodies: unknown[] = [];
  server.use(
    http.post(MEDIA_API, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
    handlers.me(),
    ...sessionHandlers({
      sessions: [
        workSessionBody(),
        workSessionBody({ id: "0192f0e0-0000-7000-8000-0000000000b2", name: "2번 라인 점검" }),
      ],
    }),
    ...mediaHandlers(),
  );
  startSession("access-1");
  const view = renderRoute(path);
  await screen.findByText("올린 영상이 없습니다.");
  return { ...view, bodies };
}

describe("SessionRolePicker", () => {
  it("[SPEC-034 R-6] 세션 고르기에 없음·내 세션·새 세션이 있다", async () => {
    await openUpload();

    const select = screen.getByRole("combobox", { name: "작업 세션" });
    await within(select).findByRole("option", { name: "3번 라인 방호벽 교체" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["세션 없음", "3번 라인 방호벽 교체", "2번 라인 점검", "새 세션 만들기"]);
    expect(screen.queryByRole("radiogroup", { name: "역할" })).not.toBeInTheDocument();
  });

  it("[SPEC-034 R-6] 세션을 고르고 역할을 고르지 않으면 올리지 않고 이유를 보인다", async () => {
    const { user, bodies } = await openUpload();
    const select = screen.getByRole("combobox", { name: "작업 세션" });
    await within(select).findByRole("option", { name: "3번 라인 방호벽 교체" });

    await user.selectOptions(select, "3번 라인 방호벽 교체");
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [fileOf("a.mp4")]);

    expect(await screen.findByText("역할을 골라 주세요.")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it("[SPEC-034 R-6] 고른 세션과 역할을 업로드 자리 요청의 sessionId·role에 싣는다", async () => {
    const { user, bodies } = await openUpload();
    const select = screen.getByRole("combobox", { name: "작업 세션" });
    await within(select).findByRole("option", { name: "3번 라인 방호벽 교체" });

    await user.selectOptions(select, "3번 라인 방호벽 교체");
    await user.click(screen.getByRole("radio", { name: "작업 후" }));
    await user.upload(screen.getByLabelText("영상 파일 고르기"), [fileOf("a.mp4")]);

    expect(await screen.findByText("업로드 완료")).toBeVisible();
    expect(bodies[0]).toMatchObject({
      fileName: "a.mp4",
      sessionId: WORK_SESSION_ID,
      role: "AFTER",
    });
  });

  it("[SPEC-034 R-6] 세션 없음이면 지금처럼 sessionId 없이 올린다", async () => {
    const { user, bodies } = await openUpload();

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [fileOf("a.mp4")]);

    expect(await screen.findByText("업로드 완료")).toBeVisible();
    expect(bodies[0]).not.toHaveProperty("sessionId");
  });
});
