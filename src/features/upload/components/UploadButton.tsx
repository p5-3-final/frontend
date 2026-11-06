import { CloudUpload } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Button } from "../../../shared/ui/Button";
import { ACCEPTED_EXTENSIONS } from "../model/fileRules";
import { enqueueFiles, type ResolveUploadTarget } from "../model/enqueueFiles";

export interface UploadButtonProps {
  /** 파일을 고른 뒤 대기열에 넣기 전에 부른다(SPEC-034 R-6). null이면 넣지 않는다. */
  resolveTarget?: ResolveUploadTarget;
}

/** 파일 고르기 창을 여는 "영상 업로드" 버튼. 여러 파일을 고를 수 있다(SPEC-005 R-1). */
export function UploadButton({ resolveTarget }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 골라도 change가 일어나도록 비운다.
    event.target.value = "";
    void enqueueFiles(files, resolveTarget);
  };

  return (
    <>
      <Button onClick={() => inputRef.current?.click()}>
        <CloudUpload aria-hidden="true" className="size-5" />
        영상 업로드
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS}
        aria-label="영상 파일 고르기"
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
