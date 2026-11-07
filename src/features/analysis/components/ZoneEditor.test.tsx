import { fireEvent, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { ANALYSIS_API, analysisHandlers } from "../../../../mocks/analysis";
import { problem } from "../../../../mocks/handlers";
import { zoneBody } from "../../../../mocks/inspect";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { readyPlayer } from "../../../../tests/inspect";
import { server } from "../../../../tests/server";

const AISLE = zoneBody({
  zoneId: "0192f100-0000-7000-8000-0000000000f2",
  name: "B동 통로",
  kind: "aisle",
  polygon: [
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.3 },
  ],
});

async function openEditor(
  fixture: Parameters<typeof renderAnalysisDetail>[0] = analysisHandlers({
    inspect: { zones: [zoneBody(), AISLE] },
  }),
) {
  const view = renderAnalysisDetail(fixture);
  const video = await readyPlayer();
  const pause = vi.spyOn(video, "pause");
  await view.user.click(screen.getByRole("button", { name: "위험구역 편집" }));
  return { ...view, video, pause };
}

describe("ZoneEditor", () => {
  it("[SPEC-032 R-10] 구역 편집을 열면 영상을 멈추고 저장된 구역을 이름·종류와 함께 그린다", async () => {
    const { pause } = await openEditor();

    expect(pause).toHaveBeenCalled();
    const canvas = await screen.findByRole("group", { name: "구역 그리기" });
    expect(within(canvas).getByText("A동 크레인 하부 · 위험구역")).toBeVisible();
    expect(within(canvas).getByText("B동 통로 · 통로")).toBeVisible();
    const editor = screen.getByRole("region", { name: "위험구역 편집" });
    expect(
      within(within(editor).getByRole("list", { name: "구역 목록" })).getAllByRole("listitem"),
    ).toHaveLength(2);
    // 편집 중에는 클릭 조회 층을 숨긴다.
    expect(screen.queryByRole("button", { name: "누른 위치의 객체 조회" })).not.toBeInTheDocument();
  });
});

/** 표시 영역(800×450, 위 75px 빈 띠)의 (x, y) 비율 지점에 꼭짓점을 더한다. */
async function addVertexAt(user: UserEvent, x: number, y: number) {
  await user.pointer({
    keys: "[MouseLeft]",
    target: screen.getByRole("button", { name: "누른 위치에 꼭짓점 추가" }),
    coords: { clientX: x * 800, clientY: 75 + y * 450 },
  });
}

function editor() {
  return screen.getByRole("region", { name: "위험구역 편집" });
}

describe("ZoneEditor 편집 조작", () => {
  it("[SPEC-032 R-11] 새 구역을 만들고 영상 위를 눌러 꼭짓점을 더하고 이름·종류를 정한다", async () => {
    const { user } = await openEditor();

    await user.click(within(editor()).getByRole("button", { name: "새 구역" }));
    await user.type(within(editor()).getByLabelText("구역 이름"), "C동 하역장");
    await user.selectOptions(within(editor()).getByLabelText("구역 종류"), "통로");
    await addVertexAt(user, 0.1, 0.1);
    await addVertexAt(user, 0.3, 0.1);
    await addVertexAt(user, 0.3, 0.3);
    await addVertexAt(user, 0.1, 0.3);

    const canvas = screen.getByRole("group", { name: "구역 그리기" });
    expect(within(canvas).getByText("C동 하역장 · 통로")).toBeVisible();
    expect(within(canvas).getAllByRole("button", { name: /^꼭짓점 \d+$/ })).toHaveLength(4);
    expect(within(canvas).getByRole("button", { name: "꼭짓점 3" })).toHaveStyle({
      left: "30%",
      top: "30%",
    });
    expect(within(editor()).getByRole("button", { name: "구역 저장" })).toBeEnabled();
  });

  it("[SPEC-032 R-11] 꼭짓점이 2개이면 저장 버튼을 막고 이유를 보인다", async () => {
    const { user } = await openEditor();

    await user.click(within(editor()).getByRole("button", { name: "새 구역" }));
    await user.type(within(editor()).getByLabelText("구역 이름"), "C동");
    await addVertexAt(user, 0.1, 0.1);
    await addVertexAt(user, 0.3, 0.1);

    expect(within(editor()).getByRole("button", { name: "구역 저장" })).toBeDisabled();
    expect(within(editor()).getByRole("list", { name: "저장할 수 없는 이유" })).toHaveTextContent(
      "C동: 꼭짓점이 3개 이상이어야 합니다.",
    );
  });

  it("[SPEC-032 R-11] 꼭짓점을 끌어 옮기면 자기 교차를 이유로 저장을 막는다", async () => {
    await openEditor();
    const canvas = screen.getByRole("group", { name: "구역 그리기" });
    const first = within(canvas).getByRole("button", { name: "꼭짓점 1" });

    // (0.1, 0.5)를 오른쪽 변 너머 (0.6, 0.7)로 끌면 마지막 변이 오른쪽 변을 가로지른다.
    fireEvent.pointerDown(first, { pointerId: 1, clientX: 80, clientY: 300 });
    fireEvent.pointerMove(first, { pointerId: 1, clientX: 400, clientY: 75 + 0.7 * 450 });
    fireEvent.pointerMove(first, { pointerId: 1, clientX: 0.6 * 800, clientY: 75 + 0.7 * 450 });
    fireEvent.pointerUp(first, { pointerId: 1 });

    expect(within(canvas).getByRole("button", { name: "꼭짓점 1" })).toHaveStyle({
      left: "60%",
      top: "70%",
    });
    expect(within(editor()).getByRole("button", { name: "구역 저장" })).toBeDisabled();
    expect(within(editor()).getByRole("list", { name: "저장할 수 없는 이유" })).toHaveTextContent(
      "A동 크레인 하부: 변이 서로 교차합니다.",
    );
  });

  it("[SPEC-032 R-11] 키보드로 꼭짓점을 옮기고 지운다", async () => {
    const { user } = await openEditor();
    const canvas = screen.getByRole("group", { name: "구역 그리기" });

    within(canvas).getByRole("button", { name: "꼭짓점 2" }).focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Shift>}{ArrowLeft}{/Shift}");

    const second = within(canvas).getByRole("button", { name: "꼭짓점 2" });
    expect(Number.parseFloat(second.style.left)).toBeCloseTo(39.9);
    expect(Number.parseFloat(second.style.top)).toBeCloseTo(52);

    await user.keyboard("{Delete}");
    expect(within(canvas).getAllByRole("button", { name: /^꼭짓점 \d+$/ })).toHaveLength(3);
  });

  it("[SPEC-032 R-11] 구역을 지우면 목록과 그림에서 빠진다", async () => {
    const { user } = await openEditor();

    await user.click(within(editor()).getByRole("button", { name: "구역 지우기" }));

    const list = within(editor()).getByRole("list", { name: "구역 목록" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("A동 크레인 하부 · 위험구역")).not.toBeInTheDocument();
  });
});

describe("ZoneEditor 저장", () => {
  it("[SPEC-032 R-12] 저장하면 구역 목록 전체를 보내고 다음 분석부터 반영된다고 안내한다", async () => {
    let sent: unknown;
    const { user } = await openEditor(analysisHandlers({ inspect: { zones: [zoneBody()] } }));
    server.events.on("request:start", ({ request }) => {
      if (request.method === "PUT") {
        void request
          .clone()
          .json()
          .then((body: unknown) => {
            // 화면 좌표를 나눈 값이라 소수 끝자리 오차를 없애고 비교한다.
            sent = JSON.parse(
              JSON.stringify(body, (_key, value: unknown) =>
                typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value,
              ),
            );
          });
      }
    });

    await user.click(within(editor()).getByRole("button", { name: "새 구역" }));
    await user.type(within(editor()).getByLabelText("구역 이름"), "C동 하역장");
    await addVertexAt(user, 0.5, 0.1);
    await addVertexAt(user, 0.7, 0.1);
    await addVertexAt(user, 0.7, 0.3);
    await addVertexAt(user, 0.5, 0.3);
    await user.click(within(editor()).getByRole("button", { name: "구역 저장" }));

    expect(
      await within(editor()).findByText(
        "구역을 저장했습니다. 다음 분석부터 반영됩니다(재분석 필요).",
      ),
    ).toBeVisible();
    server.events.removeAllListeners("request:start");
    expect(sent).toEqual({
      items: [
        zoneBody(),
        {
          zoneId: null,
          name: "C동 하역장",
          kind: "hazard",
          polygon: [
            { x: 0.5, y: 0.1 },
            { x: 0.7, y: 0.1 },
            { x: 0.7, y: 0.3 },
            { x: 0.5, y: 0.3 },
          ],
        },
      ],
    });
  });

  it("[SPEC-032 R-12] 서버가 400 ANALYSIS_ZONE_INVALID를 돌려주면 서버의 이유를 보인다", async () => {
    const { user } = await openEditor([
      http.put(`${ANALYSIS_API}/sources/:sourceId/zones`, () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Bad Request",
            status: 400,
            code: "ANALYSIS_ZONE_INVALID",
            detail: "A동 크레인 하부 구역이 다른 구역과 겹칩니다.",
          },
          { status: 400 },
        ),
      ),
      ...analysisHandlers(),
    ]);

    await user.click(within(editor()).getByRole("button", { name: "구역 저장" }));

    expect(
      await within(editor()).findByText("A동 크레인 하부 구역이 다른 구역과 겹칩니다."),
    ).toBeVisible();
  });

  it("[SPEC-032 R-12] 서버가 403을 돌려주면 권한이 없다고 안내한다", async () => {
    const { user } = await openEditor([
      http.put(`${ANALYSIS_API}/sources/:sourceId/zones`, () => problem(403, "ANALYSIS_FORBIDDEN")),
      ...analysisHandlers(),
    ]);

    await user.click(within(editor()).getByRole("button", { name: "구역 저장" }));

    expect(
      await within(editor()).findByText("이 영상의 구역을 바꿀 권한이 없습니다."),
    ).toBeVisible();
  });
});
