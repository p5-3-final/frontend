import { Navigate, type RouteObject } from "react-router";
import { GuestOnly, HOME_PATH, RequireAuth } from "../features/auth";
import { AppLayout } from "./layout/AppLayout";
import { MAIN_MENU, SETTINGS_MENU } from "./layout/menu";

// 아직 기능이 없는 메뉴(SPEC-002 R-15). 영상 분석은 자기 화면이 있다.
const COMING_SOON_MENUS = [...MAIN_MENU, SETTINGS_MENU].filter((item) => item.path !== HOME_PATH);

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
          {
            path: HOME_PATH,
            lazy: async () => ({ Component: (await import("../pages/AnalysisPage")).AnalysisPage }),
          },
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
