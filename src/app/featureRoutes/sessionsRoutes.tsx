import type { RouteObject } from "react-router";

/** 분석 이력(작업 세션) 화면(SPEC-034 R-1~R-8). 화면 단위로 코드를 나눈다(react-style.md). */
export const SESSIONS_ROUTES: RouteObject[] = [
  {
    path: "/history",
    lazy: async () => ({ Component: (await import("../../pages/HistoryPage")).HistoryPage }),
  },
  {
    path: "/history/sessions/:sessionId",
    lazy: async () => ({
      Component: (await import("../../pages/SessionDetailPage")).SessionDetailPage,
    }),
  },
];
