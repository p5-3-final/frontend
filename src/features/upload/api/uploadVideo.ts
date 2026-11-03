import type { CompletedPart, UploadInstruction, Video, VideoContentType } from "../model/schemas";
import { completeVideoUpload, createVideo } from "./mediaApi";
import { postForm, putPart, type TransferOptions } from "./storageTransport";

export interface UploadOptions extends Pick<TransferOptions, "signal" | "retryDelaysMs"> {
  /** 파일 전체에서 지금까지 보낸 바이트 */
  onProgress?: (loadedBytes: number, totalBytes: number) => void;
  /** 업로드 자리를 받았을 때. 취소하면 이 영상을 지운다(SPEC-005 R-12). */
  onCreated?: (videoId: string) => void;
}

// 한 조각씩 보내면 왕복 지연 때문에 대역폭을 다 못 쓰고, 너무 많이 보내면 브라우저의 호스트당 연결(6개)을 업로드가 독차지한다.
const PART_CONCURRENCY = 3;

/**
 * 파일 하나를 올린다: 업로드 자리 발급 → 저장소에 직접 업로드 → 완료 요청(SPEC-005 R-5~R-7).
 * 서명 주소와 폼 값은 이 함수 안에서만 쓰고 어디에도 남기지 않는다(SPEC-005 NFR-2).
 */
export async function uploadVideo(
  file: File,
  contentType: VideoContentType,
  options: UploadOptions = {},
): Promise<Video> {
  const created = await createVideo(
    { fileName: file.name, sizeBytes: file.size, contentType },
    options.signal,
  );
  options.onCreated?.(created.video.id);
  const parts = await sendToStorage(file, created.upload, options);
  return completeVideoUpload(created.video.id, parts, options.signal);
}

async function sendToStorage(
  file: File,
  upload: UploadInstruction,
  options: UploadOptions,
): Promise<CompletedPart[] | undefined> {
  const transfer = { signal: options.signal, retryDelaysMs: options.retryDelaysMs };
  if (upload.method === "SINGLE") {
    await postForm(upload.url, upload.fields, file, {
      ...transfer,
      onProgress: (loaded) => options.onProgress?.(loaded, file.size),
    });
    return undefined;
  }

  // 조각마다 보낸 바이트를 따로 두고 합쳐서 파일 전체 진행률을 낸다. 다시 보낸 조각은 0부터 다시 센다.
  const loadedByPart = new Map<number, number>();
  const report = () => {
    let loaded = 0;
    loadedByPart.forEach((bytes) => (loaded += bytes));
    options.onProgress?.(Math.min(loaded, file.size), file.size);
  };
  const pending = [...upload.parts];
  const completed: CompletedPart[] = [];
  const worker = async () => {
    for (let part = pending.shift(); part !== undefined; part = pending.shift()) {
      const start = (part.partNumber - 1) * upload.partSizeBytes;
      const partNumber = part.partNumber;
      const eTag = await putPart(part.url, file.slice(start, start + upload.partSizeBytes), {
        ...transfer,
        onProgress: (loaded) => {
          loadedByPart.set(partNumber, loaded);
          report();
        },
      });
      completed.push({ partNumber, eTag });
    }
  };
  await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, pending.length) }, worker));
  return completed.sort((a, b) => a.partNumber - b.partNumber);
}
