import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../shared/api/client";
import { userSchema, type SignUpValues } from "../model/schemas";

/** 가입 요청(계약 operationId signUp). */
export function useSignUp() {
  return useMutation({
    mutationFn: (values: SignUpValues) =>
      apiRequest("/api/v1/auth/signup", userSchema, { method: "POST", body: values }),
  });
}
