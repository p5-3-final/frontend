import { describe, expect, it } from "vitest";
import { checkVideoFile, MAX_VIDEO_SIZE_BYTES } from "./fileRules";

const file = (name: string, size = 1000) => ({ name, size });

describe("checkVideoFile", () => {
  it.each([
    ["a.mp4", "video/mp4"],
    ["a.mov", "video/quicktime"],
    ["a.mkv", "video/x-matroska"],
    ["a.avi", "video/x-msvideo"],
    ["CLIP.MP4", "video/mp4"],
    ["my.video.Mov", "video/quicktime"],
  ])("[SPEC-005 R-2] %s는 확장자로 형식(%s)을 정한다", (name, contentType) => {
    expect(checkVideoFile(file(name))).toEqual({ ok: true, contentType });
  });

  it.each(["a.gif", "a.webm", "mp4", "a.mp4.exe", "a."])(
    "[SPEC-005 R-2] %s는 지원하지 않는 형식이다",
    (name) => {
      expect(checkVideoFile(file(name))).toMatchObject({
        ok: false,
        message: "mp4, mov, mkv, avi 영상만 올릴 수 있습니다.",
      });
    },
  );

  it.each([0, MAX_VIDEO_SIZE_BYTES + 1])("[SPEC-005 R-3] 크기 %d바이트는 올릴 수 없다", (size) => {
    expect(checkVideoFile(file("a.mp4", size))).toMatchObject({
      ok: false,
      message: "파일 크기는 1바이트 이상 5GB 이하여야 합니다.",
    });
  });

  it("[SPEC-005 R-3] 1바이트와 정확히 5GB는 올릴 수 있다", () => {
    expect(checkVideoFile(file("a.mp4", 1)).ok).toBe(true);
    expect(checkVideoFile(file("a.mp4", MAX_VIDEO_SIZE_BYTES)).ok).toBe(true);
  });
});
