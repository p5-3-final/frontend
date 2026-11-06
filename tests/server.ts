import { setupServer } from "msw/node";
import { sseServer } from "../mocks/notifications";

/**
 * 테스트용 API 서버. 테스트마다 server.use로 필요한 응답을 등록한다.
 * 로그인한 화면은 모두 알림 연결을 열므로(SPEC-031 R-12), 기본으로 아무 메시지도 보내지 않는 알림 서버를 둔다.
 * 알림을 확인하는 테스트는 `server.use(...sseServer().handlers)`로 자기 서버를 앞에 둔다.
 */
export const server = setupServer(...sseServer().handlers);
