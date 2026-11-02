import { Navigate, type RouteObject } from "react-router";

// 화면 단위로 코드를 나눠 첫 화면에 필요한 코드만 받게 한다(react-style.md).
export const routes: RouteObject[] = [
  {
    path: "/login",
    lazy: async () => ({ Component: (await import("../pages/LogInPage")).LogInPage }),
  },
  {
    path: "/signup",
    lazy: async () => ({ Component: (await import("../pages/SignUpPage")).SignUpPage }),
  },
  // 로그인 후 화면이 생기기 전까지는 로그인 화면으로 보낸다.
  { path: "*", element: <Navigate to="/login" replace /> },
];
