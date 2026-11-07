import { z } from "zod";
import { GOLDEN_SPLITS } from "./schemas";

/** 계약 CreateGoldenSetRequest.name 형식 */
export const GOLDEN_SET_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
export const DESCRIPTION_MAX_LENGTH = 500;

/** Golden Set 만들기 폼(SPEC-035 R-8) */
export const createGoldenSetSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(
      GOLDEN_SET_NAME_PATTERN,
      "이름은 소문자·숫자로 시작하고 소문자·숫자·하이픈만 63자까지 쓸 수 있습니다.",
    ),
  split: z.enum(GOLDEN_SPLITS),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, "설명은 500자까지 쓸 수 있습니다.")
    .transform((value) => (value.trim() === "" ? null : value)),
});

export type CreateGoldenSetValues = z.input<typeof createGoldenSetSchema>;
