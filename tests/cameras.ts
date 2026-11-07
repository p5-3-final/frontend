import { handlers } from "../mocks/handlers";
import { cameraHandlers, streamHandlers, type CameraFixture } from "../mocks/stream";
import { startSession } from "../src/shared/api/session";
import { renderRoute } from "./render";
import { server } from "./server";

/** 카메라 화면을 연다. `extra`는 기본 카메라 응답보다 앞에 둔다. */
export function renderCameras(
  path = "/history/cameras",
  extra: Parameters<typeof server.use> = [],
  fixture: CameraFixture = {},
) {
  server.use(...extra, handlers.me(), ...cameraHandlers(fixture), ...streamHandlers());
  startSession("access-1");
  return renderRoute(path);
}
