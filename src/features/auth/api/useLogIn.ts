import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../shared/api/client";
import { startSession } from "../../../shared/api/session";
import { tokenSchema, type LogInValues } from "../model/schemas";

/** 로그인 요청(계약 operationId logIn). 성공하면 접근 토큰으로 세션을 시작한다. */
export function useLogIn() {
  return useMutation({
    mutationFn: (values: LogInValues) =>
      apiRequest("/api/v1/auth/login", tokenSchema, { method: "POST", body: values }),
    onSuccess: (token) => {
      startSession(token.accessToken);
    },
  });
}
