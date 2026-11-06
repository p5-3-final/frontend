import { handlers } from "../mocks/handlers";
import { OPERATOR_ID, qualityHandlers, type QualityFixture } from "../mocks/quality";
import type { components } from "../src/api/generated/auth-service";
import { startSession } from "../src/shared/api/session";
import { renderRoute } from "./render";
import { server } from "./server";

type Roles = components["schemas"]["UserResponse"]["roles"];

/**
 * 운영자(계약 예시의 assigneeId)로 로그인해 품질 화면 `path`를 연다. `extra`는 기본 quality 응답보다 앞에 둔다.
 */
export function renderQuality(
  path: string,
  options: { extra?: Parameters<typeof server.use>; roles?: Roles; fixture?: QualityFixture } = {},
) {
  server.use(
    ...(options.extra ?? []),
    handlers.me({
      id: OPERATOR_ID,
      email: "operator@example.com",
      nickname: "운영자",
      roles: options.roles ?? ["USER", "OPERATOR"],
    }),
    ...qualityHandlers(options.fixture),
  );
  startSession("access-1");
  return renderRoute(path);
}
