import { describe, expect, it } from "vitest";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [1000, "1000 B"],
    [1536, "1.5 KB"],
    [104_857_600, "100 MB"],
    [110_000_000, "104.9 MB"],
    [5_368_709_120, "5 GB"],
  ])("[SPEC-005 R-15] %d바이트는 %s로 보여 준다", (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text);
  });
});
