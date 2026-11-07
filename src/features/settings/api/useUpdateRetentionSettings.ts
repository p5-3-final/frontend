import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "../model/queryKeys";
import type { RetentionSettings } from "../model/schemas";
import { updateRetentionSettings } from "./settingsApi";

/**
 * 보존 기본값 바꾸기(SPEC-034 R-9). 누르자마자 화면 값을 바꾸고, 실패하면 이전 값으로 되돌린다.
 */
export function useUpdateRetentionSettings() {
  const queryClient = useQueryClient();
  const key = settingsQueryKeys.settings();
  return useMutation({
    mutationFn: (settings: RetentionSettings) => updateRetentionSettings(settings),
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<RetentionSettings>(key);
      queryClient.setQueryData(key, settings);
      return { previous };
    },
    onError: (_error, _settings, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
    },
  });
}
