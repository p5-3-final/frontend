import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SessionBootstrap } from "../features/auth";
import { startNotifications } from "../features/notifications";
import { onVideosChanged, useLeaveWarning, videoQueryKeys } from "../features/upload";

export interface AppProvidersProps {
  children: ReactNode;
  /** 테스트에서 재시도를 끈 클라이언트를 넣을 때 쓴다. */
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [defaultClient] = useState(() => new QueryClient());
  const client = queryClient ?? defaultClient;

  // 업로드 대기열은 React 밖에 있어서, 업로드를 마치거나 취소로 영상을 지우면 여기서 목록 query를 무효화한다(SPEC-005 R-7, R-12).
  useEffect(
    () =>
      onVideosChanged(() => {
        void client.invalidateQueries({ queryKey: videoQueryKeys.all });
      }),
    [client],
  );

  // 알림 연결은 로그인 세션을 따라 탭에 하나만 열린다(SPEC-031 R-12, NFR-2). 화면은 구독만 한다.
  useEffect(() => {
    startNotifications();
  }, []);

  // 업로드는 어느 화면에 있든 이어지므로 경고도 앱 전체에 건다(SPEC-005 R-14).
  useLeaveWarning();

  return (
    <QueryClientProvider client={client}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </QueryClientProvider>
  );
}
