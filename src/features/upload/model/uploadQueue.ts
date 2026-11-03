import { ApiError } from "../../../shared/api/problem";
import {
  GENERIC_ERROR_MESSAGE,
  messageForCode,
  UPLOAD_STORAGE_MESSAGE,
} from "../../../shared/lib/messages";
import { deleteVideo } from "../api/mediaApi";
import { StorageError } from "../api/storageTransport";
import { uploadVideo } from "../api/uploadVideo";
import { checkVideoFile } from "./fileRules";
import type { VideoContentType } from "./schemas";

/**
 * 업로드 대기열. React 밖 모듈에 두어 화면을 옮겨도 업로드가 이어진다(SPEC-005 R-13).
 * 화면은 {@link subscribeUploads}로 구독한다. 서버 데이터(영상 목록)는 여기에 복사하지 않고, 완료를 알리기만 한다.
 */
export type UploadStatus = "waiting" | "uploading" | "done" | "failed" | "rejected";

export interface UploadItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  status: UploadStatus;
  loadedBytes: number;
  videoId?: string;
  message?: string;
}

interface Entry {
  item: UploadItem;
  file: File;
  contentType?: VideoContentType;
}

let entries: Entry[] = [];
let snapshot: readonly UploadItem[] = [];
let running = false;
let nextId = 0;
// 대기열을 비우면 1씩 올린다. 이전 대기열의 실행 루프와 콜백이 새 대기열을 건드리지 않게 한다.
let generation = 0;
const controllers = new Map<string, AbortController>();
const listeners = new Set<() => void>();
const videosChangedListeners = new Set<() => void>();

function publish() {
  snapshot = entries.map((entry) => entry.item);
  listeners.forEach((listener) => {
    listener();
  });
}

function update(id: string, change: Partial<UploadItem>) {
  entries = entries.map((entry) =>
    entry.item.id === id ? { ...entry, item: { ...entry.item, ...change } } : entry,
  );
  publish();
}

/** 고른 순서대로 대기열에 넣는다. 형식·크기가 맞지 않는 파일은 요청하지 않고 이유만 남긴다(SPEC-005 R-1~R-3). */
export function addFiles(files: readonly File[]): void {
  for (const file of files) {
    nextId++;
    const check = checkVideoFile(file);
    const item: UploadItem = {
      id: `upload-${String(nextId)}`,
      fileName: file.name,
      sizeBytes: file.size,
      status: check.ok ? "waiting" : "rejected",
      loadedBytes: 0,
      message: check.ok ? undefined : check.message,
    };
    entries = [...entries, { item, file, contentType: check.ok ? check.contentType : undefined }];
  }
  publish();
  void runQueue();
}

// SPEC-005 R-4: 한 번에 한 파일씩 대기열 순서대로 올린다.
async function runQueue() {
  if (running) {
    return;
  }
  running = true;
  const current = generation;
  try {
    for (let next = findWaiting(); next !== undefined; next = findWaiting()) {
      await uploadOne(next);
      if (current !== generation) {
        return;
      }
    }
  } catch (error) {
    // 대기열을 비우며 중단한 업로드의 실패는 무시한다.
    if (current === generation) {
      throw error;
    }
  } finally {
    if (current === generation) {
      running = false;
    }
  }
}

function findWaiting(): Entry | undefined {
  return entries.find((entry) => entry.item.status === "waiting");
}

async function uploadOne({ item, file, contentType }: Entry) {
  if (contentType === undefined) {
    return;
  }
  update(item.id, { status: "uploading", loadedBytes: 0 });
  const controller = new AbortController();
  controllers.set(item.id, controller);
  try {
    await uploadVideo(file, contentType, {
      signal: controller.signal,
      retryDelaysMs,
      onCreated: (videoId) => {
        update(item.id, { videoId });
      },
      onProgress: (loadedBytes) => {
        update(item.id, { loadedBytes });
      },
    });
    update(item.id, { status: "done", loadedBytes: file.size });
    notifyVideosChanged();
  } catch (error) {
    // 취소한 파일은 이미 대기열에서 빠졌다.
    if (!controller.signal.aborted) {
      update(item.id, { status: "failed", message: failureMessage(error) });
    }
  } finally {
    controllers.delete(item.id);
  }
}

// SPEC-005 R-10: 서버 오류는 code의 문구, 저장소 오류는 code가 없어 정한 문구를 쓴다.
function failureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return messageForCode(error.code);
  }
  if (error instanceof StorageError) {
    return UPLOAD_STORAGE_MESSAGE;
  }
  return GENERIC_ERROR_MESSAGE;
}

function notifyVideosChanged() {
  videosChangedListeners.forEach((listener) => {
    listener();
  });
}

function remove(id: string) {
  entries = entries.filter((entry) => entry.item.id !== id);
  publish();
}

/**
 * 기다리거나 올리고 있는 파일을 멈추고 대기열에서 뺀다(SPEC-005 R-12). 업로드 자리를 이미 받았으면 그 영상을 지운다.
 * 삭제가 실패해도 그 영상은 24시간 뒤 만료되므로 다시 시도하지 않는다.
 */
export function cancelUpload(id: string): void {
  const entry = entries.find((candidate) => candidate.item.id === id);
  if (entry === undefined) {
    return;
  }
  controllers.get(id)?.abort();
  remove(id);
  const { videoId } = entry.item;
  if (videoId !== undefined) {
    void deleteVideo(videoId)
      .catch(() => undefined)
      .then(notifyVideosChanged);
  }
}

/** 실패한 파일을 대기열 끝에 다시 넣어 새 업로드 자리로 처음부터 올린다(SPEC-005 R-11). */
export function retryUpload(id: string): void {
  const entry = entries.find((candidate) => candidate.item.id === id);
  if (entry?.item.status !== "failed") {
    return;
  }
  const item: UploadItem = {
    id: entry.item.id,
    fileName: entry.item.fileName,
    sizeBytes: entry.item.sizeBytes,
    status: "waiting",
    loadedBytes: 0,
  };
  entries = [...entries.filter((candidate) => candidate !== entry), { ...entry, item }];
  publish();
  void runQueue();
}

/** 끝난(완료·실패·거절) 파일을 대기열 표시에서 뺀다. */
export function dismissUpload(id: string): void {
  const entry = entries.find((candidate) => candidate.item.id === id);
  if (entry !== undefined && !["waiting", "uploading"].includes(entry.item.status)) {
    remove(id);
  }
}

let retryDelaysMs: readonly number[] | undefined;

/** 테스트에서 저장소 재시도 대기(1·2·4초)를 줄인다. */
export function setRetryDelaysForTest(delays: readonly number[] | undefined): void {
  retryDelaysMs = delays;
}

export function getUploads(): readonly UploadItem[] {
  return snapshot;
}

/** 대기열이 바뀔 때마다 listener를 부른다. 반환한 함수로 구독을 끝낸다. */
export function subscribeUploads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 업로드를 마치거나 취소로 영상을 지워 목록이 바뀌었음을 알린다. 목록 query를 무효화하는 데 쓴다. */
export function onVideosChanged(listener: () => void): () => void {
  videosChangedListeners.add(listener);
  return () => {
    videosChangedListeners.delete(listener);
  };
}

/** 진행 중인 업로드를 중단하고 대기열을 비운다. */
export function clearUploads(): void {
  generation++;
  controllers.forEach((controller) => {
    controller.abort();
  });
  controllers.clear();
  entries = [];
  running = false;
  publish();
}

export function resetUploadsForTest(): void {
  clearUploads();
  videosChangedListeners.clear();
  retryDelaysMs = undefined;
}
