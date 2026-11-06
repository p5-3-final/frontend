import type { RouteObject } from "react-router";

/** 설정(학습용 보존) 화면(SPEC-034 R-9, R-10) */
export const SETTINGS_ROUTES: RouteObject[] = [
  {
    path: "/settings",
    lazy: async () => ({ Component: (await import("../../pages/SettingsPage")).SettingsPage }),
  },
];
