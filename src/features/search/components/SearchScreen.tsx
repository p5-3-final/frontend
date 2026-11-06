import { useSearchParams } from "react-router";
import { useMomentSearch } from "../api/useMomentSearch";
import { initialFormValues } from "../model/searchForm";
import { toSearchErrorView } from "../model/searchError";
import { parseSearchCriteria, toSearchParams } from "../model/searchParams";
import { SearchForm } from "./SearchForm";
import { SearchOutcome } from "./SearchOutcome";

/** 검색 화면 본문(SPEC-033). 조건은 URL 쿼리에 두고, 결과는 URL에서 읽은 조건으로 묻는다(R-12). */
export function SearchScreen() {
  const [params, setParams] = useSearchParams();
  const criteria = parseSearchCriteria(params);
  const textCriteria = criteria?.kind === "text" ? criteria : undefined;
  const search = useMomentSearch(textCriteria);
  const errorView = search.error === null ? undefined : toSearchErrorView(search.error);

  return (
    <div className="flex flex-col gap-4">
      <SearchForm
        // URL 조건이 바뀌면(뒤로 가기) 폼 값도 그 조건으로 다시 채운다.
        key={params.toString()}
        defaultValues={initialFormValues(criteria, params)}
        queryError={errorView?.kind === "input" ? errorView.message : undefined}
        onSubmit={(next) => {
          setParams(toSearchParams(next));
        }}
      />
      {textCriteria !== undefined && (
        <SearchOutcome
          result={search.data}
          isPending={search.isFetching}
          errorView={errorView}
          onRetry={() => {
            void search.refetch();
          }}
        />
      )}
    </div>
  );
}
