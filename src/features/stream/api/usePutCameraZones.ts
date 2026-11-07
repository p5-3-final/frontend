import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CameraZoneList } from "../model/cameraZones";
import { streamQueryKeys } from "../model/queryKeys";
import { putCameraZones } from "./cameraZonesApi";

/** 카메라 구역 저장(SPEC-032 R-16). 응답으로 구역 캐시를 바꾼다. */
export function usePutCameraZones(cameraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (list: CameraZoneList) => putCameraZones(cameraId, list),
    onSuccess: (list) => {
      queryClient.setQueryData(streamQueryKeys.cameraZones(cameraId), list);
    },
  });
}
