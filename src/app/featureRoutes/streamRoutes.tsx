import type { RouteObject } from "react-router";

/** 실시간 세션 화면(SPEC-031 R-19). 카메라 화면(SPEC-034)에서 세션을 열면 이 주소로 온다. */
export const STREAM_ROUTES: RouteObject[] = [
  {
    path: "/stream/sessions/:sessionId",
    lazy: async () => ({
      Component: (await import("../../pages/StreamSessionPage")).StreamSessionPage,
    }),
  },
];
