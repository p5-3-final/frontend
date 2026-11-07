import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { analysisHandlers, eventSummaryBody, eventDetailBody } from "../../mocks/analysis";
import { renderAnalysisDetail } from "../../tests/analysisDetail";
import { handlers, MEDIA_API, mediaHandlers, videoBody, videoPageBody } from "../../mocks/handlers";
import { http, HttpResponse } from "msw";
import { retainedVideoBody, retentionHandlers, sessionHandlers } from "../../mocks/media";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { endSession, startSession } from "../shared/api/session";

describe("키보드 조작", () => {
  it("[SPEC-002 NFR-2] 로그인 화면을 Tab과 Enter만으로 쓸 수 있다", async () => {
    server.use(handlers.logIn(), handlers.me());
    endSession();
    const { user } = renderRoute("/login");
    await screen.findByLabelText("이메일");

    await user.tab();
    expect(screen.getByLabelText("이메일")).toHaveFocus();
    await user.keyboard("user@example.com");
    await user.tab();
    expect(screen.getByLabelText("비밀번호")).toHaveFocus();
    await user.keyboard("secret123{Enter}");

    expect(await screen.findByRole("heading", { name: "영상 분석" })).toBeInTheDocument();
  });

  it("[SPEC-002 NFR-2] 가입 화면의 입력 칸과 버튼, 로그인 링크를 Tab 순서대로 지난다", async () => {
    server.use(handlers.refreshFails());
    const { user } = renderRoute("/signup");
    await screen.findByLabelText("이메일");

    const expected = [
      screen.getByLabelText("이메일"),
      screen.getByLabelText("비밀번호"),
      screen.getByLabelText("닉네임"),
      screen.getByRole("button", { name: "가입하기" }),
      screen.getByRole("link", { name: "로그인" }),
    ];
    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it("[SPEC-002 NFR-2] 사용자 메뉴를 열고 로그아웃까지 키보드로 할 수 있다", async () => {
    server.use(handlers.me(), handlers.logOut());
    startSession("access-1");
    const { user } = renderRoute("/analysis");
    const menuButton = await screen.findByRole("button", { name: /테스터/ });

    menuButton.focus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(screen.getByRole("button", { name: "로그아웃" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
  });

  it("[SPEC-005 NFR-5] 업로드 버튼으로 파일 고르기 창을 열고, 삭제 확인 창을 키보드로 열고 닫는다", async () => {
    server.use(
      handlers.me(),
      http.get(MEDIA_API, () =>
        HttpResponse.json(videoPageBody([videoBody({ fileName: "parking.mp4" })])),
      ),
    );
    startSession("access-1");
    const openPicker = vi.spyOn(HTMLInputElement.prototype, "click");
    const { user } = renderRoute("/analysis");
    const uploadButton = await screen.findByRole("button", { name: "영상 업로드" });
    const deleteButton = await screen.findByRole("button", { name: "parking.mp4 삭제" });

    uploadButton.focus();
    await user.keyboard("{Enter}");
    expect(openPicker).toHaveBeenCalled();

    deleteButton.focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "영상 삭제" });
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[SPEC-006 NFR-4] 목록에서 상세로 가서 플레이어, 원본 내려받기, 삭제를 키보드로 조작한다", async () => {
    const id = "0192f0d2-1a2b-7c3d-8e4f-5a6b7c8d9e0f";
    const video = videoBody({ id, fileName: "parking.mp4", status: "UPLOADED" });
    server.use(
      handlers.me(),
      http.get(MEDIA_API, () => HttpResponse.json(videoPageBody([video]))),
      http.get(`${MEDIA_API}/:id`, () => HttpResponse.json(video)),
      ...mediaHandlers(),
    );
    startSession("access-1");
    const { user } = renderRoute("/analysis");

    (await screen.findByRole("link", { name: "parking.mp4" })).focus();
    await user.keyboard("{Enter}");
    const player = await screen.findByLabelText("parking.mp4 재생");

    expect(player).toBeInTheDocument();
    // 상세 화면은 목록 링크 → 삭제 → 플레이어 컨트롤(재생·위치·음소거·전체 화면) → 원본 내려받기 순서로 지난다.
    // SPEC-031 R-4로 기본 컨트롤 대신 자체 컨트롤을 쓴다.
    screen.getByRole("link", { name: "목록으로 돌아가기" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "parking.mp4 삭제" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "재생" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("slider", { name: "재생 위치" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "음소거" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "전체 화면" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "원본 내려받기" })).toHaveFocus();

    screen.getByRole("button", { name: "parking.mp4 삭제" }).focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "영상 삭제" });
    // 테스트의 showModal 대체 구현은 초점을 창 안으로 옮기지 않는다. 실제 모달의 초점 이동은 E2E가 확인한다(tests/setup.ts).
    within(dialog).getByRole("button", { name: "취소" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[SPEC-031 R-18] 이벤트 목록을 Tab으로 지나 Enter로 이벤트를 열고 상세를 닫는다", async () => {
    const fall = eventSummaryBody({
      eventId: "0192f300-0000-5000-8000-000000000102",
      eventType: "fall",
      startMs: 130_000,
      seekMs: 128_000,
    });
    const { user } = renderAnalysisDetail(
      analysisHandlers({
        events: [eventSummaryBody(), fall],
        details: [eventDetailBody({ event: fall })],
      }),
    );
    const list = await screen.findByRole("list", { name: "이벤트 목록" });
    const [first, second] = within(list).getAllByRole("button");

    screen.getByLabelText("확인 상태").focus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab();
    expect(second).toHaveFocus();
    await user.keyboard("{Enter}");

    const detail = await screen.findByRole("region", { name: "이벤트 상세" });
    expect(await within(detail).findByText("쓰러짐")).toBeVisible();
    within(detail).getByRole("button", { name: "이벤트 상세 닫기" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("region", { name: "이벤트 상세" })).not.toBeInTheDocument();
  });

  it("[SPEC-031 R-18] 위험 패널의 시작 시각을 키보드로 골라 플레이어를 옮긴다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers());
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    const panel = await screen.findByRole("region", { name: "위험 상태" });
    const start = await within(panel).findByRole("button", { name: "시작 01:40로 이동" });

    // 위험 패널은 이벤트 목록 다음에 Tab으로 닿는다.
    const list = screen.getByRole("list", { name: "이벤트 목록" });
    within(list).getAllByRole("button").at(-1)?.focus();
    await user.tab();
    expect(start).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(video.currentTime).toBe(100);
  });

  it("[SPEC-034 T017] 업로드 화면의 세션 고르기와 역할 고르기를 Tab과 방향키로 쓴다", async () => {
    server.use(handlers.me(), ...sessionHandlers(), ...mediaHandlers());
    startSession("access-1");
    const { user } = renderRoute("/analysis?sessionId=0192f0e0-5a6b-7c8d-9e0f-1a2b3c4d5e6f");
    const select = await screen.findByRole("combobox", { name: "작업 세션" });
    await within(select).findByRole("option", { name: "3번 라인 방호벽 교체" });

    // jsdom은 Tailwind의 hidden(display: none)을 모르므로 숨긴 파일 입력 다음인 고르기에서 시작한다.
    select.focus();
    await user.tab();
    const before = screen.getByRole("radio", { name: "작업 전" });
    expect(before).toHaveFocus();
    await user.keyboard(" ");
    expect(before).toBeChecked();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "작업 중" })).toBeChecked();
  });

  it("[SPEC-034 T017] 보존 철회를 Enter로 열고 확인 창의 철회까지 키보드로 누른다", async () => {
    const videoId = "0192f0d2-0000-7000-8000-000000000001";
    server.use(handlers.me(), ...retentionHandlers({ retained: [retainedVideoBody({ videoId })] }));
    startSession("access-1");
    const { user } = renderRoute("/settings");
    const revoke = await screen.findByRole("button", { name: `${videoId} 철회` });

    revoke.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "학습용 보존 철회" });
    const confirm = within(dialog).getByRole("button", { name: "철회" });
    for (let step = 0; step < 10 && !confirm.matches(":focus"); step++) {
      await user.tab();
    }
    expect(confirm).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText("보존 중인 삭제 영상이 없습니다.")).toBeVisible();
  });
});
