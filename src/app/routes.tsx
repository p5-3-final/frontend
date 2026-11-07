import { Navigate, type RouteObject } from "react-router";
import { GuestOnly, HOME_PATH, RequireAuth } from "../features/auth";
import { AppLayout } from "./layout/AppLayout";
import { MAIN_MENU, SETTINGS_MENU } from "./layout/menu";
import { ANALYSIS_ROUTES } from "./featureRoutes/analysisRoutes";
import { SESSIONS_ROUTES } from "./featureRoutes/sessionsRoutes";
import { SETTINGS_ROUTES } from "./featureRoutes/settingsRoutes";
import { SEARCH_ROUTES } from "./featureRoutes/searchRoutes";
import { STREAM_ROUTES } from "./featureRoutes/streamRoutes";
import { QUALITY_ROUTES } from "./featureRoutes/qualityRoutes";

/**
 * 로그인한 레이아웃 안의 화면. 기능(spec)마다 `featureRoutes/<기능>Routes.tsx`에 배열을 두고 여기서 합친다.
 * 뒤 spec은 자기 배열 파일을 만들고 아래 목록에 한 줄을 더한다.
 */
const FEATURE_ROUTES: RouteObject[] = [
  ...ANALYSIS_ROUTES,
  ...STREAM_ROUTES,
  ...SESSIONS_ROUTES,
  ...SETTINGS_ROUTES,
  ...SEARCH_ROUTES,
  ...QUALITY_ROUTES,
];

// 아직 기능이 없는 메뉴(SPEC-002 R-15). 화면이 생긴 메뉴는 자동으로 빠진다.
const IMPLEMENTED_PATHS = new Set(FEATURE_ROUTES.map((route) => route.path));
const COMING_SOON_MENUS = [...MAIN_MENU, SETTINGS_MENU].filter(
  (item) => !IMPLEMENTED_PATHS.has(item.path),
);

// 화면 단위로 코드를 나눠 첫 화면에 필요한 코드만 받게 한다(react-style.md).
export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      {
        path: "/login",
        lazy: async () => ({ Component: (await import("../pages/LogInPage")).LogInPage }),
      },
      {
        path: "/signup",
        lazy: async () => ({ Component: (await import("../pages/SignUpPage")).SignUpPage }),
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={HOME_PATH} replace /> },
          ...FEATURE_ROUTES,
          ...COMING_SOON_MENUS.map((item) => ({
            path: item.path,
            lazy: async () => {
              const { ComingSoonPage } = await import("../pages/ComingSoonPage");
              return { element: <ComingSoonPage title={item.label} /> };
            },
          })),
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to={HOME_PATH} replace /> },
];
