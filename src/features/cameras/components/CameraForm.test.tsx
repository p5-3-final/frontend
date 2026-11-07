import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { STREAM_API } from "../../../../mocks/stream";
import { renderCameras } from "../../../../tests/cameras";

async function openForm(extra: Parameters<typeof renderCameras>[1] = []) {
  const view = renderCameras("/history/cameras", extra, { cameras: [] });
  await screen.findByText("등록한 카메라가 없습니다.");
  const [headerButton] = screen.getAllByRole("button", { name: "카메라 등록" });
  await view.user.click(headerButton ?? document.body);
  return { ...view, form: await screen.findByRole("form", { name: "카메라 등록" }) };
}

describe("CameraForm", () => {
  it("[SPEC-034 R-13] 이름·RTSP 비밀값 참조 이름·프로필로 카메라를 등록하고 목록에 보인다", async () => {
    let body: unknown;
    const { user, form } = await openForm([
      http.post(`${STREAM_API}/cameras`, async ({ request }) => {
        body = await request.clone().json();
        return undefined;
      }),
    ]);

    await user.type(within(form).getByLabelText("카메라 이름"), "A동 크레인");
    await user.type(
      within(form).getByLabelText("RTSP 비밀값 참조 이름"),
      "cameras/a-dong-crane/rtsp",
    );
    expect(within(form).getByLabelText("수집 프로필")).toHaveValue("ingest-default@1");
    await user.click(within(form).getByRole("button", { name: "등록" }));

    const list = await screen.findByRole("list", { name: "카메라" });
    expect(within(list).getByRole("link", { name: "A동 크레인" })).toBeVisible();
    expect(body).toEqual({
      name: "A동 크레인",
      rtspSecretRef: "cameras/a-dong-crane/rtsp",
      profileVersion: "ingest-default@1",
    });
  });

  it("[SPEC-034 R-13] RTSP 주소 자체를 넣으면 등록하지 않고 비밀값 참조 이름을 넣으라고 알린다", async () => {
    let created = 0;
    const { user, form } = await openForm([
      http.post(`${STREAM_API}/cameras`, () => {
        created++;
        return undefined;
      }),
    ]);

    await user.type(within(form).getByLabelText("카메라 이름"), "A동 크레인");
    await user.type(
      within(form).getByLabelText("RTSP 비밀값 참조 이름"),
      "rtsp://admin:pw@10.0.0.1/stream",
    );
    await user.click(within(form).getByRole("button", { name: "등록" }));

    expect(
      await within(form).findByText("주소가 아니라 Secrets Manager 키 이름을 입력해 주세요."),
    ).toBeVisible();
    expect(created).toBe(0);
  });
});
