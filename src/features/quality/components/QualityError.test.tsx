import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { problem } from "../../../../mocks/handlers";
import { QUALITY_API, pageBody, reviewItemBody } from "../../../../mocks/quality";
import { renderQuality } from "../../../../tests/quality";

describe("QualityError", () => {
  it("[SPEC-035 R-20] 품질 API가 403이면 권한 없음 안내를 보이고 다시 시도 버튼은 두지 않는다", async () => {
    renderQuality("/quality/review", {
      extra: [http.get(`${QUALITY_API}/review-items`, () => problem(403, "QUALITY_FORBIDDEN"))],
    });

    expect(await screen.findByText("이 화면을 볼 권한이 없습니다.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
  });

  it("[SPEC-035 R-20] 5xx면 다시 시도 버튼을 보이고 누르면 다시 불러온다", async () => {
    let calls = 0;
    const { user } = renderQuality("/quality/review", {
      extra: [
        http.get(`${QUALITY_API}/review-items`, () => {
          calls++;
          return calls === 1
            ? problem(503, "QUALITY_UNAVAILABLE")
            : HttpResponse.json(pageBody([reviewItemBody()]));
        }),
      ],
    });

    expect(await screen.findByText("품질 정보를 불러오지 못했습니다.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("table", { name: "검토 항목" })).toBeVisible();
  });

  it("[SPEC-035 R-20] 네트워크 오류면 다시 시도 버튼을 보인다", async () => {
    renderQuality("/quality/review", {
      extra: [http.get(`${QUALITY_API}/review-items`, () => HttpResponse.error())],
    });

    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeVisible();
    expect(screen.getByText("품질 정보를 불러오지 못했습니다.")).toBeVisible();
  });
});
