import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import type { PlayerController } from "../model/playerController";

/** 재생 시작 위치 쿼리 이름. 값은 영상 안 시각(ms)이다(SPEC-034 R-4, 세션 흐름 요약의 위험 시작 시각). */
export const SEEK_PARAM = "t";

// URL 값은 사용자가 바꿀 수 있는 입력이라 0 이상 정수만 받는다.
const seekMsSchema = z.coerce.number().int().min(0);

/** 주소의 `?t=`가 있으면 화면을 열 때 한 번 플레이어를 그 시각으로 옮긴다. */
export function useSeekParam(controller: PlayerController): void {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get(SEEK_PARAM);
  useEffect(() => {
    const parsed = seekMsSchema.safeParse(raw);
    if (raw !== null && parsed.success) {
      controller.seek(parsed.data);
    }
  }, [controller, raw]);
}
