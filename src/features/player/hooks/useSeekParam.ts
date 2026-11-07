import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import type { PlayerController } from "../model/playerController";

/** 영상 상세 주소의 시작 시각(ms) 쿼리 이름. 예: `?t=38000` */
export const SEEK_PARAM = "t";

// URL은 사용자가 바꿀 수 있는 입력이라 0 이상의 정수 ms만 받는다.
const seekMsSchema = z.coerce.number().int().min(0);

/** 주소의 `?t=`가 있으면 플레이어를 그 시각으로 옮긴다. 값이 바뀔 때만 옮겨 재생 중 위치를 되돌리지 않는다. */
export function useSeekParam(controller: PlayerController): void {
  const [params] = useSearchParams();
  const raw = params.get(SEEK_PARAM);
  const parsed = raw === null ? undefined : seekMsSchema.safeParse(raw);
  const seekMs = parsed?.success === true ? parsed.data : undefined;
  // controller는 React 밖의 <video>를 다루는 외부 시스템이다.
  useEffect(() => {
    if (seekMs !== undefined) {
      controller.seek(seekMs);
    }
  }, [controller, seekMs]);
}
