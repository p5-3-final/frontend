import { z } from "zod";
import type { CreateDatasetImportRequest } from "./schemas";

/** 계약 CreateDatasetImportRequest.manifestKey 형식(가져오기 버킷의 매니페스트 경로) */
export const MANIFEST_KEY_PATTERN = /^imports\/[A-Za-z0-9._-]{1,100}\/manifest[.]json$/;

/** 데이터셋 가져오기 폼(SPEC-035 R-16). 숫자 칸은 문자열로 받아 계약 요청으로 바꾼다. */
export const createImportSchema = z
  .object({
    manifestKey: z
      .string()
      .trim()
      .regex(MANIFEST_KEY_PATTERN, "imports/<폴더>/manifest.json 형식으로 넣어 주세요."),
    evalRatio: z.coerce
      .number({ message: "평가 비율은 0 이상 1 이하입니다." })
      .min(0, "평가 비율은 0 이상 1 이하입니다.")
      .max(1, "평가 비율은 0 이상 1 이하입니다."),
    splitSeed: z.coerce
      .number({ message: "분할 시드는 0 이상의 정수입니다." })
      .int("분할 시드는 0 이상의 정수입니다.")
      .min(0, "분할 시드는 0 이상의 정수입니다."),
  })
  .transform((values): CreateDatasetImportRequest => values);

export type CreateImportValues = z.input<typeof createImportSchema>;
