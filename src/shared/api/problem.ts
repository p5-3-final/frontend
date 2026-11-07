import { z } from "zod";

export interface FieldError {
  field: string;
  message: string;
}

/** api-gateway·서비스가 돌려준 오류. `code`는 ProblemDetail 응답일 때만 있다. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly fieldErrors: FieldError[] = [],
    readonly traceId?: string,
    /** ProblemDetail `detail`. 서버가 위반 이유를 사람이 읽을 문장으로 줄 때 쓴다(SPEC-032 R-12). */
    readonly detail?: string,
  ) {
    super(`API request failed with status ${String(status)}`);
    this.name = "ApiError";
  }
}

// 계약 _common.yaml ProblemDetail에서 화면에 필요한 필드만 검증한다.
const problemSchema = z.object({
  code: z.string(),
  traceId: z.string().optional(),
  detail: z.string().optional(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
});

/** 실패 응답을 {@link ApiError}로 바꾼다. 본문이 ProblemDetail이 아니면 `code` 없이 상태만 담는다. */
export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const problem = problemSchema.safeParse(body);
  if (!problem.success) {
    return new ApiError(response.status, undefined);
  }
  return new ApiError(
    response.status,
    problem.data.code,
    problem.data.errors ?? [],
    problem.data.traceId,
    problem.data.detail,
  );
}
