import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SessionBootstrap } from "../features/auth";
import { onVideoUploaded, videoQueryKeys } from "../features/upload";

export interface AppProvidersProps {
  children: ReactNode;
  /** 테스트에서 재시도를 끈 클라이언트를 넣을 때 쓴다. */
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [defaultClient] = useState(() => new QueryClient());
  const client = queryClient ?? defaultClient;

  // 업로드 대기열은 React 밖에 있어서, 업로드를 마치면 여기서 목록 query를 무효화한다(SPEC-005 R-7).
  useEffect(
    () =>
      onVideoUploaded(() => {
        void client.invalidateQueries({ queryKey: videoQueryKeys.all });
      }),
    [client],
  );

  return (
    <QueryClientProvider client={client}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </QueryClientProvider>
  );
}
