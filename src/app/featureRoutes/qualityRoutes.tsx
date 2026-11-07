import { Navigate, type RouteObject } from "react-router";

/**
 * 품질 화면(SPEC-035). 하위 경로는 QualityPage 안의 라우트가 맡는다.
 * NFR-2: 품질 화면 전체를 lazy 묶음 하나로 나눠 USER의 첫 화면 코드에 넣지 않는다.
 * `/quality`는 메뉴 주소라 첫 탭으로 바꿔 보낸다(메뉴가 "준비 중" 화면으로 빠지지 않게 경로를 그대로 둔다).
 */
export const QUALITY_ROUTES: RouteObject[] = [
  { path: "/quality", element: <Navigate to="/quality/review" replace /> },
  {
    path: "/quality/*",
    lazy: async () => ({ Component: (await import("../../pages/QualityPage")).QualityPage }),
  },
];
