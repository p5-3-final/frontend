import { useSearchParams } from "react-router";
import { z } from "zod";
import type { PlayerController } from "../../player";

// URL의 이벤트 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식만 서버에 묻는다.
const eventIdSchema = z.guid();

export const EVENT_PARAM = "event";

export interface EventSelection {
  selectedId: string | undefined;
  /** 이벤트를 열고 플레이어를 그 이벤트의 seekMs로 옮긴다(SPEC-031 R-5). */
  select: (event: { eventId: string; seekMs: number }) => void;
  /** seekMs를 모르는 곳(진행 막대 표시)에서 연다. 상세를 받은 뒤 상세 패널이 seekMs로 옮긴다. */
  open: (eventId: string) => void;
  close: () => void;
}

/** 열린 이벤트는 URL `?event=`에 둔다. 주소를 공유하거나 "이벤트" 메뉴에서 오면 같은 이벤트가 열린다(R-11). */
export function useEventSelection(controller: PlayerController): EventSelection {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsed = eventIdSchema.safeParse(searchParams.get(EVENT_PARAM));
  const open = (eventId: string) => {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.set(EVENT_PARAM, eventId);
        return next;
      },
      { replace: true },
    );
  };
  return {
    selectedId: parsed.success ? parsed.data : undefined,
    select: (event) => {
      controller.seek(event.seekMs);
      open(event.eventId);
    },
    open,
    close: () => {
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          next.delete(EVENT_PARAM);
          return next;
        },
        { replace: true },
      );
    },
  };
}
