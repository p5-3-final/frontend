import { useState } from "react";
import { ApiError } from "../../../../shared/api/problem";
import { messageForCode } from "../../../../shared/lib/messages";
import { Alert } from "../../../../shared/ui/Alert";
import { Button } from "../../../../shared/ui/Button";
import { Panel } from "../../../../shared/ui/Panel";
import { useAddGoldenSetEntry, useGoldenSets } from "../../api/goldenSets";
import type { ReviewItem } from "../../model/schemas";
import { SelectField } from "../../ui/SelectField";
import { QualityError } from "../QualityError";

export interface AddToGoldenSetProps {
  item: ReviewItem;
}

/**
 * 라벨된 검토 항목을 Golden Set 초안에 넣는다(SPEC-035 R-9). 가져온 데이터셋 세트에는 넣을 수 없어 출처가 검토인 세트만 보인다.
 */
export function AddToGoldenSet({ item }: AddToGoldenSetProps) {
  const sets = useGoldenSets();
  const add = useAddGoldenSetEntry();
  const [chosen, setChosen] = useState<string>();
  const reviewSets = sets.data?.items.filter((set) => set.origin === "review") ?? [];
  const setId = chosen ?? reviewSets[0]?.setId;
  const target = reviewSets.find((set) => set.setId === setId);

  return (
    <Panel title="Golden Set에 넣기">
      {sets.isPending && <p role="status">Golden Set을 불러오는 중입니다.</p>}
      {sets.isError && (
        <QualityError
          error={sets.error}
          onRetry={() => {
            void sets.refetch();
          }}
        />
      )}
      {sets.isSuccess && reviewSets.length === 0 && (
        <p className="text-sm text-muted">
          넣을 수 있는 Golden Set이 없습니다. 먼저 만들어 주세요.
        </p>
      )}
      {target !== undefined && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <SelectField
              label="Golden Set"
              options={reviewSets.map((set) => ({ value: set.setId, label: set.name }))}
              value={target.setId}
              onChange={(event) => {
                add.reset();
                setChosen(event.target.value);
              }}
            />
          </div>
          <Button
            disabled={add.isPending}
            onClick={() => {
              add.mutate({ setId: target.setId, reviewItemId: item.itemId });
            }}
          >
            초안에 넣기
          </Button>
        </div>
      )}
      {add.isSuccess && target !== undefined && (
        <Alert tone="success">{target.name} 초안에 넣었습니다.</Alert>
      )}
      {add.error !== null && (
        <Alert>{messageForCode(add.error instanceof ApiError ? add.error.code : undefined)}</Alert>
      )}
    </Panel>
  );
}
