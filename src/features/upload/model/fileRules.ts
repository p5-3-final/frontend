import { FILE_SIZE_MESSAGE, UNSUPPORTED_FORMAT_MESSAGE } from "../../../shared/lib/messages";
import type { VideoContentType } from "./schemas";

// SPEC-003 R-4: media-service가 받는 최대 크기(5GB)
export const MAX_VIDEO_SIZE_BYTES = 5_368_709_120;

// 브라우저의 File.type은 mkv·avi에서 비어 있거나 OS마다 달라서 확장자로 형식을 정한다.
const CONTENT_TYPES: Readonly<Record<string, VideoContentType>> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
};

/** 파일 고르기 창에서 보여 줄 확장자 */
export const ACCEPTED_EXTENSIONS = Object.keys(CONTENT_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

export type FileCheck =
  { ok: true; contentType: VideoContentType } | { ok: false; message: string };

/** 업로드 자리를 요청하기 전에 형식과 크기를 확인한다(SPEC-005 R-2, R-3). */
export function checkVideoFile(file: { name: string; size: number }): FileCheck {
  const dot = file.name.lastIndexOf(".");
  const extension = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  const contentType = CONTENT_TYPES[extension];
  if (contentType === undefined) {
    return { ok: false, message: UNSUPPORTED_FORMAT_MESSAGE };
  }
  if (file.size < 1 || file.size > MAX_VIDEO_SIZE_BYTES) {
    return { ok: false, message: FILE_SIZE_MESSAGE };
  }
  return { ok: true, contentType };
}
