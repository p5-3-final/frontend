import { useSearchParams } from "react-router";
import { SEARCH_IMAGE_MISSING_MESSAGE } from "../../../shared/lib/messages";
import { useImageSearch } from "../api/useImageSearch";
import { useLastImageSearch } from "../api/useLastImageSearch";
import { useMomentSearch } from "../api/useMomentSearch";
import { initialFormValues } from "../model/searchForm";
import { toSearchErrorView } from "../model/searchError";
import { parseSearchCriteria, toSearchParams } from "../model/searchParams";
import { SearchForm } from "./SearchForm";
import { SearchOutcome } from "./SearchOutcome";

/**
 * 검색 화면 본문(SPEC-033). 문장 검색 조건은 URL 쿼리에 두고 결과는 URL에서 읽은 조건으로 묻는다(R-12).
 * 이미지 검색은 파일을 URL에 담을 수 없어 마지막 결과를 메모리 캐시에 두고 `?image=last`로 가리킨다.
 */
export function SearchScreen() {
  const [params, setParams] = useSearchParams();
  const criteria = parseSearchCriteria(params);
  const textCriteria = criteria?.kind === "text" ? criteria : undefined;
  const textSearch = useMomentSearch(textCriteria);
  const imageSearch = useImageSearch();
  const lastImage = useLastImageSearch();
  const textError = textSearch.error === null ? undefined : toSearchErrorView(textSearch.error);
  const imageError = imageSearch.error === null ? undefined : toSearchErrorView(imageSearch.error);
  const imageActive = imageSearch.isPending || imageSearch.isError;

  return (
    <div className="flex flex-col gap-4">
      <SearchForm
        // URL 조건이 바뀌면(뒤로 가기) 폼 값도 그 조건으로 다시 채운다.
        key={params.toString()}
        defaultValues={initialFormValues(criteria, params)}
        queryError={textError?.kind === "input" ? textError.message : undefined}
        imageError={imageError?.kind === "input" ? imageError.message : undefined}
        onSubmit={(next) => {
          imageSearch.reset();
          setParams(toSearchParams(next));
        }}
        onImageSelect={(image, sourceId) => {
          imageSearch.mutate(
            { image, sourceId },
            {
              onSuccess: () => {
                setParams(toSearchParams({ kind: "image" }));
              },
            },
          );
        }}
      />
      {imageActive ? (
        <SearchOutcome
          result={undefined}
          isPending={imageSearch.isPending}
          errorView={imageError}
          onRetry={() => {
            imageSearch.mutate(imageSearch.variables);
          }}
        />
      ) : criteria?.kind === "image" ? (
        lastImage.data === undefined ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {SEARCH_IMAGE_MISSING_MESSAGE}
          </p>
        ) : (
          <SearchOutcome
            result={lastImage.data}
            isPending={false}
            errorView={undefined}
            onRetry={() => undefined}
          />
        )
      ) : (
        textCriteria !== undefined && (
          <SearchOutcome
            result={textSearch.data}
            isPending={textSearch.isFetching}
            errorView={textError}
            onRetry={() => {
              void textSearch.refetch();
            }}
          />
        )
      )}
    </div>
  );
}
