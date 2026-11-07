import { EVENT_TYPE_NAMES } from "../../../../shared/lib/messages";
import { REVIEW_STATUS_NAMES } from "../../model/names";
import { REVIEW_REASON_FILTERS, reviewReasonName } from "../../model/reviewReason";
import type { ReviewQuery } from "../../model/reviewQuery";
import { EVENT_TYPES_FOR_FILTER, REVIEW_STATUSES } from "../../model/schemas";
import { SelectField } from "../../ui/SelectField";

export interface ReviewFiltersProps {
  query: ReviewQuery;
  onChange: (query: ReviewQuery) => void;
}

const ALL = "";
const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  ...REVIEW_STATUSES.map((status) => ({ value: status, label: REVIEW_STATUS_NAMES[status] })),
];
// SPEC-035 R-21: 필터는 계약 ReviewReason 파라미터의 알려진 값만 고른다.
const REASON_OPTIONS = [
  { value: ALL, label: "전체" },
  ...REVIEW_REASON_FILTERS.map((reason) => ({ value: reason, label: reviewReasonName(reason) })),
];
const TYPE_OPTIONS = [
  { value: ALL, label: "전체" },
  ...EVENT_TYPES_FOR_FILTER.map((type) => ({ value: type, label: EVENT_TYPE_NAMES[type] ?? type })),
];

function findOption<T extends string>(values: readonly T[], value: string): T | undefined {
  return values.find((candidate) => candidate === value);
}

/** 검토 큐 거르기(상태·사유·유형, SPEC-035 R-2·R-21) */
export function ReviewFilters({ query, onChange }: ReviewFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SelectField
        label="상태"
        options={STATUS_OPTIONS}
        value={query.status ?? "all"}
        onChange={(event) => {
          onChange({ ...query, status: findOption(REVIEW_STATUSES, event.target.value) });
        }}
      />
      <SelectField
        label="사유"
        options={REASON_OPTIONS}
        value={query.reason ?? ALL}
        onChange={(event) => {
          onChange({ ...query, reason: findOption(REVIEW_REASON_FILTERS, event.target.value) });
        }}
      />
      <SelectField
        label="유형"
        options={TYPE_OPTIONS}
        value={query.eventType ?? ALL}
        onChange={(event) => {
          onChange({ ...query, eventType: findOption(EVENT_TYPES_FOR_FILTER, event.target.value) });
        }}
      />
    </div>
  );
}
