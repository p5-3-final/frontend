import { SEARCH_IMAGE_MESSAGE } from "../../../shared/lib/messages";

/** 계약 ImageSearchRequest.image: jpg·png·webp */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** 계약 ImageSearchRequest.image: 5MB(5 × 1024 × 1024바이트) 이하 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 올리기 전에 형식과 크기를 확인한다(SPEC-033 R-8). 틀리면 이유를, 맞으면 undefined를 돌려준다. */
export function checkSearchImage(file: Pick<File, "type" | "size">): string | undefined {
  const typeOk = IMAGE_TYPES.some((type) => type === file.type);
  return typeOk && file.size > 0 && file.size <= MAX_IMAGE_BYTES ? undefined : SEARCH_IMAGE_MESSAGE;
}
