import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CAMERA_ID, sessionBody } from "../../../../mocks/stream";
import { renderCameras } from "../../../../tests/cameras";

const OLD = "0192fb00-0000-7000-8000-000000000001";
const NEW = "0192fb00-0000-7000-8000-000000000002";

describe("CameraSessionHistory", () => {
  it("[SPEC-034 R-14] 24시간 회전으로 바뀐 세션을 이전 세션과 이어 회전 표식과 함께 보인다", async () => {
    renderCameras(`/history/cameras/${CAMERA_ID}`, [], {
      sessions: [
        sessionBody({
          sessionId: NEW,
          sourceId: NEW,
          previousSourceId: OLD,
          startedAt: "2026-11-07T10:00:00Z",
        }),
        sessionBody({
          sessionId: OLD,
          sourceId: OLD,
          status: "CLOSED",
          startedAt: "2026-11-06T10:00:00Z",
          closedAt: "2026-11-07T10:00:00Z",
        }),
      ],
    });

    const history = await screen.findByRole("region", { name: "세션 이력" });
    const chains = await within(history).findAllByRole("list", { name: /^세션 묶음/ });
    expect(chains).toHaveLength(1);
    const items = within(chains[0] ?? document.body).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0] ?? document.body).getByText("24시간 회전으로 이어짐")).toBeVisible();
    expect(
      within(items[1] ?? document.body).queryByText("24시간 회전으로 이어짐"),
    ).not.toBeInTheDocument();
    expect(within(items[1] ?? document.body).getByText("끝남")).toBeVisible();
    expect(
      within(items[0] ?? document.body).getByRole("link", { name: "세션 열기" }),
    ).toHaveAttribute("href", `/stream/sessions/${NEW}`);
  });

  it("[SPEC-034 R-14] 세션이 없으면 없다고 안내한다", async () => {
    renderCameras(`/history/cameras/${CAMERA_ID}`, [], { sessions: [] });

    const history = await screen.findByRole("region", { name: "세션 이력" });
    expect(await within(history).findByText("수집 세션이 없습니다.")).toBeVisible();
  });
});
