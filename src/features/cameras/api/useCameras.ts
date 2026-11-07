import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cameraQueryKeys } from "../model/queryKeys";
import type { CameraCreateRequest } from "../model/schemas";
import { CAMERA_POLL_MS } from "../model/status";
import { createCamera, listCameras } from "./camerasApi";

/** 카메라 한 쪽(SPEC-034 R-13). 상태를 15초마다 다시 읽는다. */
export function useCameras(page: number) {
  return useQuery({
    queryKey: cameraQueryKeys.list(page),
    queryFn: () => listCameras(page),
    placeholderData: keepPreviousData,
    refetchInterval: CAMERA_POLL_MS,
  });
}

/** 카메라 등록(SPEC-034 R-13). 성공하면 목록을 다시 읽는다. */
export function useCreateCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CameraCreateRequest) => createCamera(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cameraQueryKeys.lists() }),
  });
}
