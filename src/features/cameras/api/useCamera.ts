import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cameraQueryKeys } from "../model/queryKeys";
import { CAMERA_POLL_MS } from "../model/status";
import { getCamera, listCameraSessions, startSession, stopSession } from "./camerasApi";

/** 카메라 상세(SPEC-034 R-13). 상태를 15초마다 다시 읽는다. */
export function useCamera(cameraId: string) {
  return useQuery({
    queryKey: cameraQueryKeys.detail(cameraId),
    queryFn: () => getCamera(cameraId),
    refetchInterval: CAMERA_POLL_MS,
  });
}

/** 카메라 세션 이력(SPEC-034 R-14). 카메라 상세와 같은 간격으로 다시 읽는다. */
export function useCameraSessions(cameraId: string) {
  return useQuery({
    queryKey: cameraQueryKeys.sessions(cameraId),
    queryFn: () => listCameraSessions(cameraId),
    refetchInterval: CAMERA_POLL_MS,
  });
}

// start·stop 뒤에는 카메라 상태와 세션 이력이 함께 바뀐다.
function useInvalidateCamera(cameraId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cameraQueryKeys.detail(cameraId) }),
      queryClient.invalidateQueries({ queryKey: cameraQueryKeys.lists() }),
    ]);
}

/** 수집 세션 시작(SPEC-034 R-13) */
export function useStartSession(cameraId: string) {
  const invalidate = useInvalidateCamera(cameraId);
  return useMutation({ mutationFn: () => startSession(cameraId), onSettled: invalidate });
}

/** 수집 세션 중지(SPEC-034 R-13) */
export function useStopSession(cameraId: string) {
  const invalidate = useInvalidateCamera(cameraId);
  return useMutation({
    mutationFn: (sessionId: string) => stopSession(sessionId),
    onSettled: invalidate,
  });
}
