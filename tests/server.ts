import { setupServer } from "msw/node";

/** 테스트용 API 서버. 테스트마다 server.use로 필요한 응답을 등록한다. */
export const server = setupServer();
