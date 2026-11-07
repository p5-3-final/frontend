import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "../model/queryKeys";
import { getRetentionSettings } from "./settingsApi";

/** 학습용 보존 기본값(SPEC-034 R-9) */
export function useRetentionSettings() {
  return useQuery({ queryKey: settingsQueryKeys.settings(), queryFn: getRetentionSettings });
}
