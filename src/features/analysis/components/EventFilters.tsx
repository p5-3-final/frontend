import { useId } from "react";
import type { z } from "zod";
import {
  EVENT_TYPE_NAMES,
  REVIEW_STATE_NAMES,
  SEVERITY_NAMES,
  VERIFICATION_NAMES,
} from "../../../shared/lib/messages";
import type { EventQuery } from "../model/eventFilters";
import {
  EVENT_TYPES,
  eventTypeSchema,
  REVIEW_STATES,
  reviewStateSchema,
  SEVERITIES,
  severitySchema,
  VERIFICATION_STATUSES,
  verificationStatusSchema,
} from "../model/schemas";

export interface EventFiltersProps {
  query: EventQuery;
  onChange: (query: EventQuery) => void;
}

interface FilterSelectProps<T extends string> {
  label: string;
  value: T | undefined;
  options: readonly T[];
  names: Readonly<Record<T, string>>;
  parse: (raw: string) => T | undefined;
  onChange: (value: T | undefined) => void;
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  names,
  parse,
  onChange,
}: FilterSelectProps<T>) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => {
          onChange(parse(event.target.value));
        }}
        className="h-9 rounded-lg border border-line bg-panel-raised px-2 text-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {names[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

function parser<T>(schema: z.ZodType<T>) {
  return (raw: string): T | undefined => {
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };
}

/** 이벤트 거르기(SPEC-031 R-3, R-11). 값은 부모가 URL 쿼리에 둔다. */
export function EventFilters({ query, onChange }: EventFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <FilterSelect
        label="유형"
        value={query.eventType}
        options={EVENT_TYPES}
        names={EVENT_TYPE_NAMES}
        parse={parser(eventTypeSchema)}
        onChange={(eventType) => {
          onChange({ ...query, eventType });
        }}
      />
      <FilterSelect
        label="심각도"
        value={query.severity}
        options={SEVERITIES}
        names={SEVERITY_NAMES}
        parse={parser(severitySchema)}
        onChange={(severity) => {
          onChange({ ...query, severity });
        }}
      />
      <FilterSelect
        label="판정 상태"
        value={query.verificationStatus}
        options={VERIFICATION_STATUSES}
        names={VERIFICATION_NAMES}
        parse={parser(verificationStatusSchema)}
        onChange={(verificationStatus) => {
          onChange({ ...query, verificationStatus });
        }}
      />
      <FilterSelect
        label="확인 상태"
        value={query.reviewState}
        options={REVIEW_STATES}
        names={REVIEW_STATE_NAMES}
        parse={parser(reviewStateSchema)}
        onChange={(reviewState) => {
          onChange({ ...query, reviewState });
        }}
      />
    </div>
  );
}
