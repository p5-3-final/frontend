import type { RouteObject } from "react-router";
import { HOME_PATH } from "../../features/auth";

/**
 * 영상 분석·이벤트 화면(SPEC-005, SPEC-006, SPEC-031). 로그인한 레이아웃 안에 들어간다.
 * 화면 단위로 코드를 나눠 첫 화면에 필요한 코드만 받게 한다(react-style.md).
 */
export const ANALYSIS_ROUTES: RouteObject[] = [
  {
    path: HOME_PATH,
    lazy: async () => ({ Component: (await import("../../pages/AnalysisPage")).AnalysisPage }),
  },
  {
    path: `${HOME_PATH}/videos/:videoId`,
    lazy: async () => ({
      Component: (await import("../../pages/VideoDetailPage")).VideoDetailPage,
    }),
  },
  {
    path: "/events",
    lazy: async () => ({ Component: (await import("../../pages/EventsPage")).EventsPage }),
  },
];
