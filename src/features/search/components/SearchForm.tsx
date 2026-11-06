import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useId } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { Button } from "../../../shared/ui/Button";
import { videoDetailQuery } from "../../upload";
import { useReadyVideos } from "../api/useReadyVideos";
import { searchFormSchema, toCriteria, type SearchFormValues } from "../model/searchForm";
import { QUERY_MAX_LENGTH, type TextSearchCriteria } from "../model/searchParams";

export interface SearchFormProps {
  defaultValues: SearchFormValues;
  /** 서버가 질의를 거절한 이유(400). 질의 입력 옆에 보인다(SPEC-033 R-13). */
  queryError?: string | undefined;
  onSubmit: (criteria: TextSearchCriteria) => void;
}

const FIELD_CLASS =
  "h-11 rounded-lg border border-line bg-surface px-3 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger";

/** 문장 검색 조건 입력(SPEC-033 R-1, R-7). 보내면 URL만 바꾸고, 요청은 URL에서 읽은 조건으로 한다. */
export function SearchForm({ defaultValues, queryError, onSubmit }: SearchFormProps) {
  const ids = { q: useId(), qError: useId(), source: useId(), sourceError: useId() };
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SearchFormValues>({ resolver: zodResolver(searchFormSchema), defaultValues });
  const scope = useWatch({ control, name: "scope" });
  const sourceId = useWatch({ control, name: "sourceId" });
  const qError = errors.q?.message ?? queryError;
  const scopeField = register("scope", {
    onChange: (event: { target: { value: string } }) => {
      // R-7: 전체 검색에는 정밀 검색이 없다. 범위를 바꾸면 꺼진 채로 막는다.
      if (event.target.value === "all") {
        setValue("precise", false);
      }
    },
  });

  return (
    <form
      role="search"
      aria-label="장면 검색"
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          onSubmit(toCriteria(values));
        })(event);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.q} className="text-sm font-medium text-muted">
          검색어
        </label>
        <div className="flex gap-2">
          <input
            id={ids.q}
            type="search"
            maxLength={QUERY_MAX_LENGTH}
            placeholder="예: 안전모 안 쓴 작업자"
            aria-invalid={qError === undefined ? undefined : true}
            aria-describedby={qError === undefined ? undefined : ids.qError}
            className={`${FIELD_CLASS} min-w-0 flex-1`}
            {...register("q")}
          />
          <Button type="submit">
            <Search aria-hidden="true" className="size-4" />
            검색
          </Button>
        </div>
        {qError !== undefined && (
          <p id={ids.qError} className="text-sm text-danger">
            {qError}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <legend className="mb-1.5 text-sm font-medium text-muted">범위</legend>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" value="source" className="accent-accent" {...scopeField} />이 영상
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" value="all" className="accent-accent" {...scopeField} />내 영상 전체
          </label>
        </fieldset>
        {scope === "source" && (
          <SourcePicker
            id={ids.source}
            errorId={ids.sourceError}
            selectedId={sourceId}
            error={errors.sourceId?.message}
            registration={register("sourceId")}
          />
        )}
        <label
          className="inline-flex items-center gap-2 text-sm aria-disabled:opacity-50"
          aria-disabled={scope === "all"}
        >
          <input
            type="checkbox"
            className="accent-accent"
            disabled={scope === "all"}
            {...register("precise")}
          />
          정밀 검색
        </label>
      </div>
    </form>
  );
}

interface SourcePickerProps {
  id: string;
  errorId: string;
  selectedId: string;
  error: string | undefined;
  registration: UseFormRegisterReturn<"sourceId">;
}

function SourcePicker({ id, errorId, selectedId, error, registration }: SourcePickerProps) {
  const { videos, isPending } = useReadyVideos();
  const listed = videos.some((video) => video.id === selectedId);
  // 목록 첫 쪽에 없는 영상(영상 상세에서 온 경우)도 고른 상태로 보이게 이름을 따로 읽는다.
  const selected = useQuery({
    ...videoDetailQuery(selectedId),
    enabled: selectedId !== "" && !listed && !isPending,
  });
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        영상
      </label>
      <select
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        className={`${FIELD_CLASS} max-w-64`}
        {...registration}
        // 목록이 나중에 도착해도 고른 영상이 보이게 값을 직접 넘긴다.
        value={selectedId}
      >
        <option value="">{isPending ? "영상 목록을 불러오는 중" : "영상을 고르세요"}</option>
        {!listed && selected.data !== undefined && (
          <option value={selected.data.id}>{selected.data.fileName}</option>
        )}
        {videos.map((video) => (
          <option key={video.id} value={video.id}>
            {video.fileName}
          </option>
        ))}
      </select>
      {error !== undefined && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
