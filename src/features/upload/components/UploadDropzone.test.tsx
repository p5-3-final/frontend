import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mediaHandlers } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { UploadButton } from "./UploadButton";
import { UploadDropzone } from "./UploadDropzone";
import { UploadQueuePanel } from "./UploadQueuePanel";

const fileOf = (name: string, size = 10) => new File([new Uint8Array(size)], name);

// 파일 고르기 창의 accept를 무시하는 드래그·"모든 파일" 선택까지 확인하려고 applyAccept를 끌 수 있게 한다.
function setUpUploader(applyAccept = true) {
  render(
    <UploadDropzone>
      <UploadButton />
      <UploadQueuePanel />
    </UploadDropzone>,
  );
  return userEvent.setup({ applyAccept });
}

function queuedNames() {
  const queue = screen.getByRole("list", { name: "업로드 대기열" });
  return within(queue)
    .getAllByRole("listitem")
    .map((item) => within(item).getByTestId("upload-file-name").textContent);
}

describe("UploadDropzone", () => {
  it("[SPEC-005 R-1] 업로드 버튼으로 고른 파일을 고른 순서대로 대기열에 보여 준다", async () => {
    server.use(...mediaHandlers({ storageGate: new Promise(() => {}) }));
    const user = setUpUploader();

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [
      fileOf("a.mp4"),
      fileOf("b.mov"),
    ]);

    expect(queuedNames()).toEqual(["a.mp4", "b.mov"]);
  });

  it("[SPEC-005 R-1] 끌어다 놓은 파일도 대기열에 넣는다", () => {
    server.use(...mediaHandlers({ storageGate: new Promise(() => {}) }));
    setUpUploader();

    fireEvent.drop(screen.getByRole("region", { name: "영상 업로드 영역" }), {
      dataTransfer: { files: [fileOf("c.mkv")] },
    });

    expect(queuedNames()).toEqual(["c.mkv"]);
  });

  it("[SPEC-005 R-2] 지원하지 않는 형식의 파일은 그 파일 옆에 이유를 보여 준다", async () => {
    server.use(...mediaHandlers());
    const user = setUpUploader(false);

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [fileOf("a.gif")]);

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("mp4, mov, mkv, avi 영상만 올릴 수 있습니다.")).toBeVisible();
  });

  it("[SPEC-005 R-3] 크기가 0인 파일은 그 파일 옆에 크기 제한을 보여 준다", async () => {
    server.use(...mediaHandlers());
    const user = setUpUploader();

    await user.upload(screen.getByLabelText("영상 파일 고르기"), [fileOf("a.mp4", 0)]);

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("파일 크기는 1바이트 이상 5GB 이하여야 합니다.")).toBeVisible();
  });
});
