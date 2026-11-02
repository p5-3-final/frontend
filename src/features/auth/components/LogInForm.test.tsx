import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { handlers } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { endSession } from "../../../shared/api/session";

async function logInWith(password: string) {
  endSession();
  const { user } = renderRoute("/login");
  await user.type(await screen.findByLabelText("이메일"), "user@example.com");
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.click(screen.getByRole("button", { name: "로그인" }));
}

describe("LogInForm", () => {
  it("[SPEC-002 R-5] 이메일이나 비밀번호가 틀리면 어느 쪽인지 구분하지 않는 안내를 표시한다", async () => {
    server.use(handlers.logInFails(401, "AUTH_INVALID_CREDENTIALS"));

    await logInWith("wrong1234");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
    expect(screen.getByLabelText("이메일")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("비밀번호")).not.toHaveAttribute("aria-invalid");
  });

  it.each([
    [423, "AUTH_ACCOUNT_LOCKED", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."],
    [429, "GATEWAY_RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."],
  ])(
    "[SPEC-002 R-6] %s %s이면 잠시 후 다시 시도하라는 안내를 표시한다",
    async (status, code, message) => {
      server.use(handlers.logInFails(status, code));

      await logInWith("secret123");

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
    },
  );

  it("[SPEC-002 R-2] 이메일이나 비밀번호를 비우면 요청하지 않고 칸 옆에 이유를 표시한다", async () => {
    endSession();
    const { user } = renderRoute("/login");

    await user.click(await screen.findByRole("button", { name: "로그인" }));

    expect(screen.getByLabelText("이메일")).toHaveAccessibleDescription(
      "올바른 이메일 주소를 입력해 주세요.",
    );
    expect(screen.getByLabelText("비밀번호")).toHaveAccessibleDescription(
      "비밀번호를 입력해 주세요.",
    );
  });
});
