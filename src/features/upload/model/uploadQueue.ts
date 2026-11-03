import { uploadVideo } from "../api/uploadVideo";
import { checkVideoFile } from "./fileRules";
import type { Video, VideoContentType } from "./schemas";

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
let activeUpload: AbortController | undefined;
const listeners = new Set<() => void>();
const uploadedListeners = new Set<(video: Video) => void>();

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
  activeUpload = controller;
  const video = await uploadVideo(file, contentType, {
    signal: controller.signal,
    onCreated: (videoId) => {
      update(item.id, { videoId });
    },
    onProgress: (loadedBytes) => {
      update(item.id, { loadedBytes });
    },
  });
  update(item.id, { status: "done", loadedBytes: file.size });
  uploadedListeners.forEach((listener) => {
    listener(video);
  });
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

/** 업로드를 마친 영상을 알린다. 목록 query를 무효화하는 데 쓴다. */
export function onVideoUploaded(listener: (video: Video) => void): () => void {
  uploadedListeners.add(listener);
  return () => {
    uploadedListeners.delete(listener);
  };
}

/** 진행 중인 업로드를 중단하고 대기열을 비운다. */
export function clearUploads(): void {
  generation++;
  activeUpload?.abort();
  activeUpload = undefined;
  entries = [];
  running = false;
  publish();
}

export function resetUploadsForTest(): void {
  clearUploads();
  uploadedListeners.clear();
}
