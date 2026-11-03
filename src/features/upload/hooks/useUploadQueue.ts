import { useSyncExternalStore } from "react";
import { getUploads, subscribeUploads, type UploadItem } from "../model/uploadQueue";

/** 업로드 대기열을 구독한다. */
export function useUploadQueue(): readonly UploadItem[] {
  return useSyncExternalStore(subscribeUploads, getUploads);
}
