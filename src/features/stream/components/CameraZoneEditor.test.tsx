import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cameraZoneBody, cameraZoneHandlers, ZONE_CAMERA_ID } from "../../../../mocks/cameraZones";
import { server } from "../../../../tests/server";
import { CameraZoneEditor } from "./CameraZoneEditor";

function renderEditor(frameUrl: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <CameraZoneEditor cameraId={ZONE_CAMERA_ID} frameUrl={frameUrl} />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup() };
}

function recordPut() {
  const bodies: unknown[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method === "PUT") {
      void request
        .clone()
        .json()
        .then((body: unknown) => {
          bodies.push(body);
        });
    }
  });
  return bodies;
}

describe("CameraZoneEditor", () => {
  it("[SPEC-032 R-16] 카메라 구역을 같은 편집기로 그려 카메라 구역 API로 저장하고 다음 세션부터 적용된다고 안내한다", async () => {
    server.use(...cameraZoneHandlers());
    const bodies = recordPut();
    const { user } = renderEditor("http://localhost:8333/frame.jpg");

    const editor = await screen.findByRole("region", { name: "위험구역 편집" });
    expect(screen.getByRole("img", { name: "카메라 최근 프레임" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "구역 그리기" })).getByText(
        "A동 크레인 하부 · 위험구역",
      ),
    ).toBeVisible();

    await user.click(within(editor).getByRole("button", { name: "새 구역" }));
    await user.type(within(editor).getByLabelText("구역 이름"), "자재 적치장");
    await user.selectOptions(within(editor).getByLabelText("구역 종류"), "적치구역");
    for (let i = 0; i < 4; i++) {
      await user.click(within(editor).getByRole("button", { name: "꼭짓점 추가" }));
    }
    await user.click(within(editor).getByRole("button", { name: "구역 저장" }));

    expect(
      await within(editor).findByText("구역을 저장했습니다. 다음 세션부터 적용됩니다."),
    ).toBeVisible();
    server.events.removeAllListeners("request:start");
    const created = z.object({ zones: z.array(z.object({ zoneId: z.guid() })) }).parse(bodies[0])
      .zones[1];
    expect(bodies).toEqual([
      {
        updatedAt: "2026-11-06T09:30:00Z",
        zones: [
          cameraZoneBody(),
          {
            zoneId: created?.zoneId,
            name: "자재 적치장",
            kind: "storage",
            polygon: [
              [0.5, 0.5],
              [0.6, 0.5],
              [0.6, 0.6],
              [0.5, 0.6],
            ],
          },
        ],
      },
    ]);
  });

  it("[SPEC-032 R-16] 최근 프레임이 없으면 빈 배경에 그린다", async () => {
    server.use(...cameraZoneHandlers());
    renderEditor(null);

    await screen.findByRole("region", { name: "위험구역 편집" });
    expect(screen.queryByRole("img", { name: "카메라 최근 프레임" })).not.toBeInTheDocument();
    expect(screen.getByText("최근 프레임이 없어 빈 배경에 그립니다.")).toBeVisible();
  });
});
