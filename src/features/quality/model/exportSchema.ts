import { z } from "zod";
import type { CreateFeatureExportRequest } from "./schemas";
import { periodError } from "./trendQuery";

/** 특징 내보내기 대상. 계약은 goldenSetId와 from·to 중 하나만 받는다(SPEC-035 R-19). */
export const EXPORT_MODES = ["golden", "period"] as const;

/** 특징 내보내기 폼. 고른 방식의 값만 검증하고 보낸다. */
export const exportFormSchema = z
  .object({
    mode: z.enum(EXPORT_MODES),
    goldenSetId: z.string(),
    from: z.string(),
    to: z.string(),
  })
  .superRefine((values, context) => {
    if (values.mode === "golden") {
      if (values.goldenSetId === "") {
        context.addIssue({
          code: "custom",
          path: ["goldenSetId"],
          message: "Golden Set을 골라 주세요.",
        });
      }
      return;
    }
    const error = periodError(values.from, values.to);
    if (error !== null) {
      context.addIssue({ code: "custom", path: ["to"], message: error });
    }
  })
  .transform((values): CreateFeatureExportRequest =>
    values.mode === "golden"
      ? { goldenSetId: values.goldenSetId }
      : { from: values.from, to: values.to },
  );

export type ExportFormValues = z.input<typeof exportFormSchema>;
