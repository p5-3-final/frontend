import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { handlers, TEST_USER } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";
import { useHasRole } from "./useHasRole";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useHasRole", () => {
  it("[SPEC-031 R-7] 내 정보의 역할에 OPERATOR가 있으면 참이다", async () => {
    server.use(handlers.me({ ...TEST_USER, roles: ["USER", "OPERATOR"] }));
    startSession("access-1");
    const { result } = renderHook(() => useHasRole("OPERATOR"), { wrapper });
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("[SPEC-031 R-7] 역할이 없거나 내 정보를 아직 모르면 거짓이다", async () => {
    server.use(handlers.me(TEST_USER));
    startSession("access-1");
    const { result } = renderHook(() => useHasRole("OPERATOR"), { wrapper });
    expect(result.current).toBe(false);
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
