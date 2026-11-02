import { z } from "zod";
import type { components } from "../../../api/generated/auth-service";

// 서버(SPEC-001 R-3~R-5, auth-service SignUpRequest)와 같은 규칙으로 미리 검사한다(SPEC-002 R-2).
const PASSWORD_MESSAGE = "비밀번호는 8~64자이고 영문과 숫자를 모두 포함해야 합니다.";
const NICKNAME_MESSAGE = "닉네임은 2~20자의 한글, 영문, 숫자만 쓸 수 있습니다.";

export const signUpSchema = z.object({
  email: z
    .email("올바른 이메일 주소를 입력해 주세요.")
    .max(254, "올바른 이메일 주소를 입력해 주세요."),
  password: z
    .string()
    .min(8, PASSWORD_MESSAGE)
    .max(64, PASSWORD_MESSAGE)
    .regex(/[A-Za-z]/, PASSWORD_MESSAGE)
    .regex(/[0-9]/, PASSWORD_MESSAGE),
  nickname: z
    .string()
    .min(2, NICKNAME_MESSAGE)
    .max(20, NICKNAME_MESSAGE)
    .regex(/^[가-힣A-Za-z0-9]+$/, NICKNAME_MESSAGE),
}) satisfies z.ZodType<components["schemas"]["SignUpRequest"]>;

export type SignUpValues = z.infer<typeof signUpSchema>;

/** 계약 UserResponse */
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  nickname: z.string(),
  roles: z.array(z.enum(["USER", "OPERATOR", "ADMIN"])),
}) satisfies z.ZodType<components["schemas"]["UserResponse"]>;

export type User = z.infer<typeof userSchema>;
