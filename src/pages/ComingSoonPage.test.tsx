import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComingSoonPage } from "./ComingSoonPage";

describe("ComingSoonPage", () => {
  // SPEC-031~035로 사이드바 메뉴가 모두 화면을 갖게 되어 경로로 띄울 준비 중 메뉴가 없다.
  // 메뉴가 새로 생기면 routes.tsx가 이 화면을 쓰므로 화면 자체를 검증한다.
  it("[SPEC-002 R-15] 메뉴 이름과 준비 중이라는 안내를 보여 준다", () => {
    render(<ComingSoonPage title="새 메뉴" />);

    expect(screen.getByRole("heading", { name: "새 메뉴" })).toBeInTheDocument();
    expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
  });
});
