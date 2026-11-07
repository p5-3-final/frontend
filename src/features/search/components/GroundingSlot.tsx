import { Clapperboard, LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { useGroundingClip } from "../api/useGroundingClip";
import { useGroundingLiveStatus } from "../hooks/useGroundingLiveStatus";
import type { MomentResult } from "../model/schemas";
import { GroundingClipDialog } from "./GroundingClipDialog";

export interface GroundingSlotProps {
  moment: MomentResult;
}

const STATUS_CLASS = "flex items-center gap-1.5 text-sm text-muted";

/**
 * 결과의 bbox 주석 클립 자리(SPEC-033 R-5). 상위 3개 결과만 주석을 요청하고, 나머지(NONE)에는 자리를 두지 않는다.
 * 완료는 SSE `grounding.completed`로 받는다.
 */
export function GroundingSlot({ moment }: GroundingSlotProps) {
  const { groundingId } = moment.grounding;
  const status = useGroundingLiveStatus(groundingId, moment.grounding.status);
  const clip = useGroundingClip(groundingId, status === "READY");
  const [open, setOpen] = useState(false);

  if (status === "NONE") {
    return null;
  }
  if (status === "REQUESTED") {
    return (
      <p className={STATUS_CLASS}>
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        주석 클립 만드는 중
      </p>
    );
  }
  if (status === "FAILED" || clip.data?.status === "FAILED") {
    return (
      <p className={STATUS_CLASS}>
        <TriangleAlert aria-hidden="true" className="size-4" />
        주석을 만들지 못했습니다.
      </p>
    );
  }
  if (clip.isError) {
    return <p className={STATUS_CLASS}>주석 클립을 불러오지 못했습니다.</p>;
  }
  if (clip.data?.clipUrl == null) {
    return <p className={STATUS_CLASS}>주석 클립을 불러오는 중</p>;
  }
  return (
    <>
      <Button
        variant="secondary"
        className="h-9 self-start px-3 text-sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Clapperboard aria-hidden="true" className="size-4" />
        주석 클립 보기
      </Button>
      {open && (
        <GroundingClipDialog
          clip={clip.data}
          clipUrl={clip.data.clipUrl}
          clipStartMs={moment.startMs}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
