import { z } from "zod";
import { apiRequest } from "../../../shared/api/client";
import type { components } from "../../../api/generated/auth-service";

// 계약 auth-service.yaml SseTicketResponse. 30초 1회용이라 받은 즉시 연결에만 쓰고 저장하지 않는다(NFR-3).
const sseTicketSchema = z.object({
  ticket: z.string(),
  expiresIn: z.number(),
}) satisfies z.ZodType<components["schemas"]["SseTicketResponse"]>;

/** SSE 티켓 발급(operationId issueSseTicket). 접근 토큰이 만료됐으면 재발급 후 한 번 다시 보낸다. */
export async function issueSseTicket(signal?: AbortSignal): Promise<string> {
  const body = await apiRequest("/api/v1/auth/sse-tickets", sseTicketSchema, {
    method: "POST",
    signal,
  });
  return body.ticket;
}
