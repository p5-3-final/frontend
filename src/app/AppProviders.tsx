import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SessionBootstrap } from "../features/auth";

export interface AppProvidersProps {
  children: ReactNode;
  /** 테스트에서 재시도를 끈 클라이언트를 넣을 때 쓴다. */
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [defaultClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient ?? defaultClient}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </QueryClientProvider>
  );
}
