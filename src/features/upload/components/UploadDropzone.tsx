import { useState, type DragEvent, type ReactNode } from "react";
import { addFiles } from "../model/uploadQueue";

export interface UploadDropzoneProps {
  children: ReactNode;
}

/** 파일을 끌어다 놓으면 대기열에 넣는 영역(SPEC-005 R-1). 키보드 사용자는 업로드 버튼을 쓴다. */
export function UploadDropzone({ children }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (event: DragEvent) => {
    // 기본 동작을 막아야 drop이 일어나고, 브라우저가 파일을 새 탭으로 열지 않는다.
    event.preventDefault();
    setDragging(true);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section
      aria-label="영상 업로드 영역"
      onDragOver={handleDragOver}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={handleDrop}
      className={`flex flex-col gap-4 rounded-2xl border-2 border-dashed p-1 transition-colors ${dragging ? "border-accent bg-accent-soft" : "border-transparent"}`}
    >
      {children}
    </section>
  );
}
