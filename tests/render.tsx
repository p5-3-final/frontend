import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "../src/app/AppProviders";
import { routes } from "../src/app/routes";

/** 앱의 실제 라우트로 path 화면을 그린다. 화면 이동까지 포함한 흐름을 검증할 때 쓴다. */
export function renderRoute(path: string, state?: unknown) {
  // path에 쿼리(?event=…)를 붙여 열 수 있게 경로와 쿼리를 나눠 넘긴다.
  const url = new URL(path, "http://localhost");
  const router = createMemoryRouter(routes, {
    initialEntries: [{ pathname: url.pathname, search: url.search, state }],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user = userEvent.setup();
  // 실제 앱(main.tsx)처럼 StrictMode로 감싸 효과가 두 번 실행되는 상황까지 확인한다.
  render(
    <StrictMode>
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
  return { router, user, queryClient };
}
