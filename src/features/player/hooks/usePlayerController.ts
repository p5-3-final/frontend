import { useState, useSyncExternalStore } from "react";
import {
  createPlayerController,
  type PlayerController,
  type PlayerSnapshot,
} from "../model/playerController";

/** 화면이 살아 있는 동안 같은 조작 창구를 돌려준다. 페이지가 만들어 플레이어와 결과 패널에 넘긴다. */
export function usePlayerController(): PlayerController {
  const [controller] = useState(createPlayerController);
  return controller;
}

/** 재생 위치·길이·일시정지 여부를 읽는다. */
export function usePlayerSnapshot(controller: PlayerController): PlayerSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot);
}
