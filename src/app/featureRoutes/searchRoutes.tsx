import type { RouteObject } from "react-router";

/** 사이드바 "검색" 화면(SPEC-033). 화면 단위로 코드를 나눠 첫 화면에 필요한 코드만 받게 한다. */
export const SEARCH_ROUTES: RouteObject[] = [
  {
    path: "/search",
    lazy: async () => ({ Component: (await import("../../pages/SearchPage")).SearchPage }),
  },
];
