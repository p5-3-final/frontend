import { ImageUp } from "lucide-react";
import { useId, useState } from "react";
import { SEARCH_SOURCE_REQUIRED_MESSAGE } from "../../../shared/lib/messages";
import { checkSearchImage, IMAGE_TYPES } from "../model/imageRules";

export interface ImageSearchInputProps {
  /** "이 영상" 범위면 고른 영상, "내 영상 전체"면 undefined. 이 영상인데 아직 고르지 않았으면 null이다. */
  sourceId: string | null | undefined;
  /** 서버가 이미지를 거절한 이유(400) */
  serverError?: string | undefined;
  onSelect: (image: File, sourceId: string | undefined) => void;
}

/** 이미지 올려 찾기(SPEC-033 R-8). 형식·크기를 벗어나면 올리지 않고 이유를 보인다. */
export function ImageSearchInput({ sourceId, serverError, onSelect }: ImageSearchInputProps) {
  const inputId = useId();
  const errorId = useId();
  const [localError, setLocalError] = useState<string>();
  const error = localError ?? serverError;
  return (
    <div className="flex flex-col gap-1.5">
      {/* 파일 칸은 숨기고 라벨을 버튼처럼 보인다. 라벨을 누르거나 키보드로 칸에 가면 파일 고르기가 열린다. */}
      <label
        htmlFor={inputId}
        className="inline-flex h-11 cursor-pointer items-center gap-2 self-start rounded-lg border border-line bg-panel-raised px-4 font-semibold hover:border-accent has-focus-visible:ring-2 has-focus-visible:ring-accent"
      >
        <ImageUp aria-hidden="true" className="size-4" />
        이미지로 찾기
        <input
          id={inputId}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={error === undefined ? undefined : errorId}
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            // 같은 파일을 다시 골라도 change가 일어나게 비운다.
            event.currentTarget.value = "";
            if (file === undefined) {
              return;
            }
            const reason =
              checkSearchImage(file) ??
              (sourceId === null ? SEARCH_SOURCE_REQUIRED_MESSAGE : undefined);
            setLocalError(reason);
            if (reason === undefined) {
              onSelect(file, sourceId ?? undefined);
            }
          }}
        />
      </label>
      {error !== undefined && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
