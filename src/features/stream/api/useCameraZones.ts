import { useQuery } from "@tanstack/react-query";
import { streamQueryKeys } from "../model/queryKeys";
import { getCameraZones } from "./cameraZonesApi";

/** 카메라 구역 목록(SPEC-032 R-16) */
export function useCameraZones(cameraId: string) {
  return useQuery({
    queryKey: streamQueryKeys.cameraZones(cameraId),
    queryFn: () => getCameraZones(cameraId),
  });
}
