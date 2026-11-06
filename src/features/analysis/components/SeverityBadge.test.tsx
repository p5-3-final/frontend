import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeverityBadge } from "./SeverityBadge";

describe("SeverityBadge", () => {
  it.each([
    ["high", "높음"],
    ["medium", "보통"],
    ["low", "낮음"],
  ] as const)("[SPEC-031 R-18] severity %s를 색과 함께 글자 %s로도 보인다", (severity, name) => {
    render(<SeverityBadge severity={severity} />);
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByLabelText(`심각도 ${name}`)).toBeInTheDocument();
  });

  it("[SPEC-031 R-18] severity가 없으면 그리지 않는다", () => {
    const { container } = render(<SeverityBadge severity={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
