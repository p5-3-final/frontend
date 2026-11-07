import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { datasetImportBody } from "../../../../../mocks/quality";
import { recordRequests } from "../../../../../tests/analysisDetail";
import { renderQuality } from "../../../../../tests/quality";

function listRequests(requests: URL[]) {
  return requests.filter((url) => url.pathname === "/api/v1/quality/dataset-imports").length;
}

describe("DatasetImports", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("[SPEC-035 R-17] 진행 중인 가져오기가 있으면 5초마다 다시 불러오고 끝나면 멈춘다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const recorder = recordRequests();
    renderQuality("/quality/datasets", {
      // advanceOnRead: 읽을 때마다 한 단계 넘어가므로 첫 목록은 등록 중, 다음 목록은 완료다.
      fixture: { imports: [datasetImportBody({ status: "VALIDATING" })], advanceOnRead: true },
    });
    const table = await screen.findByRole("table", { name: "가져오기 목록" });
    await within(table).findByText("등록 중");
    const first = listRequests(recorder.requests);

    await vi.advanceTimersByTimeAsync(5000);
    expect(await within(table).findByText("완료")).toBeVisible();
    const afterDone = listRequests(recorder.requests);
    expect(afterDone).toBe(first + 1);

    await vi.advanceTimersByTimeAsync(15000);
    expect(listRequests(recorder.requests)).toBe(afterDone);
    recorder.stop();
  });

  it("[SPEC-035 R-17] 진행 중인 가져오기가 없으면 다시 불러오지 않는다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const recorder = recordRequests();
    renderQuality("/quality/datasets");
    await screen.findByRole("table", { name: "가져오기 목록" });
    const first = listRequests(recorder.requests);

    await vi.advanceTimersByTimeAsync(10000);

    expect(listRequests(recorder.requests)).toBe(first);
    recorder.stop();
  });
});
