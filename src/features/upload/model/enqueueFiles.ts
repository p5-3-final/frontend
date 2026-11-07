import type { UploadTarget } from "./schemas";
import { addFiles } from "./uploadQueue";

/**
 * 파일을 대기열에 넣기 전에 업로드 대상을 정한다(SPEC-034 R-6, R-7).
 * undefined는 세션 없이 올리고, null은 입력 오류라 넣지 않는다(고르기 화면이 이유를 보인다).
 */
export type ResolveUploadTarget = () => Promise<UploadTarget | null | undefined>;

/** 업로드 버튼·끌어 놓기 영역이 고른 파일을 대상과 함께 대기열에 넣는다. */
export async function enqueueFiles(
  files: readonly File[],
  resolveTarget: ResolveUploadTarget | undefined,
): Promise<void> {
  if (files.length === 0) {
    return;
  }
  const target = resolveTarget === undefined ? undefined : await resolveTarget();
  if (target === null) {
    return;
  }
  addFiles(files, target);
}
