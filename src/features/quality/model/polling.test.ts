import { describe, expect, it } from "vitest";
import {
  POLL_INTERVAL_MS,
  exportPollInterval,
  importsPollInterval,
  isImportActive,
} from "./polling";

describe("polling", () => {
  it("[SPEC-035 R-17] PENDING·VALIDATING·REGISTERING 가져오기만 진행 중이다", () => {
    expect(isImportActive("PENDING")).toBe(true);
    expect(isImportActive("VALIDATING")).toBe(true);
    expect(isImportActive("REGISTERING")).toBe(true);
    expect(isImportActive("COMPLETED")).toBe(false);
    expect(isImportActive("FAILED")).toBe(false);
  });

  it("[SPEC-035 R-17] 진행 중인 항목이 있을 때만 5초 간격을 돌려준다", () => {
    expect(POLL_INTERVAL_MS).toBe(5000);
    expect(importsPollInterval([{ status: "COMPLETED" }, { status: "VALIDATING" }])).toBe(5000);
    expect(importsPollInterval([{ status: "COMPLETED" }, { status: "FAILED" }])).toBe(false);
    expect(importsPollInterval(undefined)).toBe(false);
    expect(exportPollInterval({ status: "RUNNING" })).toBe(5000);
    expect(exportPollInterval({ status: "PENDING" })).toBe(5000);
    expect(exportPollInterval({ status: "COMPLETED" })).toBe(false);
  });
});
