import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../../../tests/server";
import { SignUpForm } from "./SignUpForm";

const SIGNUP_URL = "http://localhost:8080/api/v1/auth/signup";

function renderForm(onSignedUp = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SignUpForm onSignedUp={onSignedUp} />
    </QueryClientProvider>,
  );
  return { onSignedUp };
}

async function fillAndSubmit(values: { email: string; password: string; nickname: string }) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("이메일"), values.email);
  await user.type(screen.getByLabelText("비밀번호"), values.password);
  await user.type(screen.getByLabelText("닉네임"), values.nickname);
  await user.click(screen.getByRole("button", { name: "가입하기" }));
}

describe("SignUpForm", () => {
  it("[SPEC-002 R-2] 입력 규칙에 맞지 않으면 요청하지 않고 틀린 칸 옆에 이유를 표시한다", async () => {
    let requested = false;
    server.use(
      http.post(SIGNUP_URL, () => {
        requested = true;
        return new HttpResponse(null, { status: 201 });
      }),
    );
    renderForm();

    await fillAndSubmit({ email: "not-an-email", password: "short", nickname: "가" });

    expect(await screen.findByLabelText("이메일")).toHaveAccessibleDescription(
      "올바른 이메일 주소를 입력해 주세요.",
    );
    expect(screen.getByLabelText("비밀번호")).toHaveAccessibleDescription(
      "비밀번호는 8~64자이고 영문과 숫자를 모두 포함해야 합니다.",
    );
    expect(screen.getByLabelText("닉네임")).toHaveAccessibleDescription(
      "닉네임은 2~20자의 한글, 영문, 숫자만 쓸 수 있습니다.",
    );
    expect(screen.getByLabelText("이메일")).toHaveAttribute("aria-invalid", "true");
    expect(requested).toBe(false);
  });

  it("[SPEC-002 R-3] 이미 가입된 이메일이면 이메일 칸에 안내를 표시한다", async () => {
    server.use(
      http.post(SIGNUP_URL, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Conflict", status: 409, code: "AUTH_EMAIL_DUPLICATED" },
          { status: 409 },
        ),
      ),
    );
    const { onSignedUp } = renderForm();

    await fillAndSubmit({ email: "user@example.com", password: "secret123", nickname: "테스터" });

    expect(await screen.findByText("이미 가입된 이메일입니다.")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toHaveAccessibleDescription(
      "이미 가입된 이메일입니다.",
    );
    expect(onSignedUp).not.toHaveBeenCalled();
  });

  it("[SPEC-002 NFR-3] 그 밖의 오류는 폼 위에 code에 맞는 문구를 표시한다", async () => {
    server.use(
      http.post(SIGNUP_URL, () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Too Many Requests",
            status: 429,
            code: "GATEWAY_RATE_LIMITED",
          },
          { status: 429 },
        ),
      ),
    );
    renderForm();

    await fillAndSubmit({ email: "user@example.com", password: "secret123", nickname: "테스터" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});
