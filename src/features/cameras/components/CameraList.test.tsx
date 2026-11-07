import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cameraBody, CAMERA_ID, STREAM_SESSION_ID } from "../../../../mocks/stream";
import { renderCameras } from "../../../../tests/cameras";

describe("CameraList", () => {
  it("[SPEC-034 R-13] 카메라를 이름·상태·현재 세션과 함께 보인다", async () => {
    renderCameras("/history/cameras", [], {
      cameras: [
        cameraBody(),
        cameraBody({
          cameraId: "0192fb00-0000-7000-8000-000000000021",
          name: "B동 출입구",
          status: "IDLE",
          activeSessionId: null,
        }),
      ],
    });

    const list = await screen.findByRole("list", { name: "카메라" });
    const [crane, gate] = within(list).getAllByRole("listitem");
    const craneRow = within(crane ?? document.body);
    expect(craneRow.getByRole("link", { name: "A동 크레인" })).toHaveAttribute(
      "href",
      `/history/cameras/${CAMERA_ID}`,
    );
    expect(craneRow.getByText("수집 중")).toBeVisible();
    expect(craneRow.getByRole("link", { name: "실시간 세션 보기" })).toHaveAttribute(
      "href",
      `/stream/sessions/${STREAM_SESSION_ID}`,
    );
    const gateRow = within(gate ?? document.body);
    expect(gateRow.getByText("대기")).toBeVisible();
    expect(gateRow.getByText("세션 없음")).toBeVisible();
  });

  it("[SPEC-034 R-13] 분석 이력 화면에 작업 세션·카메라 탭이 있다", async () => {
    const { user } = renderCameras("/history");

    const tabs = await screen.findByRole("navigation", { name: "분석 이력 보기" });
    await user.click(within(tabs).getByRole("link", { name: "카메라" }));

    expect(await screen.findByRole("list", { name: "카메라" })).toBeVisible();
    // 화면이 바뀌어 탭도 새로 그려진다.
    const current = screen.getByRole("navigation", { name: "분석 이력 보기" });
    expect(within(current).getByRole("link", { name: "카메라" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("[SPEC-034 R-13] 카메라가 없으면 등록 안내를 보인다", async () => {
    renderCameras("/history/cameras", [], { cameras: [] });

    expect(await screen.findByText("등록한 카메라가 없습니다.")).toBeVisible();
  });
});
