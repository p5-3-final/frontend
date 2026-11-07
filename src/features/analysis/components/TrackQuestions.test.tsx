import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ANALYSIS_API, ANALYSIS_SOURCE_ID, analysisHandlers } from "../../../../mocks/analysis";
import { problem } from "../../../../mocks/handlers";
import {
  INSPECT_TRACK_ID,
  inspectResultBody,
  QUESTION_REQUEST_ID,
  questionResultBody,
  trackBody,
  type QuestionResultBody,
} from "../../../../mocks/inspect";
import { trackAnalyzedBody } from "../../../../mocks/notifications";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { clickFrame, readyPlayer, renderWithNotifications } from "../../../../tests/inspect";
import { server } from "../../../../tests/server";

const QUESTION = "이 사람이 들고 있는 것은 무엇인가요?";

function readyTrackHandlers(
  extra: Parameters<typeof server.use> = [],
  question?: QuestionResultBody,
) {
  return [
    ...extra,
    ...analysisHandlers({
      inspect: { inspect: inspectResultBody({ track: trackBody() }), question },
    }),
  ];
}

async function openPanel(view: Pick<ReturnType<typeof renderAnalysisDetail>, "user">) {
  await readyPlayer();
  await clickFrame(view.user);
  return screen.findByRole("region", { name: "트랙 정보" });
}

describe("TrackQuestions", () => {
  it('[SPEC-032 R-7] 질문을 현재 시각과 함께 보내고 "답을 기다리는 중"으로 이력에 넣는다', async () => {
    let sent: unknown;
    const view = renderAnalysisDetail(
      readyTrackHandlers([
        http.post(`${ANALYSIS_API}/tracks/:trackId/ask`, async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json(
            { requestId: "0192f210-0000-7000-8000-000000000002", status: "REQUESTED" },
            { status: 202 },
          );
        }),
      ]),
    );
    const panel = await openPanel(view);

    await view.user.type(within(panel).getByLabelText("객체에 질문"), QUESTION);
    await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));

    const history = await within(panel).findByRole("list", { name: "질문 이력" });
    const item = within(history).getByRole("listitem");
    expect(item).toHaveTextContent(QUESTION);
    expect(item).toHaveTextContent("답을 기다리는 중");
    expect(sent).toEqual({ question: QUESTION, tMs: 41000 });
    expect(within(panel).getByLabelText("객체에 질문")).toHaveValue("");
  });

  it("[SPEC-032 R-7] 빈 질문이나 200자를 넘는 질문은 보내지 않는다", async () => {
    const view = renderAnalysisDetail(readyTrackHandlers());
    const panel = await openPanel(view);

    await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));
    expect(await within(panel).findByText("질문을 입력해 주세요.")).toBeVisible();

    await view.user.click(within(panel).getByLabelText("객체에 질문"));
    await view.user.paste("가".repeat(201));
    await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));
    expect(await within(panel).findByText("질문은 200자 이하로 입력해 주세요.")).toBeVisible();
    expect(within(panel).queryByRole("list", { name: "질문 이력" })).not.toBeInTheDocument();
  });
});

function answered(outcome = "READY") {
  return trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
    requestId: QUESTION_REQUEST_ID,
    trackId: INSPECT_TRACK_ID,
    reason: "question",
    outcome,
  });
}

async function askOnPanel(
  question?: QuestionResultBody,
  extra: Parameters<typeof server.use> = [],
) {
  const view = await renderWithNotifications(readyTrackHandlers(extra, question));
  const panel = await openPanel(view);
  await view.user.type(within(panel).getByLabelText("객체에 질문"), QUESTION);
  await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));
  return { ...view, panel };
}

describe("TrackQuestions 답 받기", () => {
  it("[SPEC-032 R-8] 그 질문의 track.analyzed(question)가 오면 답과 판정 상태를 보인다", async () => {
    const { panel, connection } = await askOnPanel();
    await within(panel).findByText("답을 기다리는 중");

    connection.send(answered());

    const item = await within(panel).findByText("철근 묶음을 들고 있습니다.");
    expect(item).toBeVisible();
    expect(within(panel).getByRole("list", { name: "질문 이력" })).toHaveTextContent("확인됨");
    expect(within(panel).queryByText("답을 기다리는 중")).not.toBeInTheDocument();
  });

  it('[SPEC-032 R-8] 모델이 답할 수 없다고 하면 "화면만으로는 답할 수 없음"을 보인다', async () => {
    const { panel, connection } = await askOnPanel(
      questionResultBody({
        answer: {
          verificationStatus: "confirmed",
          answerable: false,
          answer: "손이 가려져 있습니다.",
        },
      }),
    );
    await within(panel).findByText("답을 기다리는 중");

    connection.send(answered());

    expect(await within(panel).findByText("화면만으로는 답할 수 없습니다.")).toBeVisible();
  });

  it("[SPEC-032 R-8] 알림 결과가 FAILED이거나 질문 결과가 FAILED면 실패 안내를 보인다", async () => {
    const first = await askOnPanel();
    await within(first.panel).findByText("답을 기다리는 중");

    first.connection.send(answered("FAILED"));

    expect(await within(first.panel).findByText("답을 만들지 못했습니다.")).toBeVisible();
  });

  it("[SPEC-032 R-8] 질문 결과의 status가 FAILED면 실패 안내를 보인다", async () => {
    const { panel, connection } = await askOnPanel(
      questionResultBody({ status: "FAILED", answer: null }),
    );
    await within(panel).findByText("답을 기다리는 중");

    connection.send(answered());

    expect(await within(panel).findByText("답을 만들지 못했습니다.")).toBeVisible();
  });

  it("[SPEC-032 R-8] 알림이 질문 접수 응답보다 먼저 와도 답을 보인다", async () => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const view = await renderWithNotifications(
      readyTrackHandlers([
        http.post(`${ANALYSIS_API}/tracks/:trackId/ask`, async () => {
          await held;
          return HttpResponse.json(
            { requestId: QUESTION_REQUEST_ID, status: "REQUESTED" },
            { status: 202 },
          );
        }),
      ]),
    );
    const panel = await openPanel(view);
    await view.user.type(within(panel).getByLabelText("객체에 질문"), QUESTION);
    await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));

    view.connection.send(answered());
    await new Promise((resolve) => setTimeout(resolve, 50));
    release();

    expect(await within(panel).findByText("철근 묶음을 들고 있습니다.")).toBeVisible();
  });
});

describe("TrackQuestions 질문 수 상한", () => {
  it("[SPEC-032 R-9] 429면 이력에 넣지 않고 잠시 뒤 다시 하라고 안내한다", async () => {
    const view = renderAnalysisDetail(
      readyTrackHandlers([
        http.post(`${ANALYSIS_API}/tracks/:trackId/ask`, () =>
          problem(429, "ANALYSIS_QUESTION_RATE_LIMITED"),
        ),
      ]),
    );
    const panel = await openPanel(view);

    await view.user.type(within(panel).getByLabelText("객체에 질문"), QUESTION);
    await view.user.click(within(panel).getByRole("button", { name: "질문 보내기" }));

    expect(
      await within(panel).findByText("질문이 많습니다. 잠시 뒤 다시 해 주세요."),
    ).toBeVisible();
    expect(within(panel).queryByRole("list", { name: "질문 이력" })).not.toBeInTheDocument();
    // 다시 보낼 수 있게 입력은 지우지 않는다.
    expect(within(panel).getByLabelText("객체에 질문")).toHaveValue(QUESTION);
  });
});
