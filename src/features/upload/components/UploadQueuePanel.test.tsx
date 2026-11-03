import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mediaHandlers } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { addFiles } from "../model/uploadQueue";
import { UploadQueuePanel } from "./UploadQueuePanel";

const fileOf = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe("UploadQueuePanel", () => {
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
});
