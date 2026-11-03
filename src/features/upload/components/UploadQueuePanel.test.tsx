import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { MEDIA_API, mediaHandlers, STORAGE, storageResponse } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { addFiles, setRetryDelaysForTest } from "../model/uploadQueue";
import { UploadQueuePanel } from "./UploadQueuePanel";

const fileOf = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe("UploadQueuePanel", () => {
  beforeEach(() => {
    setRetryDelaysForTest([0, 0, 0]);
  });

  it("[SPEC-005 R-8] 올리는 파일의 진행률을 퍼센트로 보여 주고 기다리는 파일은 대기 중으로 보여 준다", async () => {
    server.use(...mediaHandlers({ storageGate: new Promise(() => {}) }));
    render(<UploadQueuePanel />);

    addFiles([fileOf("a.mp4"), fileOf("b.mov")]);

    const progress = await screen.findByRole("progressbar", { name: "a.mp4 업로드 진행률" });
    expect(progress).toHaveAttribute("aria-valuenow", "0");
    const waiting = screen.getAllByRole("listitem")[1];
    expect(waiting).toBeDefined();
    expect(within(waiting ?? document.body).getByText("대기 중")).toBeVisible();
  });

  it("[SPEC-005 R-7] 다 올린 파일은 업로드 완료로 바뀌고 진행률 막대가 사라진다", async () => {
    server.use(...mediaHandlers());
    render(<UploadQueuePanel />);

    addFiles([fileOf("a.mp4")]);

    expect(await screen.findByText("업로드 완료")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("[SPEC-005 R-8] 대기열이 비어 있으면 아무것도 보여 주지 않는다", () => {
    const { container } = render(<UploadQueuePanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it("[SPEC-005 R-10] 실패한 파일은 이유와 다시 시도 버튼을 보여 준다", async () => {
    server.use(
      http.post(`${STORAGE}/`, () => storageResponse(503)),
      ...mediaHandlers(),
    );
    render(<UploadQueuePanel />);

    addFiles([fileOf("a.mp4")]);

    expect(
      await screen.findByText("파일을 저장소에 올리지 못했습니다. 다시 시도해 주세요."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "a.mp4 다시 시도" })).toBeVisible();
  });

  it("[SPEC-005 R-11] 다시 시도를 누르면 처음부터 올려 완료한다", async () => {
    let storageCalls = 0;
    server.use(
      http.post(`${STORAGE}/`, () => {
        storageCalls++;
        return storageCalls <= 4 ? storageResponse(503) : storageResponse(204);
      }),
      ...mediaHandlers(),
    );
    const user = userEvent.setup();
    render(<UploadQueuePanel />);
    addFiles([fileOf("a.mp4")]);

    await user.click(await screen.findByRole("button", { name: "a.mp4 다시 시도" }));

    expect(await screen.findByText("업로드 완료")).toBeVisible();
  });

  it("[SPEC-005 R-12] 올리고 있는 파일의 취소를 누르면 대기열에서 사라진다", async () => {
    server.use(
      http.delete(`${MEDIA_API}/:id`, () => new HttpResponse(null, { status: 204 })),
      ...mediaHandlers({ storageGate: new Promise(() => {}) }),
    );
    const user = userEvent.setup();
    render(<UploadQueuePanel />);
    addFiles([fileOf("a.mp4"), fileOf("b.mp4")]);

    await user.click(await screen.findByRole("button", { name: "a.mp4 업로드 취소" }));

    expect(screen.queryByText("a.mp4")).not.toBeInTheDocument();
    expect(screen.getByText("b.mp4")).toBeVisible();
  });

  it("[SPEC-005 R-10] 끝난 파일은 닫기로 대기열 표시에서 뺀다", async () => {
    server.use(...mediaHandlers());
    const user = userEvent.setup();
    render(<UploadQueuePanel />);
    addFiles([fileOf("a.gif")]);

    await user.click(await screen.findByRole("button", { name: "a.gif 닫기" }));

    expect(screen.queryByRole("list", { name: "업로드 대기열" })).not.toBeInTheDocument();
  });

  it("[SPEC-005 NFR-5] 업로드가 끝나거나 실패하면 화면 낭독기가 읽는 상태 영역에 알린다", async () => {
    let storageCalls = 0;
    server.use(
      http.post(`${STORAGE}/`, () => {
        storageCalls++;
        return storageCalls <= 4 ? storageResponse(503) : storageResponse(204);
      }),
      ...mediaHandlers(),
    );
    render(<UploadQueuePanel />);

    addFiles([fileOf("a.mp4")]);
    // 상태 영역은 대기열이 생길 때 비어 있는 채로 먼저 나타나고, 끝난 뒤에 문구가 채워진다.
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("a.mp4 업로드 실패");
    });

    addFiles([fileOf("b.mp4")]);
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("b.mp4 업로드 완료");
    });
  });
});
